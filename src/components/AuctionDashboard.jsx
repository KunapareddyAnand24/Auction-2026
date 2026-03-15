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

    componentWillUnmount() {
        clearInterval(this.timerInterval);
        if (this.roomListener) this.roomListener();
    }

    listenToRoom = () => {
        if (!db || !this.roomRef) return;
        this.roomListener = onValue(this.roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.setState({ roomData: data });

                // Convert history object to array
                const history = data.bidHistory ? Object.values(data.bidHistory).reverse() : [];
                this.setState({ bidHistory: history });
            }
        });
    };

    startLocalTimer = () => {
        this.timerInterval = setInterval(() => {
            const { roomData, serverTimeOffset } = this.state;
            if (roomData && roomData.endTime && roomData.status === 'active') {
                const now = Date.now() + serverTimeOffset;
                const remaining = Math.max(0, Math.round((roomData.endTime - now) / 1000));
                this.setState({ localTimer: remaining });
            } else if (roomData && roomData.status !== 'active') {
                this.setState({ localTimer: 20 });
            }
        }, 1000);
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

    // Logic to start the auction for a player (only callable by host or via trigger)
    startAuctionForPlayer = async (index) => {
        let playerIndex = index;

        // Random selection logic if index is -1 (trigger for random)
        if (index === -1) {
            const { roomData } = this.state;
            const availableIndices = this.props.players
                .map((p, i) => ({ ...p, originalIndex: i }))
                .filter(p => {
                    // Check if sold already in any team
                    const isSold = roomData.teams.some(team =>
                        team.players && team.players.some(tp => tp.name === p.name)
                    );
                    return !isSold;
                })
                .map(p => p.originalIndex);

            if (availableIndices.length === 0) {
                await update(this.roomRef, { status: 'finished' });
                return;
            }
            playerIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }

        const player = this.props.players[playerIndex];
        const { serverTimeOffset } = this.state;
        const now = Date.now() + serverTimeOffset;
        const endTime = now + 20000; // 20s from synchronized now

        try {
            await update(this.roomRef, {
                currentPlayerIndex: playerIndex,
                currentBid: player.basePrice,
                highestBidderId: null,
                highestBidderName: null,
                endTime: endTime,
                status: 'active',
                bidHistory: null // clear history for new player
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
            await update(this.roomRef, {
                status: 'waiting'
            });
            this.startAuctionForPlayer(-1);
        }
    };

    render() {
        const { roomData, localTimer, bidHistory, soldCelebration } = this.state;
        if (!roomData) return <div className="container text-center text-secondary">Loading Room Data...</div>;

        const players = this.props.players;
        const player = players[roomData.currentPlayerIndex];
        const teams = roomData.teams || [];

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

                {/* Left: Player Card */}
                <div className="glass p-6 flex flex-col gap-4 mobile-order-2">
                    <div className="player-image-container">
                        <img src={player.image} alt={player.name} />
                        <div className="player-rating-badge">
                            {player.rating}
                        </div>
                    </div>
                    <h2 className="text-2xl text-accent font-bold mt-2">{player.name}</h2>
                    <div className="text-secondary text-sm font-semibold uppercase tracking-wide">
                        Role: <span className="text-primary">{player.role}</span>
                    </div>
                    <div className="text-secondary text-sm font-semibold uppercase tracking-wide">
                        Base Price: <span className="text-primary">{player.basePrice} Cr</span>
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

                    {/* Admin Controls */}
                    {roomData.status === 'waiting' && (
                        <button className="btn btn-primary mt-auto w-full py-3" onClick={() => this.startAuctionForPlayer(-1)}>
                            Start Next Auction
                        </button>
                    )}
                </div>

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
                        {localTimer === 0 && roomData.status === 'active' && (
                            <div className="absolute inset-0 bg-dark opacity-90 rounded-lg flex items-center justify-center z-10 animate-fade-in" style={{ opacity: 0.95 }}>
                                <button className="btn btn-primary px-10 py-5 text-xl tracking-wider w-full mx-4" onClick={this.handleSold}>
                                    CONFIRM SOLD / NEXT
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Current Bid */}
                    <div className="glass text-center p-8 sm:p-10 flex-1 flex flex-col justify-center relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-50"></div>
                        <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
                        <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
                            {roomData.currentBid || player.basePrice} <span className="text-3xl text-secondary">Cr</span>
                        </div>
                        {roomData.highestBidderName && (
                            <div className="mt-4 text-success font-bold text-xl tracking-wide bg-success-light inline-block mx-auto px-6 py-2 rounded-full border border-success border-opacity-30">
                                BID BY: {roomData.highestBidderName}
                            </div>
                        )}

                        <div className="mt-8 flex-1 flex flex-col justify-center min-h-0">
                            <div className="flex flex-wrap gap-3 justify-center overflow-y-auto max-h-[300px] p-2 scrollable-panel">
                                {teams.map(team => {
                                    // If joiner (not host), only show their own team's button
                                    if (!this.props.isHost && team.id !== this.props.myTeamId) return null;

                                    const isSquadFull = team.players && team.players.length >= 18;
                                    const isHighestBidder = roomData.highestBidderId === team.id;
                                    
                                    // Smaller buttons if many teams
                                    const manyTeams = teams.length > 4;
                                    const btnClass = manyTeams ? "btn px-4 py-3 text-sm min-w-[150px]" : "btn px-8 py-4 text-lg min-w-[200px] sm:min-w-[280px]";

                                    return (
                                        <button
                                            key={team.id}
                                            className={`${btnClass} font-bold flex-shrink-0 ${isHighestBidder ? 'btn-outline' : 'btn-primary'}`}
                                            onClick={() => this.handleBid(team)}
                                            disabled={roomData.status !== 'active' || localTimer === 0 || isSquadFull || isHighestBidder}
                                            style={isHighestBidder ? { opacity: 0.6 } : {}}
                                        >
                                            {isSquadFull ? 'FULL' : isHighestBidder ? `${team.name.toUpperCase()} — LEADING` : `BID FOR ${team.name.toUpperCase()}`}
                                        </button>
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
                    <h3 className="mb-6 text-center text-accent tracking-widest font-bold text-lg">TEAMS PURSE</h3>
                    <div className="flex flex-col gap-4">
                        {teams.map(team => (
                            <div key={team.id} className="bg-panel p-4 rounded-lg border border-white border-opacity-5 hover:border-accent hover:border-opacity-30 transition-all">
                                <div className="flex justify-between mb-2 items-center">
                                    <span className="font-bold text-lg">{team.name}</span>
                                    <span className="text-accent font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm">Cr</span></span>
                                </div>
                                <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${team.players && team.players.length >= 18 ? 'text-danger' : 'text-secondary'}`}>
                                    Squad: {team.players ? team.players.length : 0} / 18
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
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default AuctionDashboard;
