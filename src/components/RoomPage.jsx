import React, { Component } from 'react';
import { ref, set, get, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import playersData, { PLAYER_SETS } from '../data/playersData';

class RoomPage extends Component {
    state = {
        roomCode: '',
        joinCode: '',
        hostTeamName: '',
        joinTeamName: '',
        maxTeams: 2,
        targetPoolSize: 103, // Default for 2 teams
        isCreating: true,
    };

    componentDidMount() {
        this.generateRoomCode();
    }

    generateRoomCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.setState({ roomCode: code });
    };

    shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    handleMaxTeamsChange = (action) => {
        let { maxTeams } = this.state;
        if (action === 'increment' && maxTeams < 8) maxTeams++;
        if (action === 'decrement' && maxTeams > 2) maxTeams--;
        
        // Auto-adjust suggested pool size
        const suggested = 71 + Math.min(106, maxTeams * 16);
        this.setState({ maxTeams, targetPoolSize: suggested });
    };

    handleTargetPoolSizeChange = (action) => {
        let { targetPoolSize } = this.state;
        const T1_COUNT = playersData.filter(p => p.tier === 1).length;
        const TOTAL_COUNT = playersData.length;

        if (action === 'increment' && targetPoolSize < TOTAL_COUNT) {
            targetPoolSize = Math.min(TOTAL_COUNT, targetPoolSize + 10);
        }
        if (action === 'decrement' && targetPoolSize > T1_COUNT) {
            targetPoolSize = Math.max(T1_COUNT, targetPoolSize - 10);
        }
        this.setState({ targetPoolSize });
    };

    // Pool = ALL tier-1 + random subset of tier-2 to reach target size
    buildSetOrderedPool = (targetSize) => {
        const t1Players = playersData.filter(p => p.tier === 1);
        const t2Players = playersData.filter(p => p.tier === 2);
        
        const remainingNeeded = Math.max(0, targetSize - t1Players.length);
        const selectedT2 = this.shuffleArray(t2Players).slice(0, remainingNeeded);
        
        const fullSelection = t1Players.concat(selectedT2);
        
        // Re-organize into sets to maintain auction flow
        const setNums = [1, 2, 3, 4];
        let orderedPool = [];
        setNums.forEach(s => {
            const playersInSet = fullSelection.filter(p => p.set === s);
            orderedPool = orderedPool.concat(this.shuffleArray(playersInSet));
        });
        
        return orderedPool;
    };

    handleCreateRoom = async () => {
        const { roomCode, hostTeamName, maxTeams } = this.state;

        if (!roomCode) { alert("Please generate a room code first."); return; }
        if (!hostTeamName.trim()) { alert("Please enter your team name."); return; }

        const teams = [
            { id: 1, name: hostTeamName.trim(), purse: 100, players: [] }
        ];

        if (!db) {
            alert("Firebase is not configured correctly. Please check console for details.");
            return;
        }

        try {
            const orderedPool = this.buildSetOrderedPool(this.state.targetPoolSize);

            const roomRef = ref(db, `rooms/${this.state.roomCode}`);
            await set(roomRef, {
                teams,
                maxAllowedTeams: maxTeams,
                currentPlayerIndex: 0,
                currentBid: 0,
                highestBidderId: null,
                status: 'waiting',
                maxPlayers: orderedPool.length,
                playersPool: orderedPool,
                currentSet: 1,
                currentSetName: PLAYER_SETS[1],
                auctionRound: 'main',
                createdAt: new Date().toISOString()
            });

            this.props.setMyTeamId(teams[0].id);
            this.props.setIsHost(true);
            this.props.setRoomCode(roomCode);
            this.props.setTeams(teams);
            this.props.setView('rules');
        } catch (error) {
            console.error("Error creating room:", error);
            alert(`Failed to create room: ${error.message}`);
        }
    };

    handleJoinRoom = async () => {
        const { joinCode, joinTeamName } = this.state;
        if (!joinCode || !joinTeamName.trim()) {
            alert("Please enter a room code and your team name.");
            return;
        }

        try {
            if (!db) { alert("Firebase is not configured. Please check firebase.js"); return; }
            const roomRef = ref(db, `rooms/${joinCode}`);

            let joinedTeamId = null;
            let finalTeams = [];
            const result = await runTransaction(roomRef, (currentData) => {
                if (currentData) {
                    if (!currentData.teams) currentData.teams = [];
                    const maxAllowed = currentData.maxAllowedTeams || 8;

                    const existingTeam = currentData.teams.find(
                        t => t.name.toLowerCase() === joinTeamName.trim().toLowerCase()
                    );
                    if (existingTeam) {
                        joinedTeamId = existingTeam.id;
                        finalTeams = currentData.teams;
                        return currentData;
                    }

                    if (currentData.teams.length >= maxAllowed) return;

                    joinedTeamId = currentData.teams.length + 1;
                    const newTeam = { id: joinedTeamId, name: joinTeamName.trim(), purse: 100, players: [] };
                    currentData.teams.push(newTeam);
                    finalTeams = currentData.teams;
                }
                return currentData;
            });

            if (!result.committed && !joinedTeamId) {
                alert("Room is full or doesn't exist.");
                return;
            }

            this.props.setRoomCode(joinCode);
            this.props.setTeams(finalTeams);
            this.props.setMyTeamId(joinedTeamId);
            this.props.setIsHost(false);
            this.props.setView('rules');
        } catch (error) {
            console.error("Error joining room:", error);
            alert("Failed to join room. Check your connection.");
        }
    };

    render() {
        const { isCreating, maxTeams, hostTeamName, joinCode, joinTeamName, targetPoolSize } = this.state;
        // Compute actual preview pool size
        const t1Count = playersData.filter(p => p.tier === 1).length;
        const poolSize = targetPoolSize;

        return (
            <div className="container animate-fade-in">
                {!db && (
                    <div className="alert-warning">
                        <strong className="font-bold text-danger">CRITICAL:</strong>{' '}
                        <span className="text-danger">Firebase is not configured. Real-time features will not work.</span>
                    </div>
                )}
                <div className="glass p-10 max-w-lg mx-auto">
                    <div className="flex gap-4 mb-8">
                        <button
                            className={`btn flex-1 ${isCreating ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => this.setState({ isCreating: true })}
                        >Create Room</button>
                        <button
                            className={`btn flex-1 ${!isCreating ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => this.setState({ isCreating: false })}
                        >Join Room</button>
                    </div>

                    {isCreating ? (
                        <div className="create-section animate-fade-in">
                            <h2 className="text-2xl mb-6 text-center font-bold">Host Selection</h2>
                            <div className="mb-8 text-center">
                                <button className="btn btn-outline py-3 px-6" onClick={this.generateRoomCode}>
                                    {this.state.roomCode ? `CODE: ${this.state.roomCode}` : 'Generate Room Code'}
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">Your Team Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your franchise name"
                                    value={hostTeamName}
                                    onChange={(e) => this.setState({ hostTeamName: e.target.value })}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">Maximum Teams Allowed</label>
                                <div className="flex items-center justify-between glass px-4 py-2 mt-2">
                                    <button className="btn-outline px-4 py-1" onClick={() => this.handleMaxTeamsChange('decrement')}>-</button>
                                    <span className="text-2xl font-black">{maxTeams}</span>
                                    <button className="btn-outline px-4 py-1" onClick={() => this.handleMaxTeamsChange('increment')}>+</button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-secondary text-[10px] uppercase font-black tracking-widest">Total Auction Pool Size</label>
                                    <span className="text-accent font-black">{targetPoolSize} UP</span>
                                </div>
                                <div className="flex items-center justify-between glass px-4 py-2">
                                    <button className="btn-outline px-4 py-1" onClick={() => this.handleTargetPoolSizeChange('decrement')}>-</button>
                                    <div className="w-full mx-4 h-1 bg-white/5 rounded-full overflow-hidden relative">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-accent transition-all duration-300"
                                            style={{ width: `${(targetPoolSize / playersData.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <button className="btn-outline px-4 py-1" onClick={() => this.handleTargetPoolSizeChange('increment')}>+</button>
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <div className="pool-indicator">
                                    <span className="pool-indicator-dot"></span>
                                    {targetPoolSize} Players · {t1Count} Star Recognized + {targetPoolSize - t1Count} Random Uncapped
                                </div>
                            </div>

                            <button className="btn btn-primary w-full mt-4 py-4 text-md" onClick={this.handleCreateRoom}>
                                Create Game Room
                            </button>
                        </div>
                    ) : (
                        <div className="join-section text-center animate-fade-in">
                            <h2 className="text-2xl mb-6 font-bold">Join Existing Room</h2>
                            <div className="mb-6 text-left">
                                <label className="text-accent text-sm font-bold tracking-widest uppercase block mb-2">ENTER 6-DIGIT CODE</label>
                                <input
                                    type="text"
                                    placeholder="e.g. A1B2C3"
                                    value={joinCode}
                                    onChange={(e) => this.setState({ joinCode: e.target.value.toUpperCase() })}
                                    className="text-center text-3xl tracking-widest py-4 font-black mb-4"
                                />
                            </div>

                            <div className="mb-8 text-left">
                                <label className="text-accent text-sm font-bold tracking-widest uppercase block mb-2">YOUR TEAM NAME</label>
                                <input
                                    type="text"
                                    placeholder="Enter your franchise name"
                                    value={joinTeamName}
                                    onChange={(e) => this.setState({ joinTeamName: e.target.value })}
                                    className="py-3"
                                />
                            </div>

                            <button className="btn btn-primary w-full py-4 text-md" onClick={this.handleJoinRoom}>
                                Join Room
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default RoomPage;
