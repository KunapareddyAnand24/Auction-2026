import React, { Component } from 'react';
import playersData from '../data/playersData';

const AI_TEAM_NAMES = ['Mumbai Indians', 'Delhi Capitals', 'Kolkata Knight Riders', 'Rajasthan Royals', 'Gujarat Titans', 'Lucknow Super Giants', 'Punjab Kings', 'Sunrisers Hyderabad'];

class ComputerAuction extends Component {
  constructor(props) {
    super(props);

    const aiTeamName = AI_TEAM_NAMES[Math.floor(Math.random() * AI_TEAM_NAMES.length)];
    const pool = playersData.slice(0, 50); // 1v1 = 50 players

    this.state = {
      userTeam: { id: 1, name: props.userName || 'My Team', purse: 100, players: [] },
      aiTeam: { id: 2, name: aiTeamName, purse: 100, players: [] },
      players: pool,
      soldPlayerNames: [],
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidderId: null,
      highestBidderName: null,
      status: 'waiting', // waiting, active, finished
      timer: 15,
      aiThinking: false,
      bidHistory: [],
      bidPopup: null,
      soldCelebration: null,
      isProcessingSold: false,
    };
    this.timerInterval = null;
    this.aiTimeout = null;
  }

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    clearTimeout(this.aiTimeout);
  }

  // Check if a team can no longer bid (full squad or insufficient purse)
  isTeamInactive = (team, minBidPrice) => {
    const playerCount = team.players ? team.players.length : 0;
    if (playerCount >= 18) return true;
    if (team.purse < minBidPrice) return true;
    return false;
  };

  getNextPlayerIndex = () => {
    const { players, soldPlayerNames } = this.state;
    const available = players
      .map((p, i) => ({ ...p, originalIndex: i }))
      .filter(p => !soldPlayerNames.includes(p.name));

    if (available.length === 0) return -1;
    const pick = available[Math.floor(Math.random() * available.length)];
    return pick.originalIndex;
  };

  startNextAuction = () => {
    const { userTeam, aiTeam, players } = this.state;

    // Check if both teams are inactive
    const minBasePrice = Math.min(...players.map(p => p.basePrice));
    const userInactive = this.isTeamInactive(userTeam, minBasePrice);
    const aiInactive = this.isTeamInactive(aiTeam, minBasePrice);
    if (userInactive && aiInactive) {
      this.setState({ status: 'finished' });
      return;
    }

    const nextIndex = this.getNextPlayerIndex();
    if (nextIndex === -1) {
      this.setState({ status: 'finished' });
      return;
    }

    const player = players[nextIndex];
    this.setState({
      currentPlayerIndex: nextIndex,
      currentBid: player.basePrice,
      highestBidderId: null,
      highestBidderName: null,
      status: 'active',
      timer: 15,
      aiThinking: false,
      bidHistory: [],
      isProcessingSold: false,
    }, () => {
      this.startTimer();
      this.scheduleAiBid();
    });
  };

  startTimer = () => {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.setState(prev => {
        const newTimer = prev.timer - 1;
        if (newTimer <= 0) {
          clearInterval(this.timerInterval);
          clearTimeout(this.aiTimeout);
          // Auto-trigger sold after 2s delay
          if (!prev.isProcessingSold) {
            setTimeout(() => this.handleSold(), 2000);
            return { timer: 0, isProcessingSold: true };
          }
          return { timer: 0 };
        }
        return { timer: newTimer };
      });
    }, 1000);
  };

  scheduleAiBid = () => {
    clearTimeout(this.aiTimeout);
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds random delay
    this.aiTimeout = setTimeout(() => this.aiDecideBid(), delay);
  };

  aiDecideBid = () => {
    const { aiTeam, currentBid, highestBidderId, timer, status, players, currentPlayerIndex } = this.state;
    if (status !== 'active' || timer <= 0) return;
    if (highestBidderId === aiTeam.id) {
      // AI already leading, wait
      return;
    }

    const player = players[currentPlayerIndex];
    const increment = 1;
    const newBid = highestBidderId ? currentBid + increment : currentBid;

    // AI decision logic
    const aiPlayersCount = aiTeam.players ? aiTeam.players.length : 0;
    if (aiPlayersCount >= 18) return;
    if (aiTeam.purse < newBid) return;

    // Rating-based aggression: higher rated = more likely to bid
    const bidChance = Math.min(0.95, (player.rating - 60) / 40 + 0.2);
    // Budget conservation: less likely to bid high
    const budgetFactor = aiTeam.purse > 30 ? 1 : (aiTeam.purse > 15 ? 0.6 : 0.3);
    // Price ceiling: won't overpay
    const maxWillingPrice = Math.ceil(player.basePrice * (player.rating / 50));

    if (newBid > maxWillingPrice) return;
    if (Math.random() > bidChance * budgetFactor) {
      // AI passes this round, maybe try again
      if (timer > 3) {
        this.scheduleAiBid();
      }
      return;
    }

    this.setState({ aiThinking: true });
    setTimeout(() => {
      // Double-check still active
      if (this.state.status !== 'active' || this.state.timer <= 0) return;

      const historyEntry = {
        teamName: aiTeam.name,
        amount: newBid,
        time: new Date().toLocaleTimeString(),
      };

      this.setState(prev => ({
        currentBid: newBid,
        highestBidderId: aiTeam.id,
        highestBidderName: aiTeam.name,
        aiThinking: false,
        bidHistory: [historyEntry, ...prev.bidHistory],
        bidPopup: { type: 'ai', text: `${aiTeam.name} bids ${newBid} Cr!` },
        // Extend timer if low
        timer: prev.timer <= 5 ? prev.timer + 5 : prev.timer,
      }));

      // Clear popup
      setTimeout(() => this.setState({ bidPopup: null }), 1500);

      // Maybe bid again later
      if (this.state.timer > 3) {
        this.scheduleAiBid();
      }
    }, 800);
  };

  handleUserBid = () => {
    const { userTeam, currentBid, highestBidderId, timer, status } = this.state;
    if (status !== 'active' || timer <= 0) return;
    if (highestBidderId === userTeam.id) return; // Already leading

    const increment = 1;
    const newBid = highestBidderId ? currentBid + increment : currentBid;

    // Check if team is inactive (purse exhausted or squad full)
    if (this.isTeamInactive(userTeam, newBid)) {
      if (userTeam.players && userTeam.players.length >= 18) {
        alert("Your squad is full (18 players)!");
      } else {
        alert("You don't have enough purse!");
      }
      return;
    }

    const historyEntry = {
      teamName: userTeam.name,
      amount: newBid,
      time: new Date().toLocaleTimeString(),
    };

    this.setState(prev => ({
      currentBid: newBid,
      highestBidderId: userTeam.id,
      highestBidderName: userTeam.name,
      bidHistory: [historyEntry, ...prev.bidHistory],
      bidPopup: { type: 'user', text: `You bid ${newBid} Cr!` },
      // Extend timer if low
      timer: prev.timer <= 5 ? prev.timer + 5 : prev.timer,
    }));

    setTimeout(() => this.setState({ bidPopup: null }), 1500);

    // AI responds after user bid
    clearTimeout(this.aiTimeout);
    this.scheduleAiBid();
  };

  handleSold = () => {
    const { highestBidderId, currentBid, players, currentPlayerIndex, soldPlayerNames } = this.state;
    const player = players[currentPlayerIndex];

    clearInterval(this.timerInterval);
    clearTimeout(this.aiTimeout);

    if (highestBidderId) {
      const teamKey = highestBidderId === 1 ? 'userTeam' : 'aiTeam';
      this.setState(prev => {
        const team = prev[teamKey];
        return {
          [teamKey]: {
            ...team,
            purse: team.purse - currentBid,
            players: [...(team.players || []), { ...player, soldPrice: currentBid }],
          },
          soldPlayerNames: [...prev.soldPlayerNames, player.name],
          status: 'waiting',
          soldCelebration: {
            playerName: player.name,
            teamName: team.name,
            price: currentBid,
            role: player.role,
            rating: player.rating,
          },
        };
      }, () => {
        // Auto-dismiss celebration after 3 seconds and start next
        setTimeout(() => {
          this.setState({ soldCelebration: null });
          this.startNextAuction();
        }, 3000);
      });
    } else {
      // Unsold
      this.setState(prev => ({
        soldPlayerNames: [...prev.soldPlayerNames, player.name],
        status: 'waiting',
      }), () => {
        setTimeout(() => this.startNextAuction(), 1000);
      });
    }
  };

  render() {
    const {
      userTeam, aiTeam, players, currentPlayerIndex, currentBid,
      highestBidderId, highestBidderName, status, timer,
      aiThinking, bidHistory, bidPopup, soldCelebration,
    } = this.state;

    if (status === 'finished') {
      const teams = [userTeam, aiTeam];
      return (
        <div className="container text-center animate-fade-in" style={{ paddingTop: '5rem' }}>
          <h2 className="gradient-text text-5xl mb-8 font-black">Auction Concluded!</h2>
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto mb-12">
            {teams.map(team => (
              <div key={team.id} className="glass p-6">
                <h3 className="text-accent font-bold text-xl mb-2">{team.name}</h3>
                <div className="text-2xl font-black mb-2">{team.purse.toFixed(1)} <span className="text-sm text-secondary">Cr left</span></div>
                <div className="text-sm text-secondary">{team.players ? team.players.length : 0} players</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary px-10 py-4 text-lg" onClick={() => this.props.setView('results')}>
            View Final Squads
          </button>
        </div>
      );
    }

    const player = players[currentPlayerIndex];
    const teams = [userTeam, aiTeam];
    const isUserLeading = highestBidderId === userTeam.id;

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

        {/* Bid Popup */}
        {bidPopup && (
          <div className={`bid-popup ${bidPopup.type === 'ai' ? 'bid-popup--ai' : 'bid-popup--user'}`}>
            {bidPopup.text}
          </div>
        )}

        {/* Left: Player Card */}
        <div className="glass p-6 flex flex-col gap-4 mobile-order-2">
          <div className="player-image-container">
            <img src={player.image} alt={player.name} />
            <div className="player-rating-badge">{player.rating}</div>
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

        </div>

        {/* Center: Bid Control */}
        <div className="flex flex-col gap-6 mobile-order-1">
          {/* Timer */}
          <div className={`glass text-center p-6 relative ${status === 'active' ? 'border-accent' : ''}`}>
            <div className="text-lg text-secondary font-bold tracking-widest uppercase mb-2">
              {status === 'active' ? 'TIME REMAINING' : 'AUCTION STATUS'}
            </div>
            <div className={`text-6xl font-black ${timer <= 5 && status === 'active' ? 'text-danger' : 'text-accent'} ${timer <= 5 && timer > 0 && status === 'active' ? 'animate-pulse' : ''}`}>
              {status === 'active' ? `${timer}s` : status.toUpperCase()}
            </div>

            {/* AI Thinking indicator */}
            {aiThinking && status === 'active' && (
              <div className="ai-thinking mt-3">
                🤖 AI is thinking
                <span className="ai-thinking-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            )}

            {timer === 0 && status === 'active' && (
              <div className="absolute inset-0 rounded-lg flex items-center justify-center z-10 animate-fade-in" style={{ background: 'rgba(5,5,8,0.95)' }}>
                <div className="text-2xl font-black text-accent tracking-wider animate-pulse">
                  {this.state.isProcessingSold ? 'PROCESSING...' : 'TIME UP!'}
                </div>
              </div>
            )}
          </div>

          {/* Current Bid */}
          <div className="glass text-center p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-60"></div>
            <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
            <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
              {currentBid || player.basePrice} <span className="text-3xl text-secondary">Cr</span>
            </div>
            {highestBidderName && (
              <div className="mt-4 text-success font-bold text-xl tracking-wide bg-success-light inline-block mx-auto px-6 py-2 rounded-full border border-success">
                BID BY: {highestBidderName}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              {(() => {
                const currentBidPrice = currentBid || players[currentPlayerIndex].basePrice;
                const userInactive = this.isTeamInactive(userTeam, currentBidPrice);
                const isSquadFull = userTeam.players && userTeam.players.length >= 18;
                return (
                  <button
                    className={`btn px-8 py-4 text-lg font-bold min-w-[280px] ${isUserLeading ? 'btn-outline opacity-60' : userInactive ? 'btn-outline opacity-60' : 'btn-primary'}`}
                    onClick={this.handleUserBid}
                    disabled={status !== 'active' || timer === 0 || isUserLeading || userInactive}
                  >
                    {isSquadFull
                      ? 'SQUAD FULL (MAX 18)'
                      : userInactive
                        ? 'PURSE EXHAUSTED'
                        : isUserLeading
                          ? `${userTeam.name.toUpperCase()} — LEADING`
                          : `BID FOR ${userTeam.name.toUpperCase()} (+1 Cr)`}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Bid History */}
          <div className="glass max-h-[180px] p-4 flex flex-col scrollable-panel">
            <h4 className="mb-3 text-sm tracking-widest text-accent font-bold uppercase border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>LIVE BID HISTORY</h4>
            <div className="flex-1 overflow-y-auto pr-2">
              {bidHistory.length === 0 ? (
                <div className="text-secondary text-center mt-4 italic">Awaiting first bid...</div>
              ) : (
                bidHistory.map((bid, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm px-2 rounded transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span><span className="text-accent font-bold">{bid.teamName}</span> placed bid for <span className="font-bold">{bid.amount} Cr</span></span>
                    <span className="text-secondary text-xs mt-1">{bid.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Teams */}
        <div className="glass p-6 scrollable-panel mobile-order-3">
          <h3 className="mb-6 text-center text-accent tracking-widest font-bold text-lg">TEAMS PURSE</h3>
          <div className="flex flex-col gap-4">
            {teams.map(team => {
              const minBasePrice = Math.min(...players.map(p => p.basePrice));
              const inactive = this.isTeamInactive(team, minBasePrice);
              return (
                <div key={team.id} className={`bg-panel p-4 rounded-lg border transition-all ${inactive ? 'border-danger border-opacity-30 opacity-60' : ''}`} style={!inactive ? { border: '1px solid rgba(255,255,255,0.05)' } : {}}>
                  <div className="flex justify-between mb-2 items-center">
                    <span className="font-bold text-lg">
                      {team.name} {team.id === 2 && <span className="text-xs text-success">🤖 AI</span>}
                      {inactive && <span className="text-xs bg-danger text-white px-2 py-1 rounded ml-2 align-middle">RESTING</span>}
                    </span>
                    <span className="text-accent font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm">Cr</span></span>
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${team.players && team.players.length >= 18 ? 'text-danger' : 'text-secondary'}`}>
                    Squad: {team.players ? team.players.length : 0} / 18
                  </div>
                  {team.players && team.players.length > 0 && (
                    <div className="border-t pt-3 flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      {team.players.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs items-center p-1 rounded">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-accent font-bold bg-dark px-2 py-1 rounded">{p.soldPrice} Cr</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default ComputerAuction;
