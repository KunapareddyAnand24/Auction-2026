import React, { Component } from 'react';
import { firestore, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

class UserProfile extends Component {
    state = {
        history: [],
        loading: true,
        stats: {
            total: 0,
            won: 0,
            lost: 0
        }
    };

    componentDidMount() {
        this.fetchHistory();
    }

    fetchHistory = async () => {
        if (!auth.currentUser) return;
        
        try {
            const q = query(
                collection(firestore, "matchHistory"),
                where("userId", "==", auth.currentUser.uid),
                orderBy("timestamp", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const history = [];
            let won = 0;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                history.push(data);
                if (data.isWinner) won++;
            });

            this.setState({
                history,
                stats: {
                    total: history.length,
                    won: won,
                    lost: history.length - won
                },
                loading: false
            });
        } catch (error) {
            console.error("Error fetching history:", error);
            this.setState({ loading: false });
        }
    };

    render() {
        const { history, stats, loading } = this.state;
        const user = auth.currentUser;

        if (loading) return <div className="container text-center py-20 animate-pulse text-accent">LOADING PROFILE...</div>;

        return (
            <div className="container animate-fade-in max-w-4xl">
                <div className="glass p-10 mb-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-dark text-4xl font-black">
                        {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black gradient-text uppercase">{user.displayName || 'Manager'}</h1>
                        <p className="text-secondary">{user.email}</p>
                    </div>
                    <div className="flex-1"></div>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-black text-accent">{stats.total}</div>
                            <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Played</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-success">{stats.won}</div>
                            <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Won</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-danger">{stats.lost}</div>
                            <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Lost</div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-accent mb-6 uppercase tracking-widest">Match History</h2>
                
                {history.length === 0 ? (
                    <div className="glass p-12 text-center text-secondary italic">
                        No matches played yet. Start an auction to build your legacy!
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {history.map((match, i) => (
                            <div key={i} className={`glass p-6 border-l-4 ${match.isWinner ? 'border-success' : 'border-danger'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-lg font-bold">{match.teamName} <span className="text-secondary text-sm ml-2">vs {match.opponentName}</span></div>
                                        <div className="text-xs text-secondary">{new Date(match.timestamp).toLocaleDateString()} at {new Date(match.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <div className={`px-4 py-1 rounded-full text-xs font-bold ${match.isWinner ? 'bg-success text-dark' : 'bg-danger text-white'}`}>
                                        {match.isWinner ? '🏆 WINNER' : 'DEFEAT'}
                                    </div>
                                </div>
                                <div className="text-sm text-secondary mb-3">
                                    <span className="font-bold text-white">Playing XI:</span> {match.xi.join(", ")}
                                </div>
                                <div className="text-xs text-secondary italic">
                                    AI Verdict: {match.verdict}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

export default UserProfile;
