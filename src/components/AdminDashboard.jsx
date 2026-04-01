import React, { Component } from 'react';
import { db, firestore } from '../firebase';
import { ref, onValue, off } from 'firebase/database';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

class AdminDashboard extends Component {
    state = {
        rooms: [],
        matchHistory: [],
        usersList: [],
        loading: true,
        allTimeBid: null,   // { playerName, teamName, price, roomId }
        stats: {
            totalUsers: 0,
            activeRooms: 0,
            ongoingAuctions: 0,
        }
    };

    componentDidMount() {
        this.fetchData();
    }

    componentWillUnmount() {
        const roomsRef = ref(db, 'rooms');
        off(roomsRef);
    }

    fetchData = async () => {
        // Fetch Rooms from Realtime DB
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const roomsList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            const activeRooms = roomsList.filter(r => r.status && r.status !== 'finished').length;
            const ongoingAuctions = roomsList.filter(r => r.status === 'active').length;

            // Compute all-time highest bid across ALL rooms
            let allTimeBid = null;
            roomsList.forEach(room => {
                (room.teams || []).forEach(team => {
                    (team.players || []).forEach(player => {
                        if (!allTimeBid || player.soldPrice > allTimeBid.price) {
                            allTimeBid = {
                                playerName: player.name,
                                role: player.role,
                                rating: player.rating,
                                teamName: team.name,
                                price: player.soldPrice,
                                roomId: room.id,
                            };
                        }
                    });
                });
            });

            this.setState(prevState => ({
                rooms: roomsList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
                allTimeBid,
                stats: {
                    ...prevState.stats,
                    activeRooms,
                    ongoingAuctions
                }
            }));
        });

        // Fetch Users/Match History from Firestore
        try {
            const q = query(collection(firestore, "matchHistory"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const matchHistory = [];
            const uniqueUsers = new Set();

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                matchHistory.push(data);
                uniqueUsers.add(data.userId); // Counts players directly active in matches
            });

            // Fetch actual User Accounts
            const usersSnapshot = await getDocs(collection(firestore, "users"));
            const usersList = [];
            usersSnapshot.forEach(uDoc => {
                usersList.push(uDoc.data());
            });

            this.setState(prevState => ({
                matchHistory,
                usersList: usersList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
                stats: {
                    ...prevState.stats,
                    totalUsers: Math.max(uniqueUsers.size, usersList.length)
                },
                loading: false
            }));
        } catch (error) {
            console.error("Error fetching admin data:", error);
            this.setState({ loading: false });
        }
    };

    handleDeleteUser = async (uid, name) => {
        if (window.confirm(`Are you absolutely sure you want to delete data for account: ${name}?`)) {
            try {
                await deleteDoc(doc(firestore, "users", uid));
                this.setState(prevState => ({
                    usersList: prevState.usersList.filter(u => u.uid !== uid)
                }));
                alert(`Account data for ${name} removed. Note: Authentication credentials must be revoked in the Firebase Console by the developer to fully block login.`);
            } catch (err) {
                console.error("Failed to delete user", err);
                alert("Deletion failed.");
            }
        }
    };

    render() {
        const { stats, rooms, matchHistory, usersList, loading, allTimeBid } = this.state;

        if (loading) return <div className="container text-center py-20 text-accent font-bold animate-pulse text-2xl tracking-widest uppercase">Fetching Central Data...</div>;

        return (
            <div className="container animate-fade-in max-w-6xl pb-20">
                {this.props.setView && (
                    <button 
                        className="btn btn-outline mb-6 px-4 py-2 text-sm flex items-center gap-2"
                        onClick={() => this.props.setView('modeSelect')}
                    >
                        <span>← Back to Dashboard</span>
                    </button>
                )}
                <h1 className="gradient-text text-4xl mb-8 font-black tracking-tight uppercase text-center md:text-left">Creator Dashboard</h1>

                {/* ── All-Time Highest Bid Hall of Fame ── */}
                {allTimeBid && (
                    <div className="glass p-6 mb-8" style={{ borderTop: '3px solid #d4af37', background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(0,0,0,0.3))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '2rem' }}></span>
                            <div>
                                <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: '#d4af37', fontWeight: 700, textTransform: 'uppercase' }}>All-Time Record Bid</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>Hall of Fame</div>
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d4af37', lineHeight: 1 }}>{allTimeBid.price} Cr</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Highest ever paid</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '12px', padding: '12px 20px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px' }}>Player</div>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>{allTimeBid.playerName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{allTimeBid.role} • ⭐ {allTimeBid.rating}</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', color: '#d4af37' }}>→</div>
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '12px 20px' }}>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px' }}>Bought By</div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#22c55e' }}>{allTimeBid.teamName}</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Room: {allTimeBid.roomId}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass p-8 text-center border-t-2 border-accent">
                        <div className="text-4xl font-black text-accent mb-2">{stats.totalUsers}</div>
                        <div className="text-xs text-secondary font-bold uppercase tracking-widest">Active Managers</div>
                    </div>
                    <div className="glass p-8 text-center border-t-2 border-primary">
                        <div className="text-4xl font-black text-primary mb-2">{stats.activeRooms}</div>
                        <div className="text-xs text-secondary font-bold uppercase tracking-widest">Active Lobbies</div>
                    </div>
                    <div className="glass p-8 text-center border-t-2 border-success">
                        <div className="text-4xl font-black text-success mb-2">{stats.ongoingAuctions}</div>
                        <div className="text-xs text-secondary font-bold uppercase tracking-widest">Ongoing Auctions</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Rooms List */}
                    <div className="glass p-6 scrollable-panel max-h-[500px] overflow-y-auto">
                        <h2 className="text-xl font-bold text-accent tracking-widest uppercase mb-4 sticky top-0 z-10 py-2" style={{ backgroundColor: 'inherit' }}>All Lobbies Array</h2>
                        {rooms.length === 0 ? <p className="text-secondary italic">No rooms created.</p> : 
                            <div className="flex flex-col gap-3">
                                {rooms.map(r => (
                                    <div key={r.id} className="bg-panel p-4 rounded border border-white border-opacity-5 relative overflow-hidden">
                                        {r.status === 'active' && <div className="absolute top-0 right-0 w-2 h-full bg-success animate-pulse"></div>}
                                        <div className="flex justify-between mb-2 items-center pr-4">
                                            <span className="font-bold text-lg text-primary">{r.id}</span>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${r.status === 'active' ? 'bg-success text-dark' : r.status==='finished' ? 'bg-secondary text-dark' : 'bg-accent text-dark'}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-secondary mb-1">Created: <span className="text-white">{new Date(r.createdAt).toLocaleString()}</span></div>
                                        <div className="text-xs text-secondary mb-1">Registered Teams: <span className="text-white">{r.teams ? r.teams.length : 0} / {r.maxAllowedTeams || r.maxPlayers || '?'}</span></div>
                                        <div className="text-xs text-accent mt-2 line-clamp-1">
                                            Teams: {r.teams ? r.teams.map(t => t.name).join(', ') : 'None'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>

                    {/* Global Match History Logs */}
                    <div className="glass p-6 scrollable-panel max-h-[500px] overflow-y-auto">
                        <h2 className="text-xl font-bold text-accent tracking-widest uppercase mb-4 sticky top-0 z-10 py-2" style={{ backgroundColor: 'inherit' }}>Global Match Activity</h2>
                        {matchHistory.length === 0 ? <p className="text-secondary italic">No match history available.</p> : 
                            <div className="flex flex-col gap-3">
                                {matchHistory.map((m, i) => (
                                    <div key={i} className={`bg-panel p-4 rounded border-l-4 ${m.isWinner ? 'border-success' : 'border-danger'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-sm text-white">{m.teamName} <span className="text-secondary text-xs mx-1">vs</span> {m.opponentName}</div>
                                            <div className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${m.isWinner ? 'bg-success text-dark' : 'bg-danger text-white'}`}>{m.isWinner ? 'Won' : 'Lost'}</div>
                                        </div>
                                        <div className="text-[10px] text-secondary mb-2 whitespace-nowrap overflow-hidden text-ellipsis">User ID: {m.userId}</div>
                                        <div className="text-xs text-accent italic line-clamp-2 mb-2">"{m.verdict}"</div>
                                        <div className="text-[10px] text-secondary text-right">{new Date(m.timestamp).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>

                    {/* Master User Directory */}
                    <div className="glass p-6 scrollable-panel max-h-[500px] overflow-y-auto lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 sticky top-0 z-10 py-2" style={{ backgroundColor: 'inherit' }}>
                            <h2 className="text-xl font-bold text-accent tracking-widest uppercase">Master User Directory ({usersList.length})</h2>
                        </div>
                        {usersList.length === 0 ? <p className="text-secondary italic">No users found in database.</p> : 
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-secondary">
                                    <thead className="text-xs text-accent uppercase bg-panel">
                                        <tr>
                                            <th className="px-4 py-3">Manager Name</th>
                                            <th className="px-4 py-3">Email Address</th>
                                            <th className="px-4 py-3">Account Created</th>
                                            <th className="px-4 py-3 text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersList.map((usr) => (
                                            <tr key={usr.uid} className="border-b border-white border-opacity-10">
                                                <td className="px-4 py-3 font-bold text-white">{usr.username}</td>
                                                <td className="px-4 py-3">{usr.email}</td>
                                                <td className="px-4 py-3">{new Date(usr.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {usr.email !== 'admin@aplauction.com' && (
                                                        <button 
                                                            className="text-xs bg-danger text-white px-3 py-1 rounded font-bold hover:bg-opacity-80 transition-colors"
                                                            onClick={() => this.handleDeleteUser(usr.uid, usr.username)}
                                                        >
                                                            DELETE
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default AdminDashboard;
