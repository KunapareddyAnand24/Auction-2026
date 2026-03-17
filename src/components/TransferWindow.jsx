import React, { Component } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../firebase';

class TransferWindow extends Component {
    state = {
        roomData: null,
        selectedPlayerId: null,
        transferRequest: null, // { fromTeamId, toTeamId, playerId, price, type: 'swap'|'buy' }
    };

    componentDidMount() {
        if (db && this.props.roomCode) {
            this.listenToRoom();
        }
    }

    listenToRoom = () => {
        const roomRef = ref(db, `rooms/${this.props.roomCode}`);
        this.roomListener = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.setState({ roomData: data });
            }
        });
    };

    componentWillUnmount() {
        if (this.roomListener) this.roomListener();
    }

    handleProposeTransfer = (toTeamId, player, type) => {
        const { roomData } = this.state;
        const myTeam = roomData.teams.find(t => t.id === this.props.myTeamId);
        
        if (type === 'buy' && myTeam.purse < player.soldPrice) {
            alert("Not enough purse to buy this player!");
            return;
        }

        const request = {
            fromTeamId: this.props.myTeamId,
            toTeamId,
            playerId: player.id,
            playerName: player.name,
            price: player.soldPrice,
            type,
            status: 'pending',
            timestamp: Date.now()
        };

        const roomRef = ref(db, `rooms/${this.props.roomCode}`);
        update(roomRef, { transferRequest: request });
    };

    handleAcceptTransfer = async () => {
        const { roomData } = this.state;
        const req = roomData.transferRequest;
        
        const updatedTeams = roomData.teams.map(team => {
            if (team.id === req.fromTeamId) {
                // Buying team
                const sellerTeam = roomData.teams.find(t => t.id === req.toTeamId);
                const player = sellerTeam.players.find(p => p.id === req.playerId);
                return {
                    ...team,
                    purse: team.purse - req.price,
                    players: [...(team.players || []), player]
                };
            }
            if (team.id === req.toTeamId) {
                // Selling team
                return {
                    ...team,
                    purse: team.purse + req.price,
                    players: (team.players || []).filter(p => p.id !== req.playerId)
                };
            }
            return team;
        });

        const roomRef = ref(db, `rooms/${this.props.roomCode}`);
        await update(roomRef, { 
            teams: updatedTeams, 
            transferRequest: null 
        });
    };

    render() {
        const { roomData } = this.state;
        if (!roomData) return null;

        const myTeam = roomData.teams.find(t => t.id === this.props.myTeamId);
        const otherTeams = roomData.teams.filter(t => t.id !== this.props.myTeamId);
        const req = roomData.transferRequest;

        return (
            <div className="container animate-fade-in">
                <h1 className="gradient-text text-center text-5xl font-black mb-4">TRANSFER WINDOW</h1>
                <p className="text-center text-secondary mb-12">Swap players or buy from other teams before the match starts.</p>

                {req && req.toTeamId === this.props.myTeamId && (
                    <div className="glass p-8 border-accent mb-8 animate-pulse">
                        <h2 className="text-xl font-bold text-accent mb-4 underline">TRANSFER REQUEST RECEIVED!</h2>
                        <p className="text-white mb-6">
                            Team <span className="text-accent font-bold">{roomData.teams.find(t => t.id === req.fromTeamId).name}</span> wants to {req.type} <span className="text-accent font-bold">{req.playerName}</span> for <span className="text-accent font-bold">{req.price} Cr</span>.
                        </p>
                        <div className="flex gap-4">
                            <button className="btn btn-primary px-8 py-3" onClick={this.handleAcceptTransfer}>ACCEPT</button>
                            <button className="btn btn-outline px-8 py-3" onClick={() => update(ref(db, `rooms/${this.props.roomCode}`), { transferRequest: null })}>REJECT</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* My Squad */}
                    <div className="glass p-6">
                        <h3 className="text-accent font-bold mb-4 uppercase tracking-widest border-b border-white border-opacity-10 pb-2">Your Squad</h3>
                        <div className="flex flex-col gap-2">
                            {myTeam.players?.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-white bg-opacity-5 rounded hover:bg-opacity-10 transition-all">
                                    <span>{p.name} ({p.role})</span>
                                    <span className="text-accent font-bold">{p.soldPrice} Cr</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Market */}
                    <div className="glass p-6">
                        <h3 className="text-accent font-bold mb-4 uppercase tracking-widest border-b border-white border-opacity-10 pb-2">Market (Other Teams)</h3>
                        <div className="flex flex-col gap-6">
                            {otherTeams.map(team => (
                                <div key={team.id}>
                                    <h4 className="text-sm font-bold text-secondary mb-3">{team.name} Players</h4>
                                    <div className="flex flex-col gap-2">
                                        {team.players?.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-white bg-opacity-5 rounded">
                                                <div>
                                                    <div className="font-bold">{p.name}</div>
                                                    <div className="text-xs text-secondary">{p.role} | {p.soldPrice} Cr</div>
                                                </div>
                                                <button 
                                                    className="btn btn-primary text-xs py-1 px-3 shadow-none"
                                                    onClick={() => this.handleProposeTransfer(team.id, p, 'buy')}
                                                    disabled={!!req}
                                                >BUY</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <button className="btn btn-outline px-10 py-4" onClick={() => update(ref(db, `rooms/${this.props.roomCode}`), { status: 'selection' })}>
                        Finish Transfers & Select XI
                    </button>
                </div>
            </div>
        );
    }
}

export default TransferWindow;
