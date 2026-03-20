import React, { Component } from 'react';
import playersData from '../data/playersData';

const AI_TEAM_NAMES = ['Mumbai Indians', 'Delhi Capitals', 'Kolkata Knight Riders', 'Rajasthan Royals', 'Gujarat Titans', 'Lucknow Super Giants', 'Punjab Kings', 'Sunrisers Hyderabad'];

class ComputerAuction extends Component {
  constructor(props) {
    super(props);

    const aiTeamName = AI_TEAM_NAMES[Math.floor(Math.random() * AI_TEAM_NAMES.length)];
    
    // Shuffle and pick 50 players for 1v1
    const shuffled = [...playersData].sort(() => Math.random() - 0.5);
    const pool = shuffled.slice(0, 50); 

    this.state = {
      userTeam: { id: 1, name: props.userName || 'My Team', purse: 100, players: [] },
      aiTeam: { id: 2, name: aiTeamName, purse: 100, players: [] },
      players: pool,
      soldPlayerNames: [],
      unsoldPlayerNames: [],
      unsoldPlayersPool: [], // { name, basePrice, role, rating }
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
      unsoldCelebration: null,
      isProcessingSold: false,
      auctionRound: 'main', // 'main' or 're-auction'
      reAuctionDone: false,
      effectiveBasePrice: 0,
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
    const { players, soldPlayerNames, unsoldPlayerNames } = this.state;
    const available = players
      .map((p, i) => ({ ...p, originalIndex: i }))
      .filter(p => !soldPlayerNames.includes(p.name) && !unsoldPlayerNames.includes(p.name));

    if (available.length === 0) return -1;
    const pick = available[Math.floor(Math.random() * available.length)];
    return pick.originalIndex;
  };

  startNextAuction = () => {
    const { userTeam, aiTeam, players, unsoldPlayersPool, auctionRound, reAuctionDone } = this.state;

    const isReAuction = auctionRound === 're-auction';

    // Check if both teams are inactive
    const minBasePrice = isReAuction
      ? (unsoldPlayersPool.length > 0 ? Math.min(...unsoldPlayersPool.map(p => Math.max(0.5, Math.floor(p.basePrice * 0.5 * 10) / 10))) : 0.5)
      : Math.min(...players.map(p => p.basePrice));
    const userInactive = this.isTeamInactive(userTeam, minBasePrice);
    const aiInactive = this.isTeamInactive(aiTeam, minBasePrice);
    if (userInactive && aiInactive) {
      this.setState({ status: 'finished' });
      return;
    }

    if (isReAuction) {
      // RE-AUCTION MODE
      if (unsoldPlayersPool.length === 0) {
        this.setState({ status: 'finished', reAuctionDone: true });
        return;
      }

      const pickIdx = Math.floor(Math.random() * unsoldPlayersPool.length);
      const unsoldPlayer = unsoldPlayersPool[pickIdx];
      const reAuctionBasePrice = Math.max(0.5, Math.floor(unsoldPlayer.basePrice * 0.5 * 10) / 10);
      const originalIndex = players.findIndex(p => p.name === unsoldPlayer.name);
      const updatedPool = unsoldPlayersPool.filter((_, i) => i !== pickIdx);

      this.setState({
        currentPlayerIndex: originalIndex,
        currentBid: reAuctionBasePrice,
        effectiveBasePrice: reAuctionBasePrice,
        highestBidderId: null,
        highestBidderName: null,
        status: 'active',
        timer: 15,
        aiThinking: false,
        bidHistory: [],
        isProcessingSold: false,
        unsoldPlayersPool: updatedPool,
      }, () => {
        this.startTimer();
        this.scheduleAiBid();
      });
      return;
    }

    // MAIN AUCTION MODE
    const nextIndex = this.getNextPlayerIndex();
    if (nextIndex === -1) {
      // Main auction exhausted — check for unsold players
      if (unsoldPlayersPool.length > 0 && !reAuctionDone) {
        this.setState({ auctionRound: 're-auction' }, () => {
          this.startNextAuction();
        });
        return;
      }
      this.setState({ status: 'finished' });
      return;
    }

    const player = players[nextIndex];
    this.setState({
      currentPlayerIndex: nextIndex,
      currentBid: player.basePrice,
      effectiveBasePrice: player.basePrice,
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
        if (prev.paused) return prev; // Don't tick if paused

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

  handleWait = () => {
    this.setState({ paused: true });
    clearTimeout(this.aiTimeout);
  };

  handleResume = () => {
    this.setState({ paused: false }, () => {
      this.scheduleAiBid();
    });
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
    const { userTeam, currentBid, highestBidderId, timer, status, paused } = this.state;
    if (status !== 'active' || timer <= 0 || paused) return;
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
      // UNSOLD — no bids
      const isReAuction = this.state.auctionRound === 're-auction';

      this.setState(prev => {
        const newState = {
          status: 'waiting',
          unsoldCelebration: {
            playerName: player.name,
            role: player.role,
            rating: player.rating,
          },
        };

        if (!isReAuction) {
          // During main auction, add to unsold pool for re-auction
          newState.unsoldPlayerNames = [...prev.unsoldPlayerNames, player.name];
          newState.unsoldPlayersPool = [...prev.unsoldPlayersPool, {
            name: player.name,
            basePrice: player.basePrice,
            role: player.role,
            rating: player.rating,
          }];
        }
        // During re-auction, permanently unsold (don't add back)

        return newState;
      }, () => {
        setTimeout(() => {
          this.setState({ unsoldCelebration: null });
          this.startNextAuction();
        }, 2500);
      });
    }
  };

  render() {
    const {
      userTeam, aiTeam, players, currentPlayerIndex, currentBid,
      highestBidderId, highestBidderName, status, timer,
      aiThinking, bidHistory, bidPopup, soldCelebration, unsoldCelebration,
      auctionRound, unsoldPlayersPool, effectiveBasePrice,
    } = this.state;

    const isReAuction = auctionRound === 're-auction';

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
        {/* Re-Auction Round Banner */}
        {isReAuction && (
          <div className="reauction-banner">
            <span className="reauction-banner-icon">🔄</span>
            RE-AUCTION ROUND — Unsold Players
          </div>
        )}
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

        {/* Unsold Overlay */}
        {unsoldCelebration && (
          <div className="unsold-overlay" onClick={() => this.setState({ unsoldCelebration: null })}>
            <div className="unsold-card">
              <span className="unsold-emoji">😔</span>
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
            Base Price: <span className="text-primary">{effectiveBasePrice || player.basePrice} Cr</span>
            {isReAuction && <span className="text-xs text-warning ml-2">(Reduced)</span>}
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

        {/* Start Control */}
        {status === 'waiting' && !soldCelebration && !this.state.isProcessingSold && (
          <div className="absolute inset-0 bg-dark bg-opacity-80 flex items-center justify-center z-50 animate-fade-in">
            <div className="glass p-12 text-center max-w-sm">
              <h2 className="text-3xl font-black text-accent mb-6 tracking-widest uppercase">Start Auction</h2>
              <p className="text-secondary mb-8">Ready to bid against the AI? Click below to reveal the next player.</p>
              <button className="btn btn-primary w-full py-4 text-xl font-bold animate-pulse shadow-lg" onClick={this.startNextAuction}>
                START AUCTION
              </button>
            </div>
          </div>
        )}

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

            {timer === 0 && status === 'active' && !this.state.paused && (
              <div className="absolute inset-0 rounded-lg flex items-center justify-center z-10 animate-fade-in" style={{ background: 'rgba(5,5,8,0.95)' }}>
                <div className="text-2xl font-black text-accent tracking-wider animate-pulse">
                  {this.state.isProcessingSold ? 'PROCESSING...' : 'TIME UP!'}
                </div>
              </div>
            )}

            {this.state.paused && (
              <div className="absolute inset-0 bg-dark bg-opacity-90 flex flex-col items-center justify-center z-20 animate-fade-in rounded-lg">
                <div className="text-warning text-2xl font-black tracking-widest mb-4">AUCTION PAUSED</div>
                <button className="btn btn-primary px-8 py-2 font-bold" onClick={this.handleResume}>
                  RESUME AUCTION
                </button>
              </div>
            )}
          </div>

          {/* Current Bid */}
          <div className="glass text-center p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-60"></div>
            <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
            <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
              {currentBid || effectiveBasePrice || player.basePrice} <span className="text-3xl text-secondary">Cr</span>
            </div>
            {highestBidderName && (
              <div className="mt-4 text-success font-bold text-xl tracking-wide bg-success-light inline-block mx-auto px-6 py-2 rounded-full border border-success">
                BID BY: {highestBidderName}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-4 items-center">
              {(() => {
                const currentBidPrice = currentBid || players[currentPlayerIndex].basePrice;
                const userInactive = this.isTeamInactive(userTeam, currentBidPrice);
                const isSquadFull = userTeam.players && userTeam.players.length >= 18;
                const isPaused = this.state.paused;

                return (
                  <>
                    <button
                      className={`btn px-8 py-5 text-xl font-black min-w-[300px] transform hover:scale-105 transition-all shadow-xl ${isUserLeading ? 'btn-outline border-2' : userInactive ? 'btn-outline opacity-60' : 'btn-primary'}`}
                      onClick={this.handleUserBid}
                      disabled={status !== 'active' || timer === 0 || isUserLeading || userInactive || isPaused}
                    >
                      {isSquadFull
                        ? 'SQUAD FULL (MAX 18)'
                        : userInactive
                          ? 'PURSE EXHAUSTED'
                          : isUserLeading
                            ? `LATEST BID: ${userTeam.name.toUpperCase()}`
                            : `BID ${currentBidPrice} Cr`}
                    </button>

                    {status === 'active' && !isPaused && (
                      <button 
                        className="btn btn-outline border-warning text-warning font-bold py-2 px-8 shadow-sm"
                        onClick={this.handleWait}
                      >
                        ⏸ WAIT
                      </button>
                    )}
                  </>
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
          <h3 className="mb-6 text-center text-accent tracking-widest font-bold text-lg flex items-center justify-center gap-3">
            TEAMS PURSE
            {unsoldPlayersPool.length > 0 && (
              <span className="unsold-badge">{unsoldPlayersPool.length} unsold</span>
            )}
          </h3>
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
