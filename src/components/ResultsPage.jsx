import React, { Component } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, firestore, auth } from '../firebase';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const FANTASY_RULES = {
    BATTING: {
        RUN: 1,
        BOUNDARY: 1,
        SIX: 2,
        FIFTY: 8,
        CENTURY: 16,
        SR_BONUS: {
            gt170: 6,
            "150to170": 4,
            "130to150": 2,
            lt50: -6,
            "50to60": -4,
            "60to70": -2
        }
    },
    BOWLING: {
        WICKET: 20,
        MAIDEN: 12,
        DOT: 1,
        WIDE_NOBALL: -2,
        BONUS: {
            "3w": 4,
            "4w": 8,
            "5w": 16
        },
        ECONOMY: {
            lt5: 6,
            "5to6": 4,
            "6to7": 2,
            "10to11": -2,
            "11to12": -4,
            gt12: -6
        }
    },
    FIELDING: {
        CATCH: 8,
        CATCH_3_BONUS: 4,
        STUMPING: 6,
        RUNOUT: 6
    }
};

class ResultsPage extends Component {
    state = {
        mySelection: { xi: [], impact: [], ready: false },
        selectionMode: 'xi',
        roomData: null,
        matchPrediction: null,
        simulating: false,
    };

    componentDidMount() {
        if (db && this.props.roomCode) {
            this.listenToRoom();
        } else if (this.props.teams) {
            // Support for non-Firebase (offline/computer) games
            this.setState({
                roomData: {
                    teams: this.props.teams,
                    selections: {}, // Will be populated as user picks
                    status: 'finished'
                }
            });
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

        // Sync to Firebase if room exists
        if (this.props.roomCode) {
            const selectionRef = ref(db, `rooms/${this.props.roomCode}/selections/${this.props.myTeamId}`);
            update(selectionRef, sel);
        } else {
            // Otherwise just keep it in local state (RoomPage handles it)
        }
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

        if (this.props.roomCode) {
            const selectionRef = ref(db, `rooms/${this.props.roomCode}/selections/${this.props.myTeamId}`);
            update(selectionRef, { ...mySelection, ready: true });
        } else {
            // Local path (Computer Auction)
            this.setState(prev => {
                const teams = prev.roomData.teams;
                // Auto-pick XI for AI to proceed
                const aiXI = (teams[1].players || []).slice(0, 11).map(p => p.id);
                return {
                    roomData: {
                        ...prev.roomData,
                        selections: {
                            ...prev.roomData.selections,
                            [this.props.myTeamId]: { ...mySelection, ready: true },
                            2: { xi: aiXI, impact: [aiXI[0]], ready: true }
                        }
                    }
                };
            });
        }
    };

    // Realistic Match Simulation based on RTG
    simulatePerformance = (player) => {
        const rtg = player.rating;
        const role = player.role;
        
        let perf = {
            runs: 0, balls: 0, fours: 0, sixes: 0,
            wickets: 0, overs: 0, maidens: 0, dots: 0, wides: 0, noballs: 0, economy: 0,
            catches: 0, stumpings: 0, runouts: 0
        };

        // BATTING SIMULATION
        if (role !== 'Bowler' || Math.random() > 0.5) {
            const potential = (rtg / 100) * 60; // Max 60 runs typical base
            perf.runs = Math.floor(Math.random() * potential * (Math.random() > 0.8 ? 2.5 : 1.5));
            perf.balls = Math.max(1, Math.floor(perf.runs / (0.8 + Math.random())));
            perf.fours = Math.floor(perf.runs * 0.1);
            perf.sixes = Math.floor(perf.runs * 0.05);
            if (perf.runs > 100) { perf.runs = 100 + Math.floor(Math.random() * 30); } // Cap century logic
        }

        // BOWLING SIMULATION
        if (role === 'Bowler' || role === 'All-rounder') {
            perf.overs = role === 'Bowler' ? 4 : (Math.random() > 0.5 ? 4 : 2);
            const wktChance = (rtg / 100) * 0.4; // Up to 0.4 wkts per over
            for(let i=0; i<perf.overs; i++) {
                if(Math.random() < wktChance) perf.wickets++;
                if(Math.random() > 0.9) perf.maidens++;
            }
            perf.economy = 5 + (100 - rtg)/10 + (Math.random() * 4 - 2);
            perf.dots = Math.floor(perf.overs * 6 * 0.4);
            perf.wides = Math.floor(Math.random() * 3);
            perf.noballs = Math.random() > 0.8 ? 1 : 0;
        }

        // FIELDING SIMULATION
        perf.catches = Math.random() > 0.7 ? (Math.random() > 0.9 ? 2 : 1) : 0;
        if (role === 'Wicketkeeper') {
            perf.stumpings = Math.random() > 0.8 ? 1 : 0;
            perf.catches += Math.random() > 0.5 ? 1 : 0;
        }
        perf.runouts = Math.random() > 0.9 ? 1 : 0;

        return perf;
    };

    // New Fantasy Points Calc based on simulated Performance
    calcFantasyPoints = (perf, role) => {
        let pts = 0;

        // BATTING
        pts += perf.runs * FANTASY_RULES.BATTING.RUN;
        pts += perf.fours * FANTASY_RULES.BATTING.BOUNDARY;
        pts += perf.sixes * FANTASY_RULES.BATTING.SIX;
        if (perf.runs >= 100) pts += FANTASY_RULES.BATTING.CENTURY;
        else if (perf.runs >= 50) pts += FANTASY_RULES.BATTING.FIFTY;

        const sr = perf.balls > 0 ? (perf.runs / perf.balls) * 100 : 0;
        if (perf.balls >= 10) {
            if (sr > 170) pts += FANTASY_RULES.BATTING.SR_BONUS.gt170;
            else if (sr > 150) pts += FANTASY_RULES.BATTING.SR_BONUS["150to170"];
            else if (sr > 130) pts += FANTASY_RULES.BATTING.SR_BONUS["130to150"];
            else if (sr < 50) pts += FANTASY_RULES.BATTING.SR_BONUS.lt50;
            else if (sr < 60) pts += FANTASY_RULES.BATTING.SR_BONUS["50to60"];
            else if (sr < 70) pts += FANTASY_RULES.BATTING.SR_BONUS["60to70"];
        }

        // BOWLING
        pts += perf.wickets * FANTASY_RULES.BOWLING.WICKET;
        pts += perf.maidens * FANTASY_RULES.BOWLING.MAIDEN;
        pts += perf.dots * FANTASY_RULES.BOWLING.DOT;
        pts += (perf.wides + perf.noballs) * FANTASY_RULES.BOWLING.WIDE_NOBALL;

        if (perf.wickets >= 5) pts += FANTASY_RULES.BOWLING.BONUS["5w"];
        else if (perf.wickets === 4) pts += FANTASY_RULES.BOWLING.BONUS["4w"];
        else if (perf.wickets === 3) pts += FANTASY_RULES.BOWLING.BONUS["3w"];

        const eco = perf.economy;
        if (perf.overs >= 2) {
            if (eco < 5) pts += FANTASY_RULES.BOWLING.ECONOMY.lt5;
            else if (eco < 6) pts += FANTASY_RULES.BOWLING.ECONOMY["5to6"];
            else if (eco < 7) pts += FANTASY_RULES.BOWLING.ECONOMY["6to7"];
            else if (eco > 12) pts += FANTASY_RULES.BOWLING.ECONOMY.gt12;
            else if (eco > 11) pts += FANTASY_RULES.BOWLING.ECONOMY["11to12"];
            else if (eco > 10) pts += FANTASY_RULES.BOWLING.ECONOMY["10to11"];
        }

        // FIELDING
        pts += perf.catches * FANTASY_RULES.FIELDING.CATCH;
        if (perf.catches >= 3) pts += FANTASY_RULES.FIELDING.CATCH_3_BONUS;
        pts += perf.stumpings * FANTASY_RULES.FIELDING.STUMPING;
        pts += perf.runouts * FANTASY_RULES.FIELDING.RUNOUT;

        return Math.round(pts * 10) / 10;
    };

    analyzeMatch = () => {
        const { roomData } = this.state;
        if (!roomData || !roomData.teams) return;

        this.setState({ simulating: true });

        // Simulate Match Progress
        setTimeout(() => {
            const teamScores = roomData.teams.map(team => {
                const sel = roomData.selections?.[team.id] || { xi: [], impact: [] };
                const xiPlayers = (team.players || []).filter(p => sel.xi.includes(p.id));
                const impactPlayer = (team.players || []).find(p => sel.impact.includes(p.id));
                
                let totalFantasyPoints = 0;
                let batsmen = 0, bowlers = 0, allrounders = 0, wk = 0;
                let battingPower = 0, bowlingPower = 0;
                let playerPerformances = [];

                xiPlayers.forEach(p => {
                    const isImpact = impactPlayer && p.id === impactPlayer.id;
                    const perf = this.simulatePerformance(p);
                    let pts = this.calcFantasyPoints(perf, p.role);
                    if (isImpact) pts *= 1.5; // Huge bonus for being the Impact choice

                    totalFantasyPoints += pts;
                    playerPerformances.push({ ...p, matchPoints: pts, perf });

                    if (p.role === 'Batsman') { batsmen++; battingPower += p.rating; }
                    else if (p.role === 'Bowler') { bowlers++; bowlingPower += p.rating; }
                    else if (p.role === 'All-rounder') { allrounders++; battingPower += p.rating * 0.5; bowlingPower += p.rating * 0.5; }
                    else if (p.role === 'Wicketkeeper') { wk++; battingPower += p.rating; }
                });

                let strengths = [], weaknesses = [];
                if (battingPower > 250) strengths.push('Elite Batting Aggression');
                if (bowlingPower > 250) strengths.push('Clinical Bowling Attack');
                if (allrounders >= 3) strengths.push('Unmatchable Versatility');
                if (totalFantasyPoints > 400) strengths.push('Phenomenal Match Synergy');
                if (battingPower < 200) weaknesses.push('Struggling Batting Depth');
                if (bowlingPower < 200) weaknesses.push('Leaky Bowling Options');

                return {
                    team,
                    totalFantasyPoints: Math.round(totalFantasyPoints),
                    batsmen, bowlers, allrounders, wk,
                    impactPlayer,
                    playerPerformances,
                    strengths, weaknesses
                };
            });

            const sorted = [...teamScores].sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints);
            const winner = sorted[0];
            const mvp = teamScores.flatMap(ts => ts.playerPerformances).reduce((max, p) => p.matchPoints > (max?.matchPoints || 0) ? p : max, null);

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
                simulating: false,
                matchPrediction: {
                    teamScores, 
                    winner: winner.team,
                    mvp,
                    highlights: { highestPaid, stealPlayer, biggestSpender },
                }
            });

            this.saveMatchHistory(teamScores, winner.team);
        }, 3000); // 3 second suspense simulation
    };


    saveMatchHistory = async (teamScores, winningTeam) => {
        if (!auth.currentUser) return;
        
        const myTeamScore = teamScores.find(ts => ts.team.id === this.props.myTeamId);
        const opponentScore = teamScores.find(ts => ts.team.id !== this.props.myTeamId);
        const mySelection = this.state.roomData.selections[this.props.myTeamId] || this.state.mySelection;

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
                        <div className="prediction-card overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-left">
                                    <div className="text-[10px] text-accent font-bold tracking-[0.2em] mb-1">MATCH RESULTS</div>
                                    <h2 className="gradient-text text-3xl font-black">FANTASY SCOREBOARD</h2>
                                </div>
                                <div className="text-right">
                                     <div className="text-[10px] text-secondary font-bold tracking-[0.2em] mb-1">VENUE</div>
                                     <div className="text-sm font-bold">APL Arena 2026</div>
                                </div>
                            </div>

                            {/* Comparison Stats */}
                            <div className="space-y-3 mb-8">
                                {matchPrediction.teamScores.map((ts, idx) => (
                                    <div key={idx} className={`glass p-4 border-l-4 ${ts.team.id === matchPrediction.winner.id ? 'border-success' : 'border-danger'} flex justify-between items-center`}>
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-black text-secondary">#{idx + 1}</div>
                                            <div>
                                                <div className="font-black text-lg uppercase tracking-tight">{ts.team.name}</div>
                                                <div className="text-xs text-secondary">{ts.batsmen}B / {ts.bowlers}BW / {ts.allrounders}AR</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Total Points</div>
                                            <div className={`text-2xl font-black ${ts.team.id === matchPrediction.winner.id ? 'text-success' : 'text-white'}`}>{ts.totalFantasyPoints}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MVP & Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="glass p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                                    <h3 className="text-accent text-xs font-black tracking-widest uppercase mb-4 flex items-center gap-2">
                                        ⭐ MATCH MVP
                                    </h3>
                                    {matchPrediction.mvp && (
                                        <div className="flex items-center gap-4">
                                            <img src={matchPrediction.mvp.image} className="w-16 h-16 rounded-full border-2 border-accent object-cover" alt="" />
                                            <div>
                                                <div className="font-black text-lg leading-tight">{matchPrediction.mvp.name}</div>
                                                <div className="text-xs text-secondary mb-2">{matchPrediction.mvp.role}</div>
                                                <div className="text-xl font-black text-success">{matchPrediction.mvp.matchPoints} <span className="text-[10px] text-secondary">PTS</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="glass p-6 bg-gradient-to-br from-success/10 to-transparent border-white/5">
                                    <h3 className="text-secondary text-xs font-black tracking-widest uppercase mb-4 flex items-center gap-2">
                                        🔥 AUCTION HIGHLIGHTS
                                    </h3>
                                    <div className="space-y-4">
                                        {matchPrediction.highlights.stealPlayer && (
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-secondary">Steal of Auction</div>
                                                <div className="font-bold text-success">{matchPrediction.highlights.stealPlayer.name} ({matchPrediction.highlights.stealPlayer.soldPrice} Cr)</div>
                                            </div>
                                        )}
                                        {matchPrediction.highlights.highestPaid && (
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-secondary">Highest Paid</div>
                                                <div className="font-bold text-accent">{matchPrediction.highlights.highestPaid.name} ({matchPrediction.highlights.highestPaid.soldPrice} Cr)</div>
                                            </div>
                                        )}
                                        {matchPrediction.highlights.biggestSpender && (
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-secondary">Biggest Spender</div>
                                                <div className="font-bold">{matchPrediction.highlights.biggestSpender.name}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Winner Reveal */}
                            <div className="text-center p-8 glass bg-success/5 border-success/20 rounded-2xl mb-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-success animate-pulse"></div>
                                <div className="text-[10px] text-success font-black tracking-[0.4em] mb-2 uppercase">Champions of the Arena</div>
                                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">{matchPrediction.winner.name}</h1>
                                <div className="text-sm text-secondary italic">Victory determined by superior fantasy scoring and player performance.</div>
                            </div>

                            <div className="text-center mt-6">
                                <button className="btn btn-outline px-10 py-3 w-full" onClick={() => this.setState({ matchPrediction: null })}>
                                    Back to Leaderboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simulation Suspense Overlay */}
                {this.state.simulating && (
                    <div className="prediction-overlay">
                        <div className="glass p-12 text-center max-w-lg w-full border-t-4 border-accent animate-pulse">
                            <div className="text-6xl mb-6">🏏</div>
                            <h2 className="gradient-text text-3xl font-black mb-4 tracking-widest">SIMULATING MATCH...</h2>
                            <p className="text-secondary mb-8">Calculating fantasy points based on player ratings and roles.</p>
                            <div className="w-full bg-dark h-2 rounded-full overflow-hidden mb-2">
                                <div className="bg-accent h-full animate-loading-bar"></div>
                            </div>
                            <div className="text-[10px] text-accent tracking-[0.3em] font-bold">ANALYZING POWER-PLAYS & IMPACT SUBS</div>
                        </div>
                    </div>
                )}

                {/* Predict Button */}
                {allTeamsReady && !matchPrediction && !this.state.simulating && (
                    <div className="text-center mb-12 animate-fade-in">
                        <button className="btn btn-primary px-10 py-4 text-lg" onClick={this.analyzeMatch}>
                             START MATCH SIMULATION
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
