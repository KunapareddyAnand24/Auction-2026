import React, { Component } from 'react';

class ResultsPage extends Component {
    state = {
        // Track selections per team: { teamId: { xi: [playerId, ...], impact: [playerId, ...] } }
        teamSelections: {},
        currentSelectingTeamId: null,
        selectionMode: 'xi', // 'xi' or 'impact'
        matchPrediction: null,
        allTeamsReady: false,
    };

    componentDidMount() {
        // Auto set first team as current
        const { teams } = this.props;
        if (teams && teams.length > 0) {
            const initial = {};
            teams.forEach(t => { initial[t.id] = { xi: [], impact: [] }; });
            this.setState({ teamSelections: initial, currentSelectingTeamId: teams[0].id });
        }
    }

    togglePlayer = (teamId, playerId) => {
        const { selectionMode, teamSelections } = this.state;
        const sel = teamSelections[teamId] || { xi: [], impact: [] };

        if (selectionMode === 'xi') {
            if (sel.xi.includes(playerId)) {
                // Remove from XI
                const updated = { ...sel, xi: sel.xi.filter(id => id !== playerId) };
                // Also remove from impact if was there
                updated.impact = updated.impact.filter(id => id !== playerId);
                this.setState({ teamSelections: { ...teamSelections, [teamId]: updated } });
            } else {
                if (sel.xi.length >= 11) {
                    alert("You can only select 11 players for Playing XI!");
                    return;
                }
                this.setState({ teamSelections: { ...teamSelections, [teamId]: { ...sel, xi: [...sel.xi, playerId] } } });
            }
        } else {
            // Impact player mode — must be in XI first
            if (!sel.xi.includes(playerId)) {
                alert("Player must be in Playing XI first!");
                return;
            }
            if (sel.impact.includes(playerId)) {
                this.setState({ teamSelections: { ...teamSelections, [teamId]: { ...sel, impact: sel.impact.filter(id => id !== playerId) } } });
            } else {
                if (sel.impact.length >= 1) {
                    alert("You can only select 1 Impact Player!");
                    return;
                }
                this.setState({ teamSelections: { ...teamSelections, [teamId]: { ...sel, impact: [...sel.impact, playerId] } } });
            }
        }
    };

    confirmTeamSelection = (teamId) => {
        const { teams } = this.props;
        const { teamSelections } = this.state;
        const sel = teamSelections[teamId];

        if (!sel || sel.xi.length !== 11) {
            alert("Please select exactly 11 players for Playing XI!");
            return;
        }
        if (sel.impact.length !== 1) {
            alert("Please select exactly 1 Impact Player!");
            return;
        }

        // Move to next team
        const currentIndex = teams.findIndex(t => t.id === teamId);
        if (currentIndex < teams.length - 1) {
            this.setState({
                currentSelectingTeamId: teams[currentIndex + 1].id,
                selectionMode: 'xi',
            });
        } else {
            // All teams done
            this.setState({ allTeamsReady: true });
        }
    };

    analyzeMatch = () => {
        const { teams } = this.props;
        const { teamSelections } = this.state;

        if (teams.length < 2) return;

        const teamScores = teams.map(team => {
            const sel = teamSelections[team.id] || { xi: [], impact: [] };
            const xiPlayers = (team.players || []).filter(p => sel.xi.includes(p.id));
            const impactPlayer = (team.players || []).find(p => sel.impact.includes(p.id));

            let totalRating = 0, battingPower = 0, bowlingPower = 0, allRoundDepth = 0;
            let batsmen = 0, bowlers = 0, allrounders = 0, wk = 0;
            let totalSpend = 0, avgStrikeRate = 0, avgEconomy = 0;
            let srCount = 0, ecoCount = 0;

            xiPlayers.forEach(p => {
                totalRating += p.rating;
                totalSpend += (p.soldPrice || p.basePrice);

                if (p.role === 'Batsman') { batsmen++; battingPower += p.rating; }
                else if (p.role === 'Bowler') { bowlers++; bowlingPower += p.rating; }
                else if (p.role === 'All-rounder') { allrounders++; allRoundDepth += p.rating; battingPower += p.rating * 0.5; bowlingPower += p.rating * 0.5; }
                else if (p.role === 'Wicketkeeper') { wk++; battingPower += p.rating; }

                if (p.stats) {
                    if (p.stats.strikeRate && p.role !== 'Bowler') { avgStrikeRate += p.stats.strikeRate; srCount++; }
                    if (p.stats.economy && p.role !== 'Batsman' && p.role !== 'Wicketkeeper') { avgEconomy += p.stats.economy; ecoCount++; }
                }
            });

            // Impact player bonus
            let impactBonus = 0;
            if (impactPlayer) {
                impactBonus = impactPlayer.rating * 0.15;
                totalRating += impactBonus;
            }

            const avgRating = xiPlayers.length > 0 ? totalRating / xiPlayers.length : 0;
            avgStrikeRate = srCount > 0 ? avgStrikeRate / srCount : 0;
            avgEconomy = ecoCount > 0 ? avgEconomy / ecoCount : 99;

            // Balance score
            let balanceScore = 0;
            if (wk >= 1) balanceScore += 10;
            if (batsmen >= 3 && batsmen <= 5) balanceScore += 15;
            if (bowlers >= 3 && bowlers <= 5) balanceScore += 15;
            if (allrounders >= 2) balanceScore += 15;
            if (bowlers + allrounders >= 5) balanceScore += 10;

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
                batsmen, bowlers, allrounders, wk,
                impactPlayer,
                impactBonus: impactBonus.toFixed(1),
                // Overall strength (weighted)
                overallStrength: (
                    avgRating * 3 +
                    battingPower * 0.5 +
                    bowlingPower * 0.5 +
                    allRoundDepth * 0.3 +
                    balanceScore * 1.5 +
                    avgStrikeRate * 0.3 +
                    (10 - Math.min(10, avgEconomy)) * 10 +
                    impactBonus * 5
                ),
            };
        });

        // Determine winner
        const sorted = [...teamScores].sort((a, b) => b.overallStrength - a.overallStrength);
        const winner = sorted[0];
        const totalStrength = teamScores.reduce((s, t) => s + t.overallStrength, 0);

        this.setState({
            matchPrediction: {
                teamScores,
                winner: winner.team,
                winChance: totalStrength > 0 ? ((winner.overallStrength / totalStrength) * 100).toFixed(1) : 50,
            }
        });
    };

    render() {
        const { teams } = this.props;
        const { teamSelections, currentSelectingTeamId, selectionMode, matchPrediction, allTeamsReady } = this.state;

        return (
            <div className="container pb-20 animate-fade-in">
                <h1 className="gradient-text text-center mb-4 text-5xl font-black tracking-tight">AUCTION RESULTS</h1>
                <p className="text-center text-secondary mb-12 text-lg">
                    {allTeamsReady
                        ? 'All teams are ready! Click "Predict Match Winner" to see the AI analysis.'
                        : 'Select Playing XI (11 players) + Impact Player (1 player) for each team.'}
                </p>

                {/* Match Prediction Overlay */}
                {matchPrediction && (
                    <div className="prediction-overlay" onClick={() => this.setState({ matchPrediction: null })}>
                        <div className="prediction-card" onClick={e => e.stopPropagation()}>
                            <h2 className="gradient-text text-3xl font-black text-center mb-6">🤖 AI MATCH PREDICTION</h2>

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
                                { label: 'Impact Bonus', key: 'impactBonus' },
                                { label: 'Total Spend (Cr)', key: 'totalSpend' },
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

                            {/* Winner */}
                            <div className={`prediction-winner ${matchPrediction.winner.id === teams[0]?.id ? 'prediction-winner--team1' : 'prediction-winner--team2'}`}>
                                <div className="prediction-winner-label">🏆 Predicted Winner</div>
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
                            🤖 Predict Match Winner
                        </button>
                    </div>
                )}

                {/* Team Cards */}
                <div className="grid grid-cols-auto-fill gap-8">
                    {teams.map(team => {
                        const sel = teamSelections[team.id] || { xi: [], impact: [] };
                        const isCurrentTeam = team.id === currentSelectingTeamId && !allTeamsReady;
                        const isLocked = allTeamsReady || (currentSelectingTeamId !== team.id);

                        return (
                            <div key={team.id} className={`glass p-8 ${isCurrentTeam ? 'border-accent' : ''}`} style={isCurrentTeam ? { borderWidth: '2px' } : {}}>
                                <div className="flex justify-between items-center mb-4 border-b-2 border-accent pb-4">
                                    <h2 className="text-2xl font-bold text-accent">
                                        {team.name}
                                        {isCurrentTeam && <span className="text-sm bg-accent text-dark px-2 py-1 rounded ml-2 align-middle">SELECTING</span>}
                                        {isLocked && sel.xi.length === 11 && <span className="text-sm bg-success text-dark px-2 py-1 rounded ml-2 align-middle">✓ READY</span>}
                                    </h2>
                                    <div className="text-right">
                                        <div className="text-xs text-secondary font-bold tracking-widest uppercase mb-1">PURSE</div>
                                        <div className="font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm text-secondary">Cr</span></div>
                                    </div>
                                </div>

                                {/* Selection Controls */}
                                {isCurrentTeam && (
                                    <div className="mb-6 animate-fade-in">
                                        <div className="xi-selection-header">
                                            <div>
                                                <div className="flex gap-3 mb-2">
                                                    <button
                                                        className={`btn text-xs py-2 px-4 ${selectionMode === 'xi' ? 'btn-primary' : 'btn-outline'}`}
                                                        onClick={() => this.setState({ selectionMode: 'xi' })}
                                                    >Playing XI ({sel.xi.length}/11)</button>
                                                    <button
                                                        className={`btn text-xs py-2 px-4 ${selectionMode === 'impact' ? 'btn-primary' : 'btn-outline'}`}
                                                        onClick={() => this.setState({ selectionMode: 'impact' })}
                                                    >Impact Player ({sel.impact.length}/1)</button>
                                                </div>
                                            </div>
                                            <div className={`xi-counter ${sel.xi.length === 11 && sel.impact.length === 1 ? 'xi-counter--complete' : ''}`}>
                                                {sel.xi.length === 11 && sel.impact.length === 1 ? '✅ Ready' : `${sel.xi.length}/11`}
                                            </div>
                                        </div>

                                        {sel.xi.length === 11 && sel.impact.length === 1 && (
                                            <button className="btn btn-primary w-full py-3 animate-fade-in" onClick={() => this.confirmTeamSelection(team.id)}>
                                                Confirm {team.name}'s Selection →
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
                                                        onClick={() => !isLocked && this.togglePlayer(team.id, p.id)}
                                                        style={isLocked ? { cursor: 'default' } : {}}
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
