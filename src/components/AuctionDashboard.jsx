import React, { Component } from 'react';
import { ref, update, onValue, runTransaction } from 'firebase/database';
import { db } from '../firebase';

class AuctionDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomData: null,
            localTimer: 20,
            bidHistory: [],
            serverTimeOffset: 0,
            soldCelebration: null,
            unsoldCelebration: null,
            isProcessingSold: false,
            currentPlayerImage: null,
        };
        this.timerInterval = null;
        this.roomRef = db && this.props.roomCode ? ref(db, `rooms/${this.props.roomCode}`) : null;
    }

    componentDidMount() {
        if (db && this.roomRef) {
            this.listenToRoom();
            this.listenToServerOffset();
        }
        this.startLocalTimer();
    }

    listenToServerOffset = () => {
        const offsetRef = ref(db, ".info/serverTimeOffset");
        onValue(offsetRef, (snap) => {
            this.setState({ serverTimeOffset: snap.val() || 0 });
        });
    };

    componentDidUpdate(prevProps, prevState) {
        // Auto-trigger sold when timer reaches 0
        if (
            this.props.isHost && // Only host handles the auto-transition to avoid race conditions
            prevState.localTimer > 0 &&
            this.state.localTimer === 0 &&
            this.state.roomData &&
            this.state.roomData.status === 'active' &&
            !this.state.isProcessingSold
        ) {
            this.setState({ isProcessingSold: true }, () => {
                setTimeout(() => this.handleSold(), 2000);
            });
        }
    }

    componentWillUnmount() {
        clearInterval(this.timerInterval);
        if (this.roomListener) this.roomListener();
    }

    listenToRoom = () => {
        if (!db || !this.roomRef) return;
        this.roomListener = onValue(this.roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const prevIndex = this.state.roomData ? this.state.roomData.currentPlayerIndex : -1;
                this.setState({ roomData: data });

                if (data.currentPlayerIndex !== prevIndex && this.props.players[data.currentPlayerIndex]) {
                    this.fetchPlayerImage(this.props.players[data.currentPlayerIndex].name);
                }

                // Convert history object to array
                const history = data.bidHistory ? Object.values(data.bidHistory).reverse() : [];
                this.setState({ bidHistory: history });
            }
        });
    };

    fetchPlayerImage = async (playerName) => {
        this.setState({ currentPlayerImage: null });
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(playerName)}&origin=*`);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].original) {
                this.setState({ currentPlayerImage: pages[pageId].original.source });
            }
        } catch (error) {
            console.error("Failed to fetch player image:", error);
        }
    };

    startLocalTimer = () => {
        this.timerInterval = setInterval(() => {
            const { roomData, serverTimeOffset } = this.state;
            if (roomData && roomData.endTime && roomData.status === 'active' && !roomData.paused) {
                const now = Date.now() + serverTimeOffset;
                const remaining = Math.max(0, Math.round((roomData.endTime - now) / 1000));
                this.setState({ localTimer: remaining });
            } else if (roomData && roomData.status !== 'active') {
                this.setState({ localTimer: 20 });
            }
        }, 1000);
    };

    handleWait = async () => {
        if (!this.roomRef || this.state.roomData?.paused) return;
        await update(this.roomRef, { paused: true });
    };

    handleResume = async () => {
        if (!this.roomRef || !this.state.roomData?.paused) return;
        
        // Add remaining time back to now to get new end time
        const { serverTimeOffset, localTimer } = this.state;
        const now = Date.now() + serverTimeOffset;
        const newEndTime = now + (localTimer * 1000);

        await update(this.roomRef, { 
            paused: false,
            endTime: newEndTime
        });
    };

    // Check if a team can no longer bid (full squad or insufficient purse)
    isTeamInactive = (team, minBidPrice) => {
        const playerCount = team.players ? team.players.length : 0;
        if (playerCount >= 18) return true;
        if (team.purse < minBidPrice) return true;
        return false;
    };

    handleBid = async (team) => {
        const { roomData, localTimer } = this.state;
        if (!roomData || localTimer <= 0) return;

        const increment = 1;
        const currentBid = roomData.currentBid || this.props.players[roomData.currentPlayerIndex].basePrice;
        const newBid = roomData.highestBidderId ? currentBid + increment : currentBid;

        if (team.purse < newBid) {
            alert(`${team.name} doesn't have enough purse!`);
            return;
        }

        // Use transaction to ensure atomic bid updates
        try {
            if (!db || !this.roomRef) {
                alert("Firebase is not configured properly.");
                return;
            }
            await runTransaction(this.roomRef, (currentData) => {
                if (currentData) {
                    const bidTime = Date.now();
                    let newEndTime = currentData.endTime;

                    // Extend timer if in last 5 seconds
                    const rem = Math.max(0, Math.floor((newEndTime - bidTime) / 1000));
                    if (rem <= 5) {
                        newEndTime = bidTime + (rem + 5) * 1000;
                    }

                    currentData.currentBid = newBid;
                    currentData.highestBidderId = team.id;
                    currentData.highestBidderName = team.name;
                    currentData.endTime = newEndTime;

                    // Update history
                    if (!currentData.bidHistory) currentData.bidHistory = {};
                    const historyKey = `bid_${bidTime}`;
                    currentData.bidHistory[historyKey] = {
                        teamName: team.name,
                        amount: newBid,
                        time: new Date().toLocaleTimeString()
                    };
                }
                return currentData;
            });
        } catch (error) {
            console.error("Bid transaction failed:", error);
        }
    };

    // Helper to finish auction and transition to transfer phase
    finishAuction = async () => {
        const { roomData } = this.state;
        const teamsWithValidation = roomData.teams.map(t => ({
            ...t,
            qualified: (t.players ? t.players.length : 0) >= 11
        }));
        await update(this.roomRef, { 
            status: 'transfer',
            teams: teamsWithValidation
        });
    };

    // Logic to start the auction for a player (only callable by host or via trigger)
    startAuctionForPlayer = async (index) => {
        let playerIndex = index;

        // Random selection logic if index is -1 (trigger for random)
        if (index === -1) {
            const { roomData } = this.state;
            const unsoldPlayers = roomData.unsoldPlayers || [];
            const isReAuction = roomData.auctionRound === 're-auction';

            // Check if all teams are inactive (full squad or broke)
            const minBasePrice = isReAuction
                ? Math.min(...unsoldPlayers.map(p => Math.max(0.5, Math.floor(p.basePrice * 0.5 * 10) / 10)))
                : Math.min(...this.props.players.map(p => p.basePrice));
            const allTeamsInactive = roomData.teams.every(t => this.isTeamInactive(t, minBasePrice || 0.5));
            if (allTeamsInactive) {
                await this.finishAuction();
                return;
            }

            if (isReAuction) {
                // RE-AUCTION MODE: pick from unsoldPlayers
                if (unsoldPlayers.length === 0) {
                    // Re-auction finished
                    await update(this.roomRef, { reAuctionDone: true });
                    await this.finishAuction();
                    return;
                }

                // Pick a random unsold player
                const pickIdx = Math.floor(Math.random() * unsoldPlayers.length);
                const unsoldPlayer = unsoldPlayers[pickIdx];
                const reAuctionBasePrice = Math.max(0.5, Math.floor(unsoldPlayer.basePrice * 0.5 * 10) / 10);

                // Find the original player index in the main players array
                const originalIndex = this.props.players.findIndex(p => p.name === unsoldPlayer.name);

                // Remove picked player from unsoldPlayers
                const updatedUnsold = unsoldPlayers.filter((_, i) => i !== pickIdx);

                const { serverTimeOffset } = this.state;
                const now = Date.now() + serverTimeOffset;
                const endTime = now + 20000;

                this.setState({ isProcessingSold: false });

                try {
                    await update(this.roomRef, {
                        currentPlayerIndex: originalIndex,
                        currentBid: reAuctionBasePrice,
                        reAuctionBasePrice: reAuctionBasePrice,
                        highestBidderId: null,
                        highestBidderName: null,
                        endTime: endTime,
                        status: 'active',
                        bidHistory: null,
                        unsoldPlayers: updatedUnsold.length > 0 ? updatedUnsold : null,
                    });
                    console.log("Re-auction started for player", unsoldPlayer.name, "at base", reAuctionBasePrice);
                } catch (error) {
                    console.error("Failed to start re-auction:", error);
                }
                return;
            }

            // MAIN AUCTION MODE
            const availableIndices = this.props.players
                .map((p, i) => ({ ...p, originalIndex: i }))
                .filter(p => {
                    const isSold = roomData.teams.some(team =>
                        team.players && team.players.some(tp => tp.name === p.name)
                    );
                    const isUnsold = unsoldPlayers.some(up => up.name === p.name);
                    return !isSold && !isUnsold;
                })
                .map(p => p.originalIndex);

            if (availableIndices.length === 0) {
                // Main auction exhausted — check for unsold players to start re-auction
                if (unsoldPlayers.length > 0 && !roomData.reAuctionDone) {
                    await update(this.roomRef, { auctionRound: 're-auction' });
                    // Recursively call to pick from unsold
                    this.startAuctionForPlayer(-1);
                    return;
                }
                await this.finishAuction();
                return;
            }
            playerIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }

        const player = this.props.players[playerIndex];
        const { serverTimeOffset } = this.state;
        const now = Date.now() + serverTimeOffset;
        const endTime = now + 20000;

        this.setState({ isProcessingSold: false });

        try {
            await update(this.roomRef, {
                currentPlayerIndex: playerIndex,
                currentBid: player.basePrice,
                reAuctionBasePrice: null,
                highestBidderId: null,
                highestBidderName: null,
                endTime: endTime,
                status: 'active',
                bidHistory: null
            });
            console.log("Auction started for player", playerIndex);
        } catch (error) {
            console.error("Failed to start auction:", error);
            alert("Error: " + error.message);
        }
    };

    handleSold = async () => {
        const { roomData } = this.state;
        if (!roomData) return;

        const player = this.props.players[roomData.currentPlayerIndex];
        const bidderId = roomData.highestBidderId;

        if (bidderId) {
            const updatedTeams = roomData.teams.map(t => {
                if (t.id === bidderId) {
                    return {
                        ...t,
                        purse: t.purse - roomData.currentBid,
                        players: [...(t.players || []), { ...player, soldPrice: roomData.currentBid }]
                    };
                }
                return t;
            });

            const buyingTeam = roomData.teams.find(t => t.id === bidderId);
            this.setState({
                soldCelebration: {
                    playerName: player.name,
                    teamName: buyingTeam ? buyingTeam.name : 'Unknown',
                    price: roomData.currentBid,
                    role: player.role,
                    rating: player.rating,
                }
            });

            await update(this.roomRef, {
                teams: updatedTeams,
                status: 'waiting'
            });

            // Auto-dismiss and start next
            setTimeout(() => {
                this.setState({ soldCelebration: null });
                this.startAuctionForPlayer(-1);
            }, 3000);
        } else {
            // UNSOLD — no bids were placed
            const unsoldPlayers = roomData.unsoldPlayers || [];
            const isReAuction = roomData.auctionRound === 're-auction';

            // Show unsold celebration
            this.setState({
                unsoldCelebration: {
                    playerName: player.name,
                    role: player.role,
                    rating: player.rating,
                }
            });

            if (!isReAuction) {
                // Add to unsold list during main auction
                const updatedUnsold = [...unsoldPlayers, { name: player.name, basePrice: player.basePrice, role: player.role, rating: player.rating }];
                await update(this.roomRef, {
                    status: 'waiting',
                    unsoldPlayers: updatedUnsold,
                });
            } else {
                // During re-auction, permanently unsold — just move on
                await update(this.roomRef, {
                    status: 'waiting'
                });
            }

            // Auto-dismiss and start next
            setTimeout(() => {
                this.setState({ unsoldCelebration: null });
                this.startAuctionForPlayer(-1);
            }, 2500);
        }
    };

    render() {
        const { roomData, localTimer, bidHistory, soldCelebration, unsoldCelebration } = this.state;
        if (!roomData) return <div className="container text-center text-secondary">Loading Room Data...</div>;

        const players = this.props.players;
        const player = players[roomData.currentPlayerIndex];
        const displayImage = this.state.currentPlayerImage || player.image;
        const teams = roomData.teams || [];
        const unsoldPlayers = roomData.unsoldPlayers || [];
        const isReAuction = roomData.auctionRound === 're-auction';
        const effectiveBasePrice = roomData.reAuctionBasePrice || player.basePrice;

        if (roomData.status === 'finished') {
            return (
                <div className="container text-center pt-20">
                    <h2 className="gradient-text text-5xl mb-8">Auction Concluded!</h2>
                    <button className="btn btn-primary px-8 py-4 text-lg" onClick={() => this.props.setView('results')}>View Final Squads</button>
                </div>
            );
        }

        return (
            <div className="auction-grid animate-fade-in">
                {/* Re-Auction Round Banner */}
                {isReAuction && (
                    <div className="reauction-banner">
                        <span className="reauction-banner-icon">🔄</span>
                        RE-AUCTION ROUND — Unsold Players
                    </div>
                )}
                {/* Sold Celebration Overlay */}
                {soldCelebration && (
                    <div className="sold-overlay" onClick={() => this.setState({ soldCelebration: null })}>
                        <div className="sold-card">
                            <div className="sold-confetti">
                                <span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span>
                            </div>
                            <span className="sold-emoji">🎉</span>
                            <div className="sold-title">Congratulations!</div>
                            <div className="sold-player-name">{soldCelebration.playerName}</div>
                            <div className="sold-team-name">Sold to {soldCelebration.teamName}</div>
                            <div className="sold-price">{soldCelebration.price} Cr</div>
                            <div className="sold-details">
                                <span className="sold-detail-chip">{soldCelebration.role}</span>
                                <span className="sold-detail-chip">⭐ {soldCelebration.rating}</span>
                            </div>
                            <button className="btn btn-outline px-8 py-2"
                                onClick={(e) => { e.stopPropagation(); this.setState({ soldCelebration: null }); }}
                            >Continue</button>
                        </div>
                    </div>
                )}

                {/* Unsold Overlay */}
                {unsoldCelebration && (
                    <div className="unsold-overlay" onClick={() => this.setState({ unsoldCelebration: null })}>
                        <div className="unsold-card">
                            <span className="unsold-emoji">😔</span>
                            <div className="unsold-title">UNSOLD</div>
                            <div className="sold-player-name">{unsoldCelebration.playerName}</div>
                            <div className="unsold-subtitle">No bids received</div>
                            <div className="sold-details">
                                <span className="sold-detail-chip">{unsoldCelebration.role}</span>
                                <span className="sold-detail-chip">⭐ {unsoldCelebration.rating}</span>
                            </div>
                            {!isReAuction && <div className="unsold-note">Will return in Re-Auction Round</div>}
                        </div>
                    </div>
                )}

                {/* Left: Player Card */}
                <div className="glass p-6 flex flex-col gap-4 mobile-order-2">
                    <div className="player-image-container">
                        <img src={displayImage} alt={player.name} />
                        <div className="player-rating-badge">
                            {player.rating}
                        </div>
                    </div>
                    <h2 className="text-2xl text-accent font-bold mt-2">{player.name}</h2>
                    <div className="text-secondary text-sm font-semibold uppercase tracking-wide">
                        Role: <span className="text-primary">{player.role}</span>
                    </div>
                    <div className="text-secondary text-sm font-semibold uppercase tracking-wide">
                        Base Price: <span className="text-primary">{effectiveBasePrice} Cr</span>
                        {isReAuction && <span className="text-xs text-warning ml-2">(Reduced)</span>}
                    </div>

                    {player.stats && (
                        <div className="stat-box mt-2">
                            <div className="text-xs text-accent font-bold mb-3 tracking-widest">CAREER STATS</div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>MTS: <span className="font-bold text-white">{player.stats.matches}</span></div>
                                {player.role !== 'Bowler' && <div>RUNS: <span className="font-bold text-white">{player.stats.runs}</span></div>}
                                {player.role !== 'Bowler' && <div>SR: <span className="font-bold text-white">{player.stats.strikeRate}</span></div>}
                                {player.role !== 'Batsman' && player.role !== 'Wicketkeeper' && <div>WKTS: <span className="font-bold text-white">{player.stats.wickets}</span></div>}
                                {player.role !== 'Batsman' && player.role !== 'Wicketkeeper' && <div>ECO: <span className="font-bold text-white">{player.stats.economy}</span></div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin Controls */}
                {this.props.isHost && roomData.status === 'waiting' && !this.state.isProcessingSold && !this.state.soldCelebration && (
                    <div className="absolute inset-0 bg-dark bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
                        <div className="glass p-12 text-center max-w-sm">
                            <h2 className="text-3xl font-black text-accent mb-6 tracking-widest uppercase">Ready to Auction?</h2>
                            <p className="text-secondary mb-8">Click below to start the auction for the next player.</p>
                            <button className="btn btn-primary w-full py-4 text-xl font-bold animate-pulse shadow-lg" onClick={() => this.startAuctionForPlayer(-1)}>
                                START AUCTION
                            </button>
                        </div>
                    </div>
                )}

                {/* Center: Bid Control */}
                <div className="flex flex-col gap-6 mobile-order-1">
                    {/* Top: Timer */}
                    <div className={`glass text-center p-6 relative ${roomData.status === 'active' ? 'border-accent' : ''}`}>
                        <div className="text-lg text-secondary font-bold tracking-widest uppercase mb-2">
                            {roomData.status === 'active' ? 'TIME REMAINING' : 'AUCTION STATUS'}
                        </div>
                        <div className={`text-6xl font-black ${localTimer <= 5 && roomData.status === 'active' ? 'text-danger' : 'text-accent'} ${localTimer <= 5 && localTimer > 0 && roomData.status === 'active' ? 'animate-pulse' : ''}`}>
                            {roomData.status === 'active' ? `${localTimer}s` : roomData.status.toUpperCase()}
                        </div>
                        {roomData.paused && (
                            <div className="absolute inset-0 bg-dark bg-opacity-90 flex flex-col items-center justify-center z-20 animate-fade-in rounded-lg">
                                <div className="text-warning text-2xl font-black tracking-widest mb-4">AUCTION PAUSED</div>
                                {this.props.isHost && (
                                    <button className="btn btn-primary px-8 py-2 font-bold" onClick={this.handleResume}>
                                        RESUME AUCTION
                                    </button>
                                )}
                            </div>
                        )}
                        {localTimer === 0 && roomData.status === 'active' && !roomData.paused && (
                            <div className="absolute inset-0 bg-dark opacity-90 rounded-lg flex items-center justify-center z-10 animate-fade-in" style={{ opacity: 0.95 }}>
                                <div className="text-2xl font-black text-accent tracking-wider animate-pulse">
                                    {this.state.isProcessingSold ? 'PROCESSING...' : 'TIME UP!'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Bid */}
                    <div className="glass text-center p-8 sm:p-10 flex-1 flex flex-col justify-center relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-50"></div>
                        <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
                        <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
                            {roomData.currentBid || effectiveBasePrice} <span className="text-3xl text-secondary">Cr</span>
                        </div>
                        {roomData.highestBidderName && (
                            <div className="mt-4 text-success font-bold text-xl tracking-wide bg-success-light inline-block mx-auto px-6 py-2 rounded-full border border-success border-opacity-30">
                                BID BY: {roomData.highestBidderName}
                            </div>
                        )}

                        <div className="mt-8 flex-1 flex flex-col justify-center min-h-0">
                            <div className="flex flex-col gap-4 items-center mb-4">
                                {teams.map(team => {
                                    if (team.id !== this.props.myTeamId) return null;

                                    const currentBidPrice = roomData.currentBid || player.basePrice;
                                    const isInactive = this.isTeamInactive(team, currentBidPrice);
                                    const isSquadFull = team.players && team.players.length >= 18;
                                    const isHighestBidder = roomData.highestBidderId === team.id;
                                    const isPaused = roomData.paused;
                                    
                                    const btnClass = "btn px-8 py-5 text-xl min-w-[300px]";

                                    return (
                                        <div key={team.id} className="flex flex-col gap-3">
                                            <button
                                                className={`${btnClass} font-black transform hover:scale-105 transition-all shadow-xl ${isHighestBidder ? 'btn-outline border-2' : isInactive ? 'btn-outline opacity-50' : 'btn-primary'}`}
                                                onClick={() => this.handleBid(team)}
                                                disabled={roomData.status !== 'active' || localTimer === 0 || isInactive || isHighestBidder || isPaused}
                                            >
                                                {isSquadFull ? 'SQUAD FULL' : isInactive ? 'PURSE EXHAUSTED' : isHighestBidder ? `LATEST BID: ${team.name.toUpperCase()}` : `BID ${currentBidPrice} Cr`}
                                            </button>
                                            
                                            {roomData.status === 'active' && !isPaused && (
                                                <button 
                                                    className="btn btn-outline border-warning text-warning font-bold py-2 shadow-sm"
                                                    onClick={this.handleWait}
                                                >
                                                    ⏸ WAIT
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Bid History */}
                    <div className="glass h-full max-h-[180px] p-4 flex flex-col scrollable-panel">
                        <h4 className="mb-3 text-sm tracking-widest text-accent font-bold uppercase border-b border-white border-opacity-10 pb-2">LIVE BID HISTORY</h4>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {bidHistory.length === 0 ? (
                                <div className="text-secondary text-center mt-4 italic">Awaiting first bid...</div>
                            ) : (
                                bidHistory.map((bid, i) => (
                                    <div key={i} className="flex justify-between py-2 text-sm border-b border-white border-opacity-5 last:border-0 hover:bg-white hover:bg-opacity-5 px-2 rounded transition-colors">
                                        <span><span className="text-accent font-bold">{bid.teamName}</span> placed bid for <span className="font-bold">{bid.amount} Cr</span></span>
                                        <span className="text-secondary text-xs mt-1">{bid.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Teams List */}
                <div className="glass p-6 scrollable-panel mobile-order-3">
                    <h3 className="mb-6 text-center text-accent tracking-widest font-bold text-lg flex items-center justify-center gap-3">
                        TEAMS PURSE
                        {unsoldPlayers.length > 0 && (
                            <span className="unsold-badge">{unsoldPlayers.length} unsold</span>
                        )}
                    </h3>
                    <div className="flex flex-col gap-4">
                        {teams.map(team => {
                            const minBasePrice = Math.min(...this.props.players.map(p => p.basePrice));
                            const inactive = this.isTeamInactive(team, minBasePrice);
                            return (
                                <div key={team.id} className={`bg-panel p-4 rounded-lg border transition-all ${inactive ? 'border-danger border-opacity-30 opacity-60' : 'border-white border-opacity-5 hover:border-accent hover:border-opacity-30'}`}>
                                    <div className="flex justify-between mb-2 items-center">
                                        <span className="font-bold text-lg">
                                            {team.name}
                                            {team.qualified !== undefined ? (
                                                team.qualified ? 
                                                <span className="text-[10px] bg-success text-dark px-2 py-0.5 rounded ml-2 align-middle font-bold">✅ QUALIFIED</span> :
                                                <span className="text-[10px] bg-danger text-white px-2 py-0.5 rounded ml-2 align-middle font-bold">❌ DISQUALIFIED</span>
                                            ) : (
                                                inactive && <span className="text-xs bg-danger text-white px-2 py-1 rounded ml-2 align-middle">RESTING</span>
                                            )}
                                        </span>
                                        <span className="text-accent font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm">Cr</span></span>
                                    </div>
                                    <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${team.players && team.players.length >= 18 ? 'text-danger' : (team.players && team.players.length < 11 && roomData.status === 'finished') ? 'text-danger' : 'text-secondary'}`}>
                                        Squad: {team.players ? team.players.length : 0} / 11-18
                                    </div>
                                    {team.players && team.players.length > 0 && (
                                        <div className="border-t border-white border-opacity-10 pt-3 flex flex-col gap-2">
                                            {team.players.map((p, i) => (
                                                <div key={i} className="flex justify-between text-xs items-center p-1 hover:bg-white hover:bg-opacity-5 rounded">
                                                    <span className="font-medium">{p.name}</span>
                                                    <span className="text-accent font-bold bg-dark px-2 py-1 rounded">{p.soldPrice} Cr</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

export default AuctionDashboard;
