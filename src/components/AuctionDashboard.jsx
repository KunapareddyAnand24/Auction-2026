import React, { Component } from 'react';
import { db } from '../firebase';
import { ref, update, onValue, runTransaction, push } from 'firebase/database';
import { PLAYER_SETS } from '../data/playersData';
import VoiceChat from './VoiceChat';

class ChatBox extends Component {
    state = { message: '', messages: [] };
    chatMessagesRef = React.createRef();
    chatListener = null;

    componentDidMount() {
        if (!db || !this.props.roomCode) return;
        const chatRef = ref(db, `rooms/${this.props.roomCode}/chat`);
        this.chatListener = onValue(chatRef, (snap) => {
            const data = snap.val();
            const msgs = data ? Object.values(data).sort((a, b) => a.ts - b.ts) : [];
            this.setState({ messages: msgs }, this.scrollToBottom);
        });
    }

    componentWillUnmount() {
        if (this.chatListener) this.chatListener();
    }

    scrollToBottom = () => {
        if (this.chatMessagesRef.current) {
            this.chatMessagesRef.current.scrollTop = this.chatMessagesRef.current.scrollHeight;
        }
    };

    sendMessage = async () => {
        const { message } = this.state;
        if (!message.trim() || !db) return;
        const chatRef = ref(db, `rooms/${this.props.roomCode}/chat`);
        await push(chatRef, {
            sender: this.props.senderName || 'Team',
            text: message.trim(),
            ts: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        this.setState({ message: '' });
    };

    handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    };

    render() {
        const { messages, message } = this.state;
        return (
            <div className="chat-panel">
                <div className="chat-header">
                    <span>💬 LIVE CHAT</span>
                    <span className="chat-online-dot"></span>
                </div>
                <div className="chat-messages" ref={this.chatMessagesRef}>
                    {messages.length === 0 && (
                        <div className="chat-empty">Chat is live — say something!</div>
                    )}
                    {messages.map((m, i) => {
                        const isMe = m.sender === (this.props.senderName || 'Team');
                        return (
                            <div key={i} className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--other'}`}>
                                {!isMe && <div className="chat-sender">{m.sender}</div>}
                                <div className="chat-text">{m.text}</div>
                                <div className="chat-time">{m.time}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="chat-input-row">
                    <input
                        className="chat-input"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => this.setState({ message: e.target.value })}
                        onKeyDown={this.handleKeyDown}
                        maxLength={200}
                    />
                    <button className="chat-send-btn" onClick={this.sendMessage} disabled={!message.trim()}>▶</button>
                </div>
            </div>
        );
    }
}

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
            setCelebration: null,
            isProcessingSold: false,
            currentPlayerImage: null,
            showUnsoldConfirm: false,
            chatOpen: true,
            showSquadModal: false,
            soldTimeline: [],   // Global sold player log
            allTimeBid: null,   // Highest bid ever in this room
        };
        this.timerInterval = null;
        this.celebrationTimeout = null;
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
        const offsetRef = ref(db, '.info/serverTimeOffset');
        onValue(offsetRef, (snap) => this.setState({ serverTimeOffset: snap.val() || 0 }));
    };

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.isHost &&
            prevState.localTimer > 0 &&
            this.state.localTimer === 0 &&
            this.state.roomData &&
            this.state.roomData.status === 'active' &&
            !this.state.roomData.paused &&
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

                const history = data.bidHistory ? Object.values(data.bidHistory).reverse() : [];
                this.setState({ bidHistory: history });

                // ── Listen to broadcast celebrations (for ALL clients) ──
                const cel = data.celebration;
                if (cel) {
                    if (cel.type === 'sold') {
                        this.setState({ soldCelebration: cel });
                        clearTimeout(this.celebrationTimeout);
                        this.celebrationTimeout = setTimeout(() => {
                            this.setState({ soldCelebration: null });
                        }, 3500);
                    } else if (cel.type === 'unsold') {
                        this.setState({ unsoldCelebration: cel });
                        clearTimeout(this.celebrationTimeout);
                        this.celebrationTimeout = setTimeout(() => {
                            this.setState({ unsoldCelebration: null });
                        }, 3000);
                    }
                } else {
                    // Clear when host clears it
                    if (!cel) {
                        // only clear if it matches the stale one
                    }
                }

                // ── Build sold timeline from team players ──
                if (data.teams) {
                    const timeline = [];
                    let allTimeBid = null;
                    data.teams.forEach(t => {
                        (t.players || []).forEach(p => {
                            const entry = { ...p, teamName: t.name, teamId: t.id };
                            timeline.push(entry);
                            if (!allTimeBid || p.soldPrice > allTimeBid.soldPrice) {
                                allTimeBid = { ...p, teamName: t.name };
                            }
                        });
                    });
                    // Sort by sold order (approximate by price desc for display)
                    this.setState({ soldTimeline: timeline.reverse(), allTimeBid });
                }
            }
        });
    };

    fetchPlayerImage = async (playerName) => {
        this.setState({ currentPlayerImage: null });
        try {
            const res = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(playerName)}&origin=*`
            );
            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].original) {
                this.setState({ currentPlayerImage: pages[pageId].original.source });
            }
        } catch (e) {
            console.error('Failed to fetch player image:', e);
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
        await update(this.roomRef, { paused: true, resumeRequested: false });
    };

    handleRequestResume = async () => {
        if (!this.roomRef) return;
        await update(this.roomRef, { resumeRequested: true });
    };

    handleResume = async () => {
        if (!this.roomRef || !this.state.roomData?.paused) return;
        const { serverTimeOffset, localTimer } = this.state;
        const now = Date.now() + serverTimeOffset;
        const newEndTime = now + (localTimer * 1000);
        await update(this.roomRef, {
            paused: false,
            resumeRequested: false,
            endTime: newEndTime
        });
    };

    handleUnsoldClick = () => {
        if (!this.props.isHost) return;
        this.setState({ showUnsoldConfirm: true });
    };

    handleConfirmUnsold = async () => {
        this.setState({ showUnsoldConfirm: false });
        if (!this.roomRef) return;
        // Immediately stop timer and fire unsold logic
        await update(this.roomRef, { status: 'waiting', paused: false });
        this.setState({ isProcessingSold: true }, () => this.handleSold());
    };

    isTeamInactive = (team, minBidPrice) => {
        const { roomData } = this.state;
        // Rested teams are treated as fully inactive
        const restedTeams = roomData?.restedTeams || [];
        if (restedTeams.includes(team.id)) return true;
        if ((team.players ? team.players.length : 0) >= 18) return true;
        if (team.purse < minBidPrice) return true;
        return false;
    };

    isTeamRested = (teamId) => {
        const restedTeams = this.state.roomData?.restedTeams || [];
        return restedTeams.includes(teamId);
    };

    handleRest = async (team) => {
        if (!this.roomRef) return;
        const { roomData } = this.state;
        const playerCount = (team.players || []).length;
        if (playerCount < 11) {
            alert(`You need at least 11 players to REST. You currently have ${playerCount}.`);
            return;
        }
        const restedTeams = roomData.restedTeams || [];
        if (restedTeams.includes(team.id)) return;
        const updatedRested = [...restedTeams, team.id];
        await update(this.roomRef, { restedTeams: updatedRested });
        // Check if all teams can stop — if so, finish immediately
        await this.checkAllTeamsDone(updatedRested);
    };

    checkAllTeamsDone = async (restedTeams) => {
        const { roomData } = this.state;
        if (!roomData) return;
        const minBid = 0.5;
        const allDone = roomData.teams.every(t => {
            if ((restedTeams || []).includes(t.id)) return true;
            if ((t.players || []).length >= 18) return true;
            if (t.purse < minBid) return true;
            return false;
        });
        if (allDone) {
            await this.finishAuction();
        }
    };

    handleBid = async (team) => {
        const { roomData, localTimer, serverTimeOffset } = this.state;
        if (!roomData || localTimer <= 0 || roomData.paused) return;

        const player = this.props.players[roomData.currentPlayerIndex];
        
        try {
            if (!db || !this.roomRef) { alert('Firebase is not configured properly.'); return; }
            
            // To guarantee instant robust updates without the strict and heavy payload limits of full-node transactions,
            // we use update() for the specific fields. 
            if (roomData.status !== 'active' || roomData.paused) return;

            const effectiveBase = roomData.reAuctionBasePrice || player.basePrice;
            const currentBid = roomData.currentBid || effectiveBase;
            const newBid = roomData.highestBidderId ? currentBid + 0.25 : currentBid;

            // Only allow if new bid is greater than or equal to current bid and team has purse
            if (newBid < currentBid || team.purse < newBid) return;

            const bidTime = Date.now() + (serverTimeOffset || 0);
            let newEndTime = roomData.endTime;
            const rem = Math.max(0, Math.floor((newEndTime - bidTime) / 1000));
            
            // Add 5 seconds if remaining time is <= 5 seconds, up to max
            if (rem <= 5) newEndTime = bidTime + (rem + 5) * 1000;

            const updates = {
                currentBid: Math.round(newBid * 100) / 100,
                highestBidderId: team.id,
                highestBidderName: team.name,
                endTime: newEndTime,
                [`bidHistory/bid_${bidTime}`]: {
                    teamName: team.name,
                    amount: Math.round(newBid * 100) / 100,
                    time: new Date().toLocaleTimeString()
                }
            };
            
            await update(this.roomRef, updates);
        } catch (error) {
            console.error('Bid update failed:', error);
            alert('Failed to place bid. Please try again.');
        }
    };

    finishAuction = async () => {
        const { roomData } = this.state;
        const teamsWithValidation = roomData.teams.map(t => ({
            ...t,
            qualified: (t.players ? t.players.length : 0) >= 11
        }));
        await update(this.roomRef, { status: 'transfer', teams: teamsWithValidation });
    };

    // Determine which set a player at the given index belongs to
    getPlayerSet = (playerIndex) => {
        const p = this.props.players[playerIndex];
        return p ? (p.set || 1) : 1;
    };

    startAuctionForPlayer = async (index) => {
        let playerIndex = index;

        if (index === -1) {
            const { roomData } = this.state;
            const unsoldPlayers = roomData.unsoldPlayers || [];
            const isReAuction = roomData.auctionRound === 're-auction';

            const minBasePrice = isReAuction
                ? Math.min(...unsoldPlayers.map(p => Math.max(0.5, p.basePrice * 0.5)))
                : Math.min(...this.props.players.map(p => p.basePrice));
            // Include rested teams in inactive check
            const restedTeams = roomData.restedTeams || [];
            const allTeamsInactive = roomData.teams.every(t =>
                restedTeams.includes(t.id) || this.isTeamInactive(t, minBasePrice || 0.5)
            );
            if (allTeamsInactive) { await this.finishAuction(); return; }

            if (isReAuction) {
                if (unsoldPlayers.length === 0) {
                    await update(this.roomRef, { reAuctionDone: true });
                    await this.finishAuction();
                    return;
                }
                const pickIdx = Math.floor(Math.random() * unsoldPlayers.length);
                const unsoldPlayer = unsoldPlayers[pickIdx];
                const reAuctionBasePrice = Math.max(0.5, Math.round(unsoldPlayer.basePrice * 0.5 * 100) / 100);
                const originalIndex = this.props.players.findIndex(p => p.name === unsoldPlayer.name);
                const updatedUnsold = unsoldPlayers.filter((_, i) => i !== pickIdx);
                const now = Date.now() + this.state.serverTimeOffset;
                this.setState({ isProcessingSold: false });
                await update(this.roomRef, {
                    currentPlayerIndex: originalIndex,
                    currentBid: reAuctionBasePrice,
                    reAuctionBasePrice,
                    highestBidderId: null,
                    highestBidderName: null,
                    endTime: now + 20000,
                    status: 'active',
                    bidHistory: null,
                    paused: false,
                    resumeRequested: false,
                    unsoldPlayers: updatedUnsold.length > 0 ? updatedUnsold : null,
                });
                return;
            }

            // MAIN AUCTION: find next player in current set, else advance set
            const currentSet = roomData.currentSet || 1;

            // Try to find available player in current set
            const soldNames = new Set(
                roomData.teams.flatMap(t => (t.players || []).map(p => p.name))
            );
            const unsoldNames = new Set(unsoldPlayers.map(p => p.name));

            const availableInSet = this.props.players
                .map((p, i) => ({ ...p, originalIndex: i }))
                .filter(p => p.set === currentSet && !soldNames.has(p.name) && !unsoldNames.has(p.name));

            if (availableInSet.length === 0) {
                // Current set exhausted — move to next set
                const nextSet = currentSet + 1;
                if (nextSet > 4 || !Object.keys(PLAYER_SETS).map(Number).includes(nextSet)) {
                    // All sets done — check for unsold players
                    if (unsoldPlayers.length > 0 && !roomData.reAuctionDone) {
                        await update(this.roomRef, { auctionRound: 're-auction' });
                        this.startAuctionForPlayer(-1);
                        return;
                    }
                    await this.finishAuction();
                    return;
                }

                // Show set completion banner, then advance
                this.setState({ setCelebration: PLAYER_SETS[currentSet], isProcessingSold: false });
                await update(this.roomRef, {
                    currentSet: nextSet,
                    currentSetName: PLAYER_SETS[nextSet],
                });
                setTimeout(() => {
                    this.setState({ setCelebration: null });
                    this.startAuctionForPlayer(-1);
                }, 2500);
                return;
            }

            // Pick a random player from the available in current set
            playerIndex = availableInSet[Math.floor(Math.random() * availableInSet.length)].originalIndex;
        }

        const player = this.props.players[playerIndex];
        const now = Date.now() + this.state.serverTimeOffset;
        this.setState({ isProcessingSold: false });

        try {
            await update(this.roomRef, {
                currentPlayerIndex: playerIndex,
                currentBid: player.basePrice,
                reAuctionBasePrice: null,
                highestBidderId: null,
                highestBidderName: null,
                endTime: now + 20000,
                status: 'active',
                bidHistory: null,
                paused: false,
                resumeRequested: false,
            });
        } catch (error) {
            console.error('Failed to start auction:', error);
            alert('Error: ' + error.message);
        }
    };

    handleSold = async () => {
        const { roomData } = this.state;
        if (!roomData) return;

        const player = this.props.players[roomData.currentPlayerIndex];
        const bidderId = roomData.highestBidderId;
        const isSteal = bidderId && player.rating >= 80 && roomData.currentBid <= player.basePrice * 1.25;

        if (bidderId) {
            const updatedTeams = roomData.teams.map(t => {
                if (t.id === bidderId) {
                    return {
                        ...t,
                        purse: Math.round((t.purse - roomData.currentBid) * 100) / 100,
                        players: [...(t.players || []), { ...player, soldPrice: roomData.currentBid }]
                    };
                }
                return t;
            });

            const buyingTeam = roomData.teams.find(t => t.id === bidderId);
            const celebrationData = {
                type: 'sold',
                playerName: player.name,
                teamName: buyingTeam ? buyingTeam.name : 'Unknown',
                price: roomData.currentBid,
                role: player.role,
                rating: player.rating,
                isSteal: !!isSteal,
                ts: Date.now(),
            };

            // Broadcast to ALL clients via Firebase
            await update(this.roomRef, {
                teams: updatedTeams,
                status: 'waiting',
                celebration: celebrationData,
            });

            setTimeout(async () => {
                // Clear celebration from Firebase after display
                await update(this.roomRef, { celebration: null });
                this.startAuctionForPlayer(-1);
            }, 3500);
        } else {
            const unsoldPlayers = roomData.unsoldPlayers || [];
            const isReAuction = roomData.auctionRound === 're-auction';

            const celebrationData = {
                type: 'unsold',
                playerName: player.name,
                role: player.role,
                rating: player.rating,
                ts: Date.now(),
            };

            // Broadcast to ALL clients
            if (!isReAuction) {
                const updatedUnsold = [
                    ...unsoldPlayers,
                    { name: player.name, basePrice: player.basePrice, role: player.role, rating: player.rating }
                ];
                await update(this.roomRef, {
                    status: 'waiting',
                    unsoldPlayers: updatedUnsold,
                    celebration: celebrationData,
                });
            } else {
                await update(this.roomRef, { status: 'waiting', celebration: celebrationData });
            }

            setTimeout(async () => {
                await update(this.roomRef, { celebration: null });
                this.startAuctionForPlayer(-1);
            }, 3000);
        }
    };

    render() {
        const { roomData, localTimer, bidHistory, soldCelebration, unsoldCelebration, setCelebration, chatOpen, soldTimeline } = this.state;
        if (!roomData) return <div className="container text-center text-secondary">Loading Room Data...</div>;

        const players = this.props.players;
        const player = players[roomData.currentPlayerIndex];
        if (!player) return <div className="container text-center text-secondary">Loading player...</div>;

        const displayImage = this.state.currentPlayerImage || player.image;
        const teams = roomData.teams || [];
        const unsoldPlayers = roomData.unsoldPlayers || [];
        const isReAuction = roomData.auctionRound === 're-auction';
        const effectiveBasePrice = roomData.reAuctionBasePrice || player.basePrice;
        const isPaused = !!roomData.paused;
        const resumeRequested = !!roomData.resumeRequested;
        const currentSetName = roomData.currentSetName || PLAYER_SETS[roomData.currentSet || 1] || 'SET 1 — BATSMEN';

        // Auction status label
        let statusLabel = '🔴 LIVE';
        let statusClass = 'status-badge-live';
        if (isPaused) { statusLabel = '⏸ PAUSED'; statusClass = 'status-badge-paused'; }
        if (roomData.status === 'waiting') { statusLabel = '⏳ WAITING'; statusClass = 'status-badge-waiting'; }

        if (roomData.status === 'finished') {
            return (
                <div className="container text-center pt-20">
                    <h2 className="gradient-text text-5xl mb-8">Auction Concluded!</h2>
                    <button className="btn btn-primary px-8 py-4 text-lg" onClick={() => this.props.setView('results')}>View Final Squads</button>
                </div>
            );
        }

        return (
            <div className="auction-layout-wrapper">
                {/* ── Set Banner ── */}
                <div className="flex justify-between items-center mb-0 bg-dark bg-opacity-50 p-2 rounded-t-xl border border-white border-opacity-10 border-b-0">
                    <div style={{ width: '140px' }}></div> {/* Spacer for centering */}
                    {!isReAuction && (
                        <div className="set-banner !mb-0 !rounded-none !border-none !bg-transparent" style={{ padding: '4px 12px' }}>
                            <span className="set-banner-icon">🏏</span>
                            {currentSetName}
                            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                        </div>
                    )}
                    {isReAuction && (
                        <div className="reauction-banner !static !transform-none !mb-0">
                            <span className="reauction-banner-icon">🔄</span>
                            RE-AUCTION ROUND
                            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                        </div>
                    )}
                    <button 
                        className="btn btn-outline border-accent text-accent py-1 px-4 text-xs font-bold whitespace-nowrap"
                        onClick={() => this.setState({ showSquadModal: true })}
                        title="View All Squads & Players"
                    >
                        👀 VIEW SQUADS
                    </button>
                </div>

                {/* ── Set Complete Banner ── */}
                {setCelebration && (
                    <div className="set-complete-overlay">
                        <div className="set-complete-card">
                            <div className="text-6xl mb-4">✅</div>
                            <div className="text-3xl font-black text-accent mb-2">{setCelebration}</div>
                            <div className="text-secondary text-lg">SET COMPLETE!</div>
                            <div className="text-sm text-secondary mt-2 animate-pulse">Moving to next set...</div>
                        </div>
                    </div>
                )}

                {/* ── Sold Overlay (broadcast to ALL) ── */}
                {soldCelebration && (
                    <div className="sold-overlay" onClick={() => this.setState({ soldCelebration: null })}>
                        <div className="sold-card">
                            <div className="sold-confetti">
                                <span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span>
                            </div>
                            <span className="sold-emoji">{soldCelebration.isSteal ? '' : ''}</span>
                            <div className="sold-title">{soldCelebration.isSteal ? 'STEAL OF THE AUCTION!' : 'Congratulations!'}</div>
                            <div className="sold-player-name">{soldCelebration.playerName}</div>
                            <div className="sold-team-name">Sold to {soldCelebration.teamName}</div>
                            <div className="sold-price">{soldCelebration.price} Cr</div>
                            {soldCelebration.isSteal && (
                                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '8px' }}>🔥 Under Base Price Steal!</div>
                            )}
                            <div className="sold-details">
                                <span className="sold-detail-chip">{soldCelebration.role}</span>
                                <span className="sold-detail-chip">⭐ {soldCelebration.rating}</span>
                            </div>
                            <button className="btn btn-outline px-8 py-2"
                                onClick={(e) => { e.stopPropagation(); this.setState({ soldCelebration: null }); }}>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Unsold Overlay ── */}
                {unsoldCelebration && (
                    <div className="unsold-overlay" onClick={() => this.setState({ unsoldCelebration: null })}>
                        <div className="unsold-card">
                            <span className="unsold-emoji"></span>
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

                {/* ── Unsold Confirmation Modal ── */}
                {this.state.showUnsoldConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="text-3xl mb-3">⚠️</div>
                            <div className="text-xl font-black text-danger mb-2">Mark as UNSOLD?</div>
                            <div className="text-secondary text-sm mb-6">
                                <strong>{player.name}</strong> will be immediately marked as unsold and removed from the current auction round.
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button className="btn btn-danger px-6 py-2 font-bold" onClick={this.handleConfirmUnsold}>
                                    Yes, Mark Unsold
                                </button>
                                <button className="btn btn-outline px-6 py-2" onClick={() => this.setState({ showUnsoldConfirm: false })}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Squad Overview Modal ── */}
                {this.state.showSquadModal && (
                    <div className="squad-modal-overlay" onClick={() => this.setState({ showSquadModal: false })}>
                        <div className="squad-modal" onClick={e => e.stopPropagation()}>
                            <div className="squad-modal-header">
                                <h2 className="text-2xl font-black text-accent tracking-widest flex items-center gap-3">
                                     AUCTION OVERVIEW
                                </h2>
                                <button className="squad-modal-close" onClick={() => this.setState({ showSquadModal: false })}>✕</button>
                            </div>
                            
                            <div className="squad-modal-content">
                                {/* Teams Grid */}
                                <div className="squad-modal-teams-grid">
                                    {teams.map(team => {
                                        const minBasePrice = Math.min(...this.props.players.map(p => p.basePrice));
                                        const inactive = this.isTeamInactive(team, minBasePrice);
                                        const playerCount = team.players ? team.players.length : 0;
                                        
                                        return (
                                            <div key={team.id} className={`squad-modal-team ${team.id === this.props.myTeamId ? 'border-accent' : ''} ${inactive ? 'opacity-70' : ''}`}>
                                                <div className="squad-modal-team-header justify-between">
                                                    <div className="font-bold flex items-center gap-2">
                                                        {team.name}
                                                        {inactive && <span className="text-[10px] bg-danger text-white px-1.5 py-0.5 rounded">REST</span>}
                                                    </div>
                                                    <div className="text-accent font-black">
                                                        {team.purse.toFixed(1)} <span className="text-xs">Cr</span>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-secondary text-right px-2 pb-1 font-bold">
                                                    {playerCount}/18 PLAYERS
                                                </div>
                                                
                                                <div className="squad-modal-player-list">
                                                    {playerCount === 0 ? (
                                                        <div className="text-center text-xs text-secondary italic py-4">No players bought</div>
                                                    ) : (
                                                        team.players.map((p, i) => (
                                                            <div key={i} className="squad-modal-player-row">
                                                                <div className="flex-1 truncate pr-2 font-medium text-[11px]">{p.name}</div>
                                                                <div className="text-[9px] text-secondary uppercase w-16 truncate">{p.role}</div>
                                                                <div className="text-accent font-bold text-xs w-12 text-right">{p.soldPrice}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Right Sidebar: Current & Unsold */}
                                <div className="squad-modal-sidebar">
                                    <div className="squad-modal-current">
                                        <div className="text-xs font-bold text-accent tracking-widest uppercase mb-2">Currently in Auction</div>
                                        <div className="flex items-center gap-3 bg-dark bg-opacity-50 p-3 rounded-lg border border-accent border-opacity-30">
                                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 relative">
                                                <img src={this.state.currentPlayerImage || player.image} alt={player.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm truncate text-white">{player.name}</div>
                                                <div className="text-xs text-secondary flex justify-between mt-1">
                                                    <span>{player.role}</span>
                                                    <span className="text-accent font-bold">{effectiveBasePrice} Cr</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="squad-modal-unsold flex-1 flex flex-col mt-4 min-h-[200px]">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-xs font-bold text-danger tracking-widest uppercase">Unsold Players</div>
                                            <div className="text-xs bg-danger bg-opacity-20 text-danger px-2 py-0.5 rounded-full font-bold">{unsoldPlayers.length}</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto pr-1 bg-dark bg-opacity-30 p-2 rounded-lg border border-danger border-opacity-20 space-y-1">
                                            {unsoldPlayers.length === 0 ? (
                                                <div className="text-center text-xs text-secondary italic py-4">No unsold players</div>
                                            ) : (
                                                unsoldPlayers.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-white border-opacity-5 last:border-0 pl-1">
                                                        <span className="truncate flex-1">{p.name}</span>
                                                        <span className="text-secondary opacity-70 w-16 text-right truncate text-[9px] uppercase">{p.role}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Host: Ready Overlay ── */}
                {this.props.isHost && roomData.status === 'waiting' && !this.state.isProcessingSold && !this.state.soldCelebration && !setCelebration && (
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

                {/* ── Main Auction Grid ── */}
                <div className="auction-grid animate-fade-in">
                    {/* LEFT: Player Card */}
                    <div className="glass p-6 flex flex-col gap-4 mobile-order-2">
                        <div className="player-image-container">
                            <img src={displayImage} alt={player.name} />
                            <div className="player-rating-badge">{player.rating}</div>
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
                                    {(player.role === 'Bowler' || player.role === 'All-rounder') && <div>WKTS: <span className="font-bold text-white">{player.stats.wickets}</span></div>}
                                    {(player.role === 'Bowler' || player.role === 'All-rounder') && <div>ECO: <span className="font-bold text-white">{player.stats.economy}</span></div>}
                                </div>
                            </div>
                        )}

                        {/* Unsold Players count */}
                        {unsoldPlayers.length > 0 && (
                            <div className="unsold-badge-panel">
                                <span>⚡ {unsoldPlayers.length} player{unsoldPlayers.length > 1 ? 's' : ''} in re-auction queue</span>
                            </div>
                        )}
                    </div>

                    {/* CENTER: Bid Controls */}
                    <div className="flex flex-col gap-4 mobile-order-1">
                        {/* Timer */}
                        <div className={`glass text-center p-6 relative ${roomData.status === 'active' && !isPaused ? 'border-accent' : ''}`}>
                            <div className="text-lg text-secondary font-bold tracking-widest uppercase mb-2">
                                {roomData.status === 'active' ? 'TIME REMAINING' : 'AUCTION STATUS'}
                            </div>
                            <div className={`text-6xl font-black ${localTimer <= 5 && roomData.status === 'active' && !isPaused ? 'text-danger' : 'text-accent'} ${localTimer <= 5 && localTimer > 0 && roomData.status === 'active' && !isPaused ? 'animate-pulse' : ''}`}>
                                {roomData.status === 'active' && !isPaused ? `${localTimer}s` : roomData.status.toUpperCase()}
                            </div>

                            {/* Paused Overlay */}
                            {isPaused && (
                                <div className="paused-overlay animate-fade-in">
                                    <div className="text-warning text-2xl font-black tracking-widest mb-2">⏸ AUCTION PAUSED</div>
                                    {resumeRequested && !this.props.isHost && (
                                        <div className="text-success text-sm mb-3 animate-pulse">Resume requested — waiting for host...</div>
                                    )}
                                    {this.props.isHost ? (
                                        <button
                                            className={`btn btn-primary px-8 py-2 font-bold ${resumeRequested ? 'animate-pulse ring-2 ring-accent' : ''}`}
                                            onClick={this.handleResume}
                                        >
                                            {resumeRequested ? '🔔 RESUME NOW' : 'RESUME AUCTION'}
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline border-success text-success px-6 py-2 font-bold"
                                            onClick={this.handleRequestResume}
                                            disabled={resumeRequested}
                                        >
                                            {resumeRequested ? '✓ Resume Requested' : '🙋 Request Resume'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {localTimer === 0 && roomData.status === 'active' && !isPaused && (
                                <div className="absolute inset-0 bg-dark opacity-90 rounded-lg flex items-center justify-center z-10 animate-fade-in">
                                    <div className="text-2xl font-black text-accent tracking-wider animate-pulse">
                                        {this.state.isProcessingSold ? 'PROCESSING...' : 'TIME UP!'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current Bid */}
                        <div className="glass text-center p-8 flex-1 flex flex-col justify-center relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-50"></div>
                            <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
                            <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
                                {roomData.currentBid || effectiveBasePrice} <span className="text-3xl text-secondary">Cr</span>
                            </div>
                            {roomData.highestBidderName && (() => {
                                const myTeam = (roomData.teams || []).find(t => t.id === this.props.myTeamId);
                                const isMe = myTeam && roomData.highestBidderId === myTeam.id;
                                const currentBidVal = roomData.currentBid || player.basePrice;
                                const isStealNow = player.rating >= 80 && currentBidVal <= player.basePrice * 1.25;
                                return (
                                    <div style={{
                                        marginTop: '12px',
                                        background: isMe ? 'rgba(212,175,55,0.15)' : 'rgba(34,197,94,0.15)',
                                        border: `1px solid ${isMe ? 'rgba(212,175,55,0.5)' : 'rgba(34,197,94,0.5)'}`,
                                        borderRadius: '999px',
                                        padding: '8px 20px',
                                        display: 'inline-block',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        color: isMe ? '#d4af37' : '#22c55e',
                                    }}>
                                        {isMe ? ' ' : ' '} BID BY: {roomData.highestBidderName.toUpperCase()}
                                        {isStealNow && roomData.highestBidderId && <span style={{ marginLeft: '8px', color: '#22c55e', fontSize: '0.75rem' }}> STEAL PRICE!</span>}
                                    </div>
                                );
                            })()}

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-col gap-3 items-center">
                                {teams.map(team => {
                                    if (team.id !== this.props.myTeamId) return null;
                                    const currentBidPrice = roomData.currentBid || player.basePrice;
                                    const isInactive = this.isTeamInactive(team, currentBidPrice);
                                    const isSquadFull = team.players && team.players.length >= 18;
                                    const isHighestBidder = roomData.highestBidderId === team.id;

                                    return (
                                        <div key={team.id} className="flex flex-col gap-3 w-full items-center">
                                            {/* BID Button */}
                                            <button
                                                className={`btn px-8 py-5 text-xl min-w-[280px] font-black transform hover:scale-105 transition-all shadow-xl ${isHighestBidder ? 'btn-outline border-2 border-success' : isInactive ? 'btn-outline opacity-40' : 'btn-primary'}`}
                                                onClick={() => this.handleBid(team)}
                                                disabled={roomData.status !== 'active' || localTimer === 0 || isInactive || isHighestBidder || isPaused}
                                            >
                                                {isSquadFull ? 'SQUAD FULL' : isInactive ? 'PURSE EXHAUSTED' : isHighestBidder ? `✓ LEADING: ${team.name.toUpperCase()}` : `BID ${Math.round((currentBidPrice + (roomData.highestBidderId ? 0.25 : 0)) * 100) / 100} Cr`}
                                            </button>

                                            {/* Wait / Resume row */}
                                            <div className="flex gap-2 w-full justify-center">
                                                {roomData.status === 'active' && !isPaused && (
                                                    <button className="btn btn-outline border-warning text-warning font-bold py-2 px-6 flex-1 max-w-[160px]"
                                                        onClick={this.handleWait}>
                                                        ⏸ WAIT
                                                    </button>
                                                )}
                                                {isPaused && !this.props.isHost && (
                                                    <button
                                                        className="btn btn-outline border-success text-success font-bold py-2 px-6 flex-1 max-w-[200px]"
                                                        onClick={this.handleRequestResume}
                                                        disabled={resumeRequested}
                                                    >
                                                        {resumeRequested ? '⏳ Requested' : '▶ Request Resume'}
                                                    </button>
                                                )}
                                                {isPaused && this.props.isHost && (
                                                    <button
                                                        className={`btn btn-primary font-bold py-2 px-6 flex-1 max-w-[200px] ${resumeRequested ? 'animate-pulse' : ''}`}
                                                        onClick={this.handleResume}
                                                    >
                                                        ▶ RESUME
                                                    </button>
                                                )}
                                            </div>
                                            {/* REST Button — available when team has ≥11 players */}
                                            {(() => {
                                                const playerCount = (team.players || []).length;
                                                const hasRested = this.isTeamRested(team.id);
                                                const canRest = playerCount >= 11;
                                                return (
                                                    <button
                                                        className={`btn rest-btn py-2 px-6 font-bold w-full max-w-[280px] mt-1 ${hasRested ? 'rest-btn--done' : ''}`}
                                                        onClick={() => this.handleRest(team)}
                                                        disabled={hasRested || isInactive}
                                                        title={canRest ? 'Click to stop bidding and proceed to Transfer' : `Need ${11 - playerCount} more player(s) to REST`}
                                                    >
                                                        {hasRested ? '✅ RESTED — Waiting for others' : canRest ? `🛑 REST (${playerCount}/18 players)` : `🔒 REST (need ${11 - playerCount} more)`}
                                                    </button>
                                                );
                                            })()}
                                            {this.props.isHost && roomData.status === 'active' && (
                                                <button
                                                    className="btn unsold-btn py-2 px-6 font-bold w-full max-w-[280px]"
                                                    onClick={this.handleUnsoldClick}
                                                >
                                                    ❌ MARK UNSOLD (Host)
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Host UNSOLD button when no matching team (host is spectating) */}
                                {this.props.isHost && roomData.status === 'active' && !teams.find(t => t.id === this.props.myTeamId) && (
                                    <button className="btn unsold-btn py-2 px-6 font-bold" onClick={this.handleUnsoldClick}>
                                        ❌ MARK UNSOLD (Host)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bid History */}
                        <div className="glass h-full max-h-[180px] p-4 flex flex-col scrollable-panel overflow-y-auto">
                            <h4 className="mb-3 text-sm tracking-widest text-accent font-bold uppercase border-b border-white border-opacity-10 pb-2">LIVE BID HISTORY</h4>
                            <div className="flex-1 overflow-y-auto pr-2">
                                {bidHistory.length === 0 ? (
                                    <div className="text-secondary text-center mt-4 italic text-sm">Awaiting first bid...</div>
                                ) : (
                                    bidHistory.map((bid, i) => {
                                        const myTeam = (roomData.teams || []).find(t => t.id === this.props.myTeamId);
                                        const isMe = myTeam && bid.teamName === myTeam.name;
                                        return (
                                            <div key={i} className="flex justify-between py-2 text-sm border-b border-white border-opacity-5 last:border-0 hover:bg-white hover:bg-opacity-5 px-2 rounded transition-colors">
                                                <span>
                                                    <span style={{ color: isMe ? '#d4af37' : '#22c55e' }} className="font-bold">
                                                        {isMe ? ' ' : ' '}{bid.teamName}
                                                    </span>
                                                    {' '}bid <span className="font-bold">{bid.amount} Cr</span>
                                                </span>
                                                <span className="text-secondary text-xs">{bid.time}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Teams Purse + Sold Timeline */}
                    <div className="glass p-6 mobile-order-3 flex flex-col gap-4 overflow-y-auto overflow-x-hidden" style={{ height: '100%', maxHeight: '88vh' }}>
                        <h3 className="text-center text-accent tracking-widest font-bold text-lg flex items-center justify-center gap-3 sticky top-0 pb-2 z-10" style={{ background: 'rgba(10,15,28,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            TEAMS
                            {unsoldPlayers.length > 0 && (
                                <span className="unsold-badge">{unsoldPlayers.length} unsold</span>
                            )}
                        </h3>



                        {/* Team Panels fully scrollable */}
                        <div className="flex flex-col gap-4">
                            {teams.map(team => {
                                const minBasePrice = Math.min(...this.props.players.map(p => p.basePrice));
                                const inactive = this.isTeamInactive(team, minBasePrice);
                                return (
                                    <div key={team.id} className={`bg-panel p-4 rounded-lg border transition-all ${team.id === this.props.myTeamId ? 'border-accent border-opacity-50' : 'border-white border-opacity-5'} ${inactive ? 'opacity-60' : 'hover:border-accent hover:border-opacity-30'}`}>
                                        <div className="flex justify-between mb-2 items-center">
                                            <span className="font-bold text-lg">
                                                {team.name}
                                                {team.id === this.props.myTeamId && <span className="text-[10px] bg-accent text-dark px-2 py-0.5 rounded ml-2 align-middle font-bold">YOU</span>}
                                                {inactive && <span className="text-xs bg-danger text-white px-2 py-1 rounded ml-2 align-middle">RESTING</span>}
                                            </span>
                                            <span className="text-accent font-black text-xl">{(team.purse || 0).toFixed(1)} <span className="text-sm">Cr</span></span>
                                        </div>
                                        <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-secondary">
                                            Squad: {team.players ? team.players.length : 0} / 18
                                        </div>
                                        {team.players && team.players.length > 0 && (
                                            <div className="border-t border-white border-opacity-10 pt-3 flex flex-col gap-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {team.players.map((p, i) => (
                                                    <div key={i} className="flex justify-between text-xs items-center py-1 rounded hover:bg-white hover:bg-opacity-5 px-1">
                                                        <div>
                                                            <span className="font-medium">{p.name}</span>
                                                            <span className="text-secondary ml-1" style={{ fontSize: '10px' }}>{p.role?.substring(0, 2)}</span>
                                                        </div>
                                                        <span className="text-accent font-bold">{p.soldPrice} Cr</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {soldTimeline.length > 0 && (
                        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#050508', padding: '10px 0', borderTop: '2px solid #d4af37', zIndex: 100, boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' }}>
                            <marquee loop="-1" scrollamount="8" style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <div style={{ display: 'flex', gap: '50px' }}>
                                {soldTimeline.map((entry, i) => {
                                    const entryTeam = teams.find(t => t.name === entry.teamName);
                                    const isMyTeam = entryTeam && entryTeam.id === this.props.myTeamId;
                                    const isStealEntry = entry.soldPrice <= (entry.basePrice || 0) * 1.25 && entry.rating >= 80;
                                    return (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#d4af37' }}></span> {entry.name || entry.playerName} sold to <span style={{ color: isMyTeam ? '#d4af37' : '#22c55e' }}>{entry.teamName}</span> for <span style={{ color: '#d4af37' }}>{entry.soldPrice || entry.price} Cr</span> {isStealEntry || entry.isSteal ? <span style={{ color: '#22c55e' }}> (STEAL)</span> : ''}
                                    </span>
                                    );
                                })}
                            </div>
                            </marquee>
                        </div>
                        )}

                    </div>
                </div>

                {/* ── Floating Sidebar (Chat & Voice) ── */}
                <div className="floating-sidebar">
                    {/* Voice Chat */}
                    <VoiceChat
                        roomCode={this.props.roomCode}
                        myName={teams.find(t => t.id === this.props.myTeamId)?.name || 'Viewer'}
                    />
                    
                    {/* Chat Box */}
                    {chatOpen && (
                        <ChatBox
                            roomCode={this.props.roomCode}
                            senderName={this.props.myTeamName || teams.find(t => t.id === this.props.myTeamId)?.name || 'Viewer'}
                        />
                    )}
                    
                    <div className="chat-toggle-bar !mt-0">
                        <button
                            className="chat-toggle-btn w-full shadow-lg border border-accent border-opacity-30"
                            onClick={() => this.setState(s => ({ chatOpen: !s.chatOpen }))}
                            style={{ 
                                background: 'linear-gradient(135deg, rgba(10, 15, 28, 0.95), rgba(0, 28, 88, 0.9))',
                                padding: '10px 20px',
                                fontSize: '0.85rem'
                            }}
                        >
                            💬 {chatOpen ? '▼ HIDE CHAT' : '▲ SHOW LIVE CHAT'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AuctionDashboard;
