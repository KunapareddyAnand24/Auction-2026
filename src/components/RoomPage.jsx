import React, { Component } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';

class RoomPage extends Component {
    state = {
        roomCode: '',
        joinCode: '',
        teamsInput: ['CSK', 'MI'], // Default team names
        isCreating: true,
        selectedTeamId: null,
        availableTeams: null,
    };

    componentDidMount() {
        this.generateRoomCode();
    }

    generateRoomCode = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.setState({ roomCode: code });
    };

    handleTeamNameChange = (index, value) => {
        const teamsInput = [...this.state.teamsInput];
        teamsInput[index] = value;
        this.setState({ teamsInput });
    };

    addTeamField = () => {
        if (this.state.teamsInput.length >= 8) {
            alert("Maximum 8 teams allowed.");
            return;
        }
        this.setState({ teamsInput: [...this.state.teamsInput, ''] });
    };

    removeTeamField = (index) => {
        if (this.state.teamsInput.length <= 2) {
            alert("Minimum 2 teams required.");
            return;
        }
        const teamsInput = this.state.teamsInput.filter((_, i) => i !== index);
        this.setState({ teamsInput });
    };

    getPoolSize = (teamCount) => {
        if (teamCount <= 2) return 50;
        if (teamCount === 3) return 75;
        if (teamCount === 4) return 100;
        return 110; // 5+ teams = all players
    };

    handleCreateRoom = async () => {
        const { roomCode, teamsInput } = this.state;

        if (!roomCode) {
            alert("Please generate a room code first.");
            return;
        }

        const teams = teamsInput
            .filter(name => name && name.trim() !== '')
            .map((name, index) => ({
                id: index + 1,
                name: name.trim(),
                purse: 100,
                players: []
            }));

        if (teams.length < 2) {
            teams.length = 0;
            teams.push({ id: 1, name: "CSK", purse: 100, players: [] });
            teams.push({ id: 2, name: "MI", purse: 100, players: [] });
        }

        if (!db) {
            alert("Firebase is not configured correctly. Please check console for details.");
            return;
        }

        try {
            const maxPlayers = this.getPoolSize(teams.length);

            const roomRef = ref(db, `rooms/${this.state.roomCode}`);
            await set(roomRef, {
                teams: teams,
                currentPlayerIndex: 0,
                currentBid: 0,
                highestBidderId: null,
                status: 'waiting',
                maxPlayers: maxPlayers,
                createdAt: new Date().toISOString()
            });

            this.props.setMyTeamId(teams[0].id);
            this.props.setIsHost(true);
            this.props.setRoomCode(roomCode);
            this.props.setTeams(teams);
            this.props.setView('auction');
        } catch (error) {
            console.error("Error creating room:", error);
            alert(`Failed to create room: ${error.message}`);
        }
    };

    handleJoinRoom = async () => {
        const { joinCode, selectedTeamId } = this.state;
        if (!joinCode) {
            alert("Please enter a room code.");
            return;
        }

        try {
            if (!db) {
                alert("Firebase is not configured. Please check firebase.js");
                return;
            }
            const roomRef = ref(db, `rooms/${joinCode}`);
            const snapshot = await get(roomRef);

            if (snapshot.exists()) {
                const roomData = snapshot.val();

                if (!selectedTeamId && roomData.teams && !this.state.availableTeams) {
                    this.setState({ availableTeams: roomData.teams });
                    return;
                }

                if (!selectedTeamId) {
                    alert("Please select a team to join.");
                    return;
                }

                this.props.setRoomCode(joinCode);
                this.props.setTeams(roomData.teams || []);
                this.props.setMyTeamId(selectedTeamId);
                this.props.setIsHost(false);
                this.props.setView('auction');
            } else {
                alert("Room not found. Check the code.");
            }
        } catch (error) {
            console.error("Error joining room:", error);
            alert("Failed to join room. Check your connection.");
        }
    };

    render() {
        const { teamsInput, isCreating } = this.state;
        const teamCount = teamsInput.filter(t => t && t.trim() !== '').length || 2;
        const poolSize = this.getPoolSize(teamCount);

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
                        >
                            Create Room
                        </button>
                        <button
                            className={`btn flex-1 ${!isCreating ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => this.setState({ isCreating: false })}
                        >
                            Join Room
                        </button>
                    </div>

                    {isCreating ? (
                        <div className="create-section animate-fade-in">
                            <h2 className="text-2xl mb-6 text-center font-bold">Host Selection</h2>
                            <div className="mb-8 text-center">
                                <button className="btn btn-outline py-3 px-6" onClick={this.generateRoomCode}>
                                    {this.state.roomCode ? `CODE: ${this.state.roomCode}` : 'Generate Room Code'}
                                </button>
                            </div>

                            {/* Pool Size Indicator */}
                            <div className="text-center mb-6">
                                <div className="pool-indicator">
                                    <span className="pool-indicator-dot"></span>
                                    {poolSize} Players in Auction Pool
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="mb-4 text-accent text-md font-bold tracking-wide uppercase">SQUAD TEAMS</h3>
                                <div className="flex flex-col gap-3">
                                    {teamsInput.map((team, index) => (
                                        <div key={index} className="team-input-row">
                                            <input
                                                type="text"
                                                placeholder={`Team ${index + 1} Name`}
                                                value={team}
                                                onChange={(e) => this.handleTeamNameChange(index, e.target.value)}
                                            />
                                            {teamsInput.length > 2 && (
                                                <button
                                                    className="btn-remove-team"
                                                    onClick={() => this.removeTeamField(index)}
                                                    title="Remove team"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className="btn btn-outline w-full mt-4 py-3" onClick={this.addTeamField}>+ Add Team</button>
                            </div>

                            <button className="btn btn-primary w-full mt-4 py-4 text-md" onClick={this.handleCreateRoom}>
                                Initialize Global Auction
                            </button>
                        </div>
                    ) : (
                        <div className="join-section text-center animate-fade-in">
                            <h2 className="text-2xl mb-6 font-bold">Join Existing Room</h2>
                            <div className="mb-8 text-left">
                                <label>ENTER 6-DIGIT CODE</label>
                                <input
                                    type="text"
                                    placeholder="e.g. A1B2C3"
                                    value={this.state.joinCode}
                                    onChange={(e) => this.setState({ joinCode: e.target.value.toUpperCase(), availableTeams: null, selectedTeamId: null })}
                                    className="text-center text-3xl tracking-widest py-4 font-black"
                                />
                            </div>

                            {this.state.availableTeams && (
                                <div className="mb-8 text-left animate-fade-in">
                                    <label className="text-accent">SELECT YOUR TEAM</label>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {this.state.availableTeams.map(team => (
                                            <button
                                                key={team.id}
                                                className={`btn ${this.state.selectedTeamId === team.id ? 'btn-primary' : 'btn-outline'} py-3`}
                                                onClick={() => this.setState({ selectedTeamId: team.id })}
                                            >
                                                {team.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button className="btn btn-primary w-full py-4 text-md" onClick={this.handleJoinRoom}>
                                {this.state.availableTeams ? 'Join Arena' : 'Check Room'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default RoomPage;
