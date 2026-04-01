import React, { Component } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, firestore, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

class ResultsPage extends Component {
    state = {
        mySelection: { xi: [], impact: [], ready: false },
        selectionMode: 'xi',
        roomData: null,
        matchPrediction: null,
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
                let newSelection = this.state.mySelection;
                if (data.selections && data.selections[this.props.myTeamId]) {
                    const dbSel = data.selections[this.props.myTeamId];
                    newSelection = {
                        xi: dbSel.xi || [],
                        impact: dbSel.impact || [],
                        ready: dbSel.ready || false
                    };
                }
                this.setState({ roomData: data, mySelection: newSelection });
            }
        });
    };

    componentWillUnmount() {
        if (this.roomListener) this.roomListener();
    }

    togglePlayer = (playerId) => {
        const { mySelection, selectionMode } = this.state;
        const sel = { ...mySelection };

        if (selectionMode === 'xi') {
            if (sel.xi.includes(playerId)) {
                sel.xi = sel.xi.filter(id => id !== playerId);
                sel.impact = sel.impact.filter(id => id !== playerId);
            } else {
                if (sel.xi.length >= 11) {
                    alert("You can only select 11 players for Playing XI!");
                    return;
                }
                sel.xi = [...sel.xi, playerId];
            }
        } else {
            if (!sel.xi.includes(playerId)) {
                alert("Player must be in Playing XI first!");
                return;
            }
            if (sel.impact.includes(playerId)) {
                sel.impact = sel.impact.filter(id => id !== playerId);
            } else {
                if (sel.impact.length >= 1) {
                    alert("You can only select 1 Impact Player!");
                    return;
                }
                sel.impact = [...sel.impact, playerId];
            }
        }

        // Sync to Firebase
        const selectionRef = ref(db, `rooms/${this.props.roomCode}/selections/${this.props.myTeamId}`);
        update(selectionRef, sel);
    };

    confirmSelection = () => {
        const { mySelection } = this.state;
        if (mySelection.xi.length !== 11) {
            alert("Please select exactly 11 players!");
            return;
        }
        if (mySelection.impact.length !== 1) {
            alert("Please select 1 Impact Player!");
            return;
        }

        const selectionRef = ref(db, `rooms/${this.props.roomCode}/selections/${this.props.myTeamId}`);
        update(selectionRef, { ...mySelection, ready: true });
    };

    // Dream11-style fantasy points from career stats
    calcFantasyPoints = (player, isImpact = false) => {
        const stats = player.stats || {};
        const role = player.role;
        let pts = 0;
        const matches = stats.matches || 1;

        // BATTING
        if (role !== 'Bowler') {
            const avgRuns = (stats.runs || 0) / matches;
            const sr = stats.strikeRate || 100;
            pts += avgRuns;
            if (avgRuns >= 100) pts += 16;
            else if (avgRuns >= 50) pts += 8;
            if (sr > 170) pts += 6;
            else if (sr >= 150) pts += 4;
            else if (sr >= 130) pts += 2;
            else if (sr < 70) pts -= 6;
            else if (sr < 100) pts -= 4;
        }

        // BOWLING
        if (role === 'Bowler' || role === 'All-rounder') {
            const avgWickets = (stats.wickets || 0) / matches;
            const eco = stats.economy || 8;
            pts += avgWickets * 20;
            if (avgWickets >= 5) pts += 16;
            else if (avgWickets >= 4) pts += 8;
            else if (avgWickets >= 3) pts += 4;
            if (eco < 5) pts += 6;
            else if (eco < 6) pts += 4;
            else if (eco < 7) pts += 2;
            else if (eco >= 11 && eco < 12) pts -= 4;
            else if (eco > 12) pts -= 6;
            else if (eco >= 10) pts -= 2;
            if (eco < 7) pts += (matches / 5) * 12 / matches;
        }

        // FIELDING
        if (role === 'Wicketkeeper') {
            pts += (matches / 3) * 6 / matches;
            pts += (matches / 3) * 8 / matches;
        } else {
            pts += (matches / 5) * 8 / matches;
        }

        if (isImpact) pts *= 1.15;
        return Math.max(0, Math.round(pts * 10) / 10);
    };

    analyzeMatch = () => {
        const { roomData } = this.state;
        if (!roomData || !roomData.teams) return;

        const teamScores = roomData.teams.map(team => {
            const sel = roomData.selections?.[team.id] || { xi: [], impact: [] };
            const xiPlayers = (team.players || []).filter(p => sel.xi.includes(p.id));
            const impactPlayer = (team.players || []).find(p => sel.impact.includes(p.id));
            
            let totalRating = 0, battingPower = 0, bowlingPower = 0, allRoundDepth = 0;
            let batsmen = 0, bowlers = 0, allrounders = 0, wk = 0;
            let totalSpend = 0, avgStrikeRate = 0, avgEconomy = 0;
            let srCount = 0, ecoCount = 0;
            let totalFantasyPoints = 0;

            xiPlayers.forEach(p => {
                totalRating += p.rating;
                totalSpend += (p.soldPrice || p.basePrice);
                totalFantasyPoints += this.calcFantasyPoints(p, sel.impact.includes(p.id));

                if (p.role === 'Batsman') { batsmen++; battingPower += p.rating; }
                else if (p.role === 'Bowler') { bowlers++; bowlingPower += p.rating; }
                else if (p.role === 'All-rounder') { allrounders++; allRoundDepth += p.rating; battingPower += p.rating * 0.5; bowlingPower += p.rating * 0.5; }
                else if (p.role === 'Wicketkeeper') { wk++; battingPower += p.rating; }

                if (p.stats) {
                    if (p.stats.strikeRate && p.role !== 'Bowler') { avgStrikeRate += p.stats.strikeRate; srCount++; }
                    if (p.stats.economy && p.role !== 'Batsman' && p.role !== 'Wicketkeeper') { avgEconomy += p.stats.economy; ecoCount++; }
                }
            });

            let impactBonus = 0;
            if (impactPlayer) {
                impactBonus = impactPlayer.rating * 0.15;
                totalRating += impactBonus;
            }

            const avgRating = xiPlayers.length > 0 ? totalRating / xiPlayers.length : 0;
            avgStrikeRate = srCount > 0 ? avgStrikeRate / srCount : 0;
            avgEconomy = ecoCount > 0 ? avgEconomy / ecoCount : 99;

            let balanceScore = 0;
            if (wk >= 1) balanceScore += 10;
            if (batsmen >= 3 && batsmen <= 5) balanceScore += 15;
            if (bowlers >= 3 && bowlers <= 5) balanceScore += 15;
            if (allrounders >= 2) balanceScore += 15;
            if (bowlers + allrounders >= 5) balanceScore += 10;

            let strengths = [], weaknesses = [];
            if (battingPower > 250) strengths.push('Formidable batting lineup');
            if (bowlingPower > 250) strengths.push('Elite bowling attack');
            if (allrounders >= 3) strengths.push('Excellent all-round balance');
            if (wk >= 1) strengths.push('Solid wicket-keeping presence');
            if (totalFantasyPoints > 500) strengths.push('High fantasy point earners');
            if (battingPower < 200) weaknesses.push('Thin batting order');
            if (bowlingPower < 200) weaknesses.push('Vulnerable bowling attack');
            if (allrounders < 2) weaknesses.push('Lack of multi-dimensional players');
            if (avgEconomy > 8.5) weaknesses.push('Expensive bowling unit');

            return {
                team,
                avgRating: avgRating.toFixed(1),
                battingPower: battingPower.toFixed(0),
                bowlingPower: bowlingPower.toFixed(0),
                allRoundDepth: allRoundDepth.toFixed(0),
                balanceScore,
                avgStrikeRate: avgStrikeRate.toFixed(1),
                avgEconomy: avgEconomy.toFixed(1),
                totalSpend: totalSpend.toFixed(1),
                totalFantasyPoints: totalFantasyPoints.toFixed(1),
                batsmen, bowlers, allrounders, wk,
                impactPlayer,
                impactBonus: impactBonus.toFixed(1),
                overallStrength: totalFantasyPoints, // Fantasy points is the winner metric
                strengths, weaknesses
            };
        });

        const sorted = [...teamScores].sort((a, b) => b.overallStrength - a.overallStrength);
        const winner = sorted[0];
        const totalStrength = teamScores.reduce((s, t) => s + t.overallStrength, 0);

        // Auction Highlights
        const allBoughtPlayers = roomData.teams.flatMap(t =>
            (t.players || []).map(p => ({ ...p, teamName: t.name, teamId: t.id }))
        );
        const highestPaid = allBoughtPlayers.reduce((max, p) => p.soldPrice > (max?.soldPrice || 0) ? p : max, null);
        const stealPlayer = allBoughtPlayers.filter(p => p.rating >= 80).reduce((best, p) => {
            const ratio = p.soldPrice / (p.basePrice || 1);
            const bestRatio = best ? best.soldPrice / (best.basePrice || 1) : Infinity;
            return ratio < bestRatio ? p : best;
        }, null);
        const teamSpend = roomData.teams.map(t => ({
            name: t.name, spent: (t.players || []).reduce((s, p) => s + (p.soldPrice || 0), 0)
        }));
        const biggestSpender = teamSpend.reduce((max, t) => t.spent > max.spent ? t : max, teamSpend[0] || { name: '', spent: 0 });

        this.setState({
            matchPrediction: {
                teamScores, winner: winner.team,
                winChance: totalStrength > 0 ? ((winner.overallStrength / totalStrength) * 100).toFixed(1) : 50,
                highlights: { highestPaid, stealPlayer, biggestSpender },
            }
        });

        this.saveMatchHistory(teamScores, winner.team);
    };


    saveMatchHistory = async (teamScores, winningTeam) => {
        if (!auth.currentUser) return;
        
        const myTeamScore = teamScores.find(ts => ts.team.id === this.props.myTeamId);
        const opponentScore = teamScores.find(ts => ts.team.id !== this.props.myTeamId);
        const mySelection = this.state.roomData.selections[this.props.myTeamId];

        if (!myTeamScore) return;

        try {
            await addDoc(collection(firestore, "matchHistory"), {
                userId: auth.currentUser.uid,
                timestamp: Date.now(),
                teamId: this.props.myTeamId,
                teamName: myTeamScore.team.name,
                opponentName: opponentScore ? opponentScore.team.name : 'Unknown',
                isWinner: winningTeam.id === this.props.myTeamId,
                xi: (myTeamScore.team.players || []).filter(p => mySelection.xi.includes(p.id)).map(p => p.name),
                verdict: winningTeam.id === this.props.myTeamId ? "Victory based on superior team balance." : "Defeated by a more balanced opponent squad."
            });
            console.log("Match history saved successfully!");
        } catch (error) {
            console.error("Error saving match history:", error);
        }
    };

    render() {
        const { roomData, mySelection, selectionMode, matchPrediction } = this.state;
        if (!roomData) return null;

        const teams = roomData.teams || [];
        const selections = roomData.selections || {};
        const qualifiedTeams = teams.filter(t => t.qualified !== false);
        const allTeamsReady = qualifiedTeams.every(t => selections[t.id]?.ready);

        return (
            <div className="container pb-20 animate-fade-in">
                <h1 className="gradient-text text-center mb-4 text-5xl font-black tracking-tight">AUCTION RESULTS</h1>
                <p className="text-center text-secondary mb-8 text-lg">
                    {allTeamsReady
                        ? 'All teams are ready! Click "Predict Match Winner" to see the AI analysis.'
                        : 'Select your team\'s Playing XI (11 players) + 1 Impact Player.'}
                </p>

                {/* Match Prediction Overlay */}
                {matchPrediction && (
                    <div className="prediction-overlay" onClick={() => this.setState({ matchPrediction: null })}>
                        <div className="prediction-card" onClick={e => e.stopPropagation()}>
                            <h2 className="gradient-text text-3xl font-black text-center mb-6"> AI MATCH PREDICTION</h2>

                            {/* VS Header */}
                            <div className="prediction-vs">
                                <div className="prediction-team">
                                    <div className="prediction-team-name">{matchPrediction.teamScores[0]?.team.name}</div>
                                    <div className="text-sm text-secondary">
                                        {matchPrediction.teamScores[0]?.batsmen}B / {matchPrediction.teamScores[0]?.bowlers}BW / {matchPrediction.teamScores[0]?.allrounders}AR / {matchPrediction.teamScores[0]?.wk}WK
                                    </div>
                                </div>
                                <div className="prediction-vs-text">VS</div>
                                <div className="prediction-team">
                                    <div className="prediction-team-name">{matchPrediction.teamScores[1]?.team.name}</div>
                                    <div className="text-sm text-secondary">
                                        {matchPrediction.teamScores[1]?.batsmen}B / {matchPrediction.teamScores[1]?.bowlers}BW / {matchPrediction.teamScores[1]?.allrounders}AR / {matchPrediction.teamScores[1]?.wk}WK
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Stats */}
                            {[
                                { label: 'Avg Rating', key: 'avgRating' },
                                { label: 'Batting Power', key: 'battingPower' },
                                { label: 'Bowling Power', key: 'bowlingPower' },
                                { label: 'All-Round Depth', key: 'allRoundDepth' },
                                { label: 'Balance Score', key: 'balanceScore' },
                                { label: 'Avg Strike Rate', key: 'avgStrikeRate' },
                                { label: 'Avg Economy', key: 'avgEconomy' },
                                { label: 'Total Spend (Cr)', key: 'totalSpend' },
                                { label: 'Fantasy Points ⭐', key: 'totalFantasyPoints' },
                            ].map(stat => {
                                const v1 = parseFloat(matchPrediction.teamScores[0]?.[stat.key] || 0);
                                const v2 = parseFloat(matchPrediction.teamScores[1]?.[stat.key] || 0);
                                const max = Math.max(v1, v2, 1);
                                const isEcoReversed = stat.key === 'avgEconomy'; // lower is better
                                const t1Better = isEcoReversed ? v1 < v2 : v1 > v2;

                                return (
                                    <div key={stat.key} className="prediction-stat-row">
                                        <div className={`prediction-stat-value text-left ${t1Better ? 'text-accent' : 'text-secondary'}`}>
                                            {matchPrediction.teamScores[0]?.[stat.key]}
                                        </div>
                                        <div className="prediction-stat-label">{stat.label}</div>
                                        <div className={`prediction-stat-value text-right ${!t1Better ? 'text-success' : 'text-secondary'}`}>
                                            {matchPrediction.teamScores[1]?.[stat.key]}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Impact Players */}
                            <div className="prediction-stat-row mt-4">
                                <div className="prediction-stat-value text-left text-accent">
                                    {matchPrediction.teamScores[0]?.impactPlayer?.name || 'None'}
                                </div>
                                <div className="prediction-stat-label">Impact Player</div>
                                <div className="prediction-stat-value text-right text-success">
                                    {matchPrediction.teamScores[1]?.impactPlayer?.name || 'None'}
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white border-opacity-10 pt-6">
                                {matchPrediction.teamScores.map((ts, idx) => (
                                    <div key={idx} className="text-left">
                                        <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{ts.team.name} ANALYSIS</div>
                                        <div className="mb-4">
                                            {ts.strengths.map((s, i) => (
                                                <div key={i} className="text-xs text-success mb-1">✅ {s}</div>
                                            ))}
                                        </div>
                                        <div>
                                            {ts.weaknesses.map((w, i) => (
                                                <div key={i} className="text-xs text-danger mb-1">❌ {w}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Auction Highlights */}
                            {matchPrediction.highlights && (
                                <div className="mt-8 mb-6 p-4 rounded-xl border border-accent border-opacity-30" style={{ background: 'rgba(212,175,55,0.05)' }}>
                                    <h3 className="text-accent text-center text-xs font-bold tracking-widest uppercase mb-4"> Auction Highlights</h3>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        {matchPrediction.highlights.highestPaid && (
                                            <div>
                                                <div className="text-2xl mb-1">💰</div>
                                                <div className="text-[9px] text-secondary uppercase font-bold tracking-wider">Highest Paid</div>
                                                <div className="text-sm font-black text-white">{matchPrediction.highlights.highestPaid.name}</div>
                                                <div className="text-xs text-accent">{matchPrediction.highlights.highestPaid.soldPrice} Cr</div>
                                            </div>
                                        )}
                                        {matchPrediction.highlights.stealPlayer && (
                                            <div>
                                                <div className="text-2xl mb-1"></div>
                                                <div className="text-[9px] text-secondary uppercase font-bold tracking-wider">Steal Buy</div>
                                                <div className="text-sm font-black text-white">{matchPrediction.highlights.stealPlayer.name}</div>
                                                <div className="text-xs text-success">{matchPrediction.highlights.stealPlayer.soldPrice} Cr</div>
                                            </div>
                                        )}
                                        {matchPrediction.highlights.biggestSpender && (
                                            <div>
                                                <div className="text-2xl mb-1">🔥</div>
                                                <div className="text-[9px] text-secondary uppercase font-bold tracking-wider">Top Spender</div>
                                                <div className="text-sm font-black text-white">{matchPrediction.highlights.biggestSpender.name}</div>
                                                <div className="text-xs text-primary">{Math.round(matchPrediction.highlights.biggestSpender.spent)} Cr</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Winner */}
                            <div className={`prediction-winner ${matchPrediction.winner.id === teams[0]?.id ? 'prediction-winner--team1' : 'prediction-winner--team2'}`}>
                                <div className="prediction-winner-label"> Predicted Winner</div>
                                <div className={`prediction-winner-name ${matchPrediction.winner.id === teams[0]?.id ? 'text-accent' : 'text-success'}`}>
                                    {matchPrediction.winner.name}
                                </div>
                                <div className="prediction-win-chance">
                                    Win Probability: <strong>{matchPrediction.winChance}%</strong>
                                </div>
                            </div>

                            <div className="text-center mt-6">
                                <button className="btn btn-outline px-10 py-3" onClick={() => this.setState({ matchPrediction: null })}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Predict Button */}
                {allTeamsReady && !matchPrediction && (
                    <div className="text-center mb-12 animate-fade-in">
                        <button className="btn btn-primary px-10 py-4 text-lg animate-pulse" onClick={this.analyzeMatch}>
                             Predict Match Winner
                        </button>
                    </div>
                )}

                {/* Team Cards */}
                <div className={allTeamsReady ? "grid grid-cols-auto-fill gap-8" : "flex justify-center items-start w-full"}>
                    {teams.map(team => {
                        const isMyTeam = team.id === this.props.myTeamId;
                        const rawSel = selections[team.id] || {};
                        const sel = {
                            xi: rawSel.xi || [],
                            impact: rawSel.impact || [],
                            ready: rawSel.ready || false
                        };
                        const isLocked = sel.ready || allTeamsReady;

                        // Host can see everything if all ready, or just their own.
                        // Non-host only sees their own until all ready.
                        if (!allTeamsReady && !isMyTeam) return null;

                        if (!allTeamsReady && isMyTeam && sel.ready) {
                            // User is waiting for opponents
                            return (
                                <div key={team.id} className="glass p-12 text-center max-w-2xl w-full border-2 border-success animate-fade-in mx-auto">
                                    <div className="text-6xl mb-6">⏳</div>
                                    <h2 className="text-3xl font-black text-success tracking-widest uppercase mb-4">SQUAD LOCKED</h2>
                                    <p className="text-secondary text-lg">Waiting for other franchises to finalize their Playing XI...</p>
                                    <div className="mt-8 animate-pulse text-accent font-bold tracking-widest">DO NOT LEAVE THIS PAGE</div>
                                </div>
                            );
                        }

                        return (
                            <div key={team.id} className={`glass p-8 relative ${isMyTeam ? 'border-accent' : ''} ${!isMyTeam ? 'opacity-90' : ''} ${!allTeamsReady ? 'w-full max-w-4xl mx-auto' : ''}`} style={isMyTeam && !sel.ready ? { borderWidth: '2px' } : {}}>
                                <div className="flex justify-between items-center mb-4 border-b-2 border-accent pb-4">
                                    <h2 className="text-2xl font-bold text-accent uppercase">
                                        {team.name}
                                        {isMyTeam && !sel.ready && <span className="text-[10px] bg-accent text-dark px-2 py-1 rounded ml-2 align-middle font-bold">YOUR TEAM</span>}
                                        {sel.ready && <span className="text-[10px] bg-success text-dark px-2 py-1 rounded ml-2 align-middle font-bold">✓ READY</span>}
                                    </h2>
                                    <div className="text-right">
                                        <div className="text-xs text-secondary font-bold tracking-widest uppercase mb-1">PURSE</div>
                                        <div className="font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm text-secondary">Cr</span></div>
                                    </div>
                                </div>

                                {/* Selection Controls */}
                                {isMyTeam && !sel.ready && (
                                    <div className="mb-6 animate-fade-in">
                                        <div className="xi-selection-header mb-4">
                                            <div className="flex gap-3">
                                                <button
                                                    className={`btn text-xs py-2 px-4 ${selectionMode === 'xi' ? 'btn-primary' : 'btn-outline'}`}
                                                    onClick={() => this.setState({ selectionMode: 'xi' })}
                                                >XI ({sel.xi.length}/11)</button>
                                                <button
                                                    className={`btn text-xs py-2 px-4 ${selectionMode === 'impact' ? 'btn-primary' : 'btn-outline'}`}
                                                    onClick={() => this.setState({ selectionMode: 'impact' })}
                                                >IMPACT ({sel.impact.length}/1)</button>
                                            </div>
                                            <div className={`xi-counter ${sel.xi.length === 11 && sel.impact.length === 1 ? 'text-success' : 'text-accent'} font-bold`}>
                                                {sel.xi.length === 11 && sel.impact.length === 1 ? 'ALL SET!' : `${sel.xi.length}/11`}
                                            </div>
                                        </div>

                                        {sel.xi.length === 11 && sel.impact.length === 1 && (
                                            <button className="btn btn-primary w-full py-4 text-md font-black tracking-widest uppercase shadow-lg shadow-success/20" onClick={this.confirmSelection}>
                                                LOCK PLAYING XI
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Player List */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-secondary text-sm font-bold tracking-widest uppercase">Squad ({team.players ? team.players.length : 0})</h4>
                                    {!team.players || team.players.length === 0 ? (
                                        <div className="text-secondary text-sm bg-panel p-4 rounded text-center">No players bought.</div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {team.players.map((p, i) => {
                                                const inXI = sel.xi.includes(p.id);
                                                const isImpact = sel.impact.includes(p.id);
                                                let rowClass = 'player-row';
                                                if (isImpact) rowClass += ' player-row--impact';
                                                else if (inXI) rowClass += ' player-row--xi';

                                                return (
                                                    <div
                                                        key={i}
                                                        className={rowClass}
                                                        onClick={() => isMyTeam && !sel.ready && this.togglePlayer(p.id)}
                                                        style={!isMyTeam || sel.ready ? { cursor: 'default' } : {}}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <img src={p.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,175,55,0.5)' }} />
                                                            <div>
                                                                <div className="font-bold text-sm">
                                                                    {p.name}
                                                                    {isImpact && <span className="impact-badge">IMPACT</span>}
                                                                </div>
                                                                <div className="text-xs text-secondary">{p.role}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-accent text-sm">{p.soldPrice} Cr</div>
                                                            <div className="text-xs text-secondary">{p.rating} RTG</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-16 animate-fade-in">
                    <button className="btn btn-outline px-10 py-4 text-lg" onClick={() => this.props.setView('modeSelect')}>Start New Auction</button>
                </div>
            </div>
        );
    }
}

export default ResultsPage;
