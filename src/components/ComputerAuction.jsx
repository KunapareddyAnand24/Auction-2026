import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import playersData from '../data/playersData';

const AI_TEAM_NAMES = ['Mumbai Indians', 'Delhi Capitals', 'Kolkata Knight Riders', 'Rajasthan Royals', 'Gujarat Titans', 'Lucknow Super Giants', 'Punjab Kings', 'Sunrisers Hyderabad'];

// ─── Gemini AI Call ───────────────────────────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyBybvX6YNxlzM6Br31s2Pi0wsqmnv2ILVw'; // Replace with your real key from aistudio.google.com
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function askGeminiToBid({ playerName, role, rating, stats, currentBid, aiPurse, aiSquadCount, maxBid }) {
  const prompt = `
You are an expert IPL franchise manager AI. Decide whether to bid on this player.
Player: ${playerName} (${role}) | Rating: ${rating}/100
Current Bid: ${currentBid} Cr | Your Purse: ${aiPurse} Cr | Your Squad: ${aiSquadCount}/18
Max you would pay: ${maxBid} Cr

Should you bid? Reply ONLY with a valid raw JSON object. NO markdown, NO formatting. Example:
{"bid": true, "reason": "Good value player"}
`;

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return null;
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      return JSON.parse(text);
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (e) {
    return null; // fallback to heuristic
  }
}

class ComputerAuction extends Component {
  constructor(props) {
    super(props);

    const aiTeamName = AI_TEAM_NAMES[Math.floor(Math.random() * AI_TEAM_NAMES.length)];
    
    const shuffled = [...playersData].sort(() => Math.random() - 0.5);
    const pool = shuffled.slice(0, 50); 

    this.state = {
      userTeam: { id: 1, name: props.userName || 'My Team', purse: 100, players: [] },
      aiTeam: { id: 2, name: aiTeamName, purse: 100, players: [] },
      players: pool,
      soldPlayerNames: [],
      unsoldPlayerNames: [],
      unsoldPlayersPool: [],
      currentPlayerIndex: 0,
      currentBid: 0,
      highestBidderId: null,
      highestBidderName: null,
      status: 'waiting',
      timer: 15,
      aiThinking: false,
      aiThinkingText: ' AI is thinking',
      bidHistory: [],
      bidPopup: null,
      soldCelebration: null,
      unsoldCelebration: null,
      isProcessingSold: false,
      auctionRound: 'main',
      reAuctionDone: false,
      effectiveBasePrice: 0,
      soldTimeline: [], // Global sold player timeline
      showBoughtPlayers: false,
      auctionStats: {
        highestPaidPlayer: null,
        stealPlayer: null,
      },
    };
    this.timerInterval = null;
    this.aiTimeout = null;
  }

  componentWillUnmount() {
    clearInterval(this.timerInterval);
    clearTimeout(this.aiTimeout);
  }

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

    const minBasePrice = isReAuction
      ? (unsoldPlayersPool.length > 0 ? Math.min(...unsoldPlayersPool.map(p => Math.max(0.5, Math.floor(p.basePrice * 0.5 * 10) / 10))) : 0.5)
      : Math.min(...players.map(p => p.basePrice));
    const userInactive = this.isTeamInactive(userTeam, minBasePrice);
    const aiInactive = this.isTeamInactive(aiTeam, minBasePrice);
    if (userInactive && aiInactive) {
      this.computeAuctionStats();
      this.setState({ status: 'finished' });
      return;
    }

    if (isReAuction) {
      if (unsoldPlayersPool.length === 0) {
        this.computeAuctionStats();
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

    const nextIndex = this.getNextPlayerIndex();
    if (nextIndex === -1) {
      if (unsoldPlayersPool.length > 0 && !reAuctionDone) {
        this.setState({ auctionRound: 're-auction' }, () => {
          this.startNextAuction();
        });
        return;
      }
      this.computeAuctionStats();
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
        if (prev.paused) return prev;

        const newTimer = prev.timer - 1;
        if (newTimer <= 0) {
          clearInterval(this.timerInterval);
          clearTimeout(this.aiTimeout);
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
    const delay = 2500 + Math.random() * 3000;
    this.aiTimeout = setTimeout(() => this.aiDecideBid(), delay);
  };

  aiDecideBid = () => {
    const { aiTeam, currentBid, highestBidderId, timer, status, players, currentPlayerIndex } = this.state;
    if (status !== 'active' || timer <= 0) return;
    if (highestBidderId === aiTeam.id) return;

    const player = players[currentPlayerIndex];
    const increment = 1;
    const newBid = highestBidderId ? currentBid + increment : currentBid;

    const aiPlayersCount = aiTeam.players ? aiTeam.players.length : 0;
    if (aiPlayersCount >= 18) return;
    if (aiTeam.purse < newBid) return;

    this.setState({ aiThinking: true, aiThinkingText: ' AI is calculating bid...' });

    // The AI's maximum limit for a player is based on their rating and AI's current purse.
    // Highly rated players get a bigger multiplier.
    const ratingMultiplier = player.rating >= 90 ? 2.5 : (player.rating >= 80 ? 1.5 : (player.rating >= 70 ? 1.0 : 0.6));
    let maxWillingPrice = Math.floor(player.basePrice * ratingMultiplier);

    // If AI has a lot of money and the player is top tier, it might push even higher
    if (aiTeam.purse > 50 && player.rating >= 85) {
        maxWillingPrice += 3;
    }

    let shouldBid = false;

    if (newBid > maxWillingPrice) {
      // AI won't overpay its max limit
      shouldBid = false;
    } else if (newBid <= maxWillingPrice * 0.7) {
      // AI bids 100% of the time if it's very cheap compared to its max
      shouldBid = true;
    } else {
      // AI occasionally hesitates when getting close to its limit
      shouldBid = Math.random() <= 0.8; // 80% chance to keep bidding
    }

    if (!shouldBid) {
      this.setState({ aiThinking: false });
      return; 
    }

    if (newBid > maxWillingPrice && shouldBid === null) {
      this.setState({ aiThinking: false });
      return;
    }

    setTimeout(() => {
      if (this.state.status !== 'active' || this.state.timer <= 0) {
        this.setState({ aiThinking: false });
        return;
      }

      const historyEntry = {
        teamName: aiTeam.name,
        amount: newBid,
        time: new Date().toLocaleTimeString(),
        isAI: true,
      };

      this.setState(prev => ({
        currentBid: newBid,
        highestBidderId: aiTeam.id,
        highestBidderName: aiTeam.name,
        aiThinking: false,
        bidHistory: [historyEntry, ...prev.bidHistory],
        bidPopup: { type: 'ai', text: `${aiTeam.name} bids ${newBid} Cr!` },
        timer: prev.timer <= 5 ? prev.timer + 5 : prev.timer,
      }));

      setTimeout(() => this.setState({ bidPopup: null }), 1500);

      if (this.state.timer > 3) {
        this.scheduleAiBid();
      }
    }, 600);
  };

  handleUserBid = () => {
    const { userTeam, currentBid, highestBidderId, timer, status, paused } = this.state;
    if (status !== 'active' || timer <= 0 || paused) return;
    if (highestBidderId === userTeam.id) return;

    const increment = 1;
    const newBid = highestBidderId ? currentBid + increment : currentBid;

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
      isAI: false,
    };

    this.setState(prev => ({
      currentBid: newBid,
      highestBidderId: userTeam.id,
      highestBidderName: userTeam.name,
      bidHistory: [historyEntry, ...prev.bidHistory],
      bidPopup: { type: 'user', text: `You bid ${newBid} Cr!` },
      timer: prev.timer <= 5 ? prev.timer + 5 : prev.timer,
    }));

    setTimeout(() => this.setState({ bidPopup: null }), 1500);

    clearTimeout(this.aiTimeout);
    this.scheduleAiBid();
  };

  computeAuctionStats = () => {
    const { userTeam, aiTeam } = this.state;
    const allPlayers = [
      ...(userTeam.players || []).map(p => ({ ...p, teamName: userTeam.name })),
      ...(aiTeam.players || []).map(p => ({ ...p, teamName: aiTeam.name })),
    ];
    if (allPlayers.length === 0) return;

    const highestPaidPlayer = allPlayers.reduce((max, p) => p.soldPrice > (max?.soldPrice || 0) ? p : max, null);
    // Steal: highest rated player with lowest price/basePrice ratio
    const stealPlayer = allPlayers.reduce((best, p) => {
      const ratio = p.soldPrice / (p.basePrice || 1);
      const bestRatio = best ? best.soldPrice / (best.basePrice || 1) : Infinity;
      return (p.rating >= 80 && ratio < bestRatio) ? p : best;
    }, null);

    this.setState({ auctionStats: { highestPaidPlayer, stealPlayer } });
  };

  handleSold = () => {
    const { highestBidderId, currentBid, players, currentPlayerIndex, soldPlayerNames, soldTimeline } = this.state;
    const player = players[currentPlayerIndex];

    clearInterval(this.timerInterval);
    clearTimeout(this.aiTimeout);

    if (highestBidderId) {
      const teamKey = highestBidderId === 1 ? 'userTeam' : 'aiTeam';
      const isSteal = player.rating >= 80 && currentBid <= player.basePrice * 1.25;
      const newTimelineEntry = {
        playerName: player.name,
        role: player.role,
        rating: player.rating,
        price: currentBid,
        teamId: highestBidderId,
        teamName: highestBidderId === 1 ? this.state.userTeam.name : this.state.aiTeam.name,
        isSteal,
        basePrice: player.basePrice,
      };

      this.setState(prev => {
        const team = prev[teamKey];
        return {
          [teamKey]: {
            ...team,
            purse: team.purse - currentBid,
            players: [...(team.players || []), { ...player, soldPrice: currentBid }],
          },
          soldPlayerNames: [...prev.soldPlayerNames, player.name],
          soldTimeline: [newTimelineEntry, ...prev.soldTimeline],
          status: 'waiting',
          soldCelebration: {
            playerName: player.name,
            teamName: team.name,
            price: currentBid,
            role: player.role,
            rating: player.rating,
            isSteal,
          },
        };
      }, () => {
        setTimeout(() => {
          this.setState({ soldCelebration: null });
          this.startNextAuction();
        }, 3000);
      });
    } else {
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
          newState.unsoldPlayerNames = [...prev.unsoldPlayerNames, player.name];
          newState.unsoldPlayersPool = [...prev.unsoldPlayersPool, {
            name: player.name,
            basePrice: player.basePrice,
            role: player.role,
            rating: player.rating,
          }];
        }

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
      aiThinking, aiThinkingText, bidHistory, bidPopup, soldCelebration, unsoldCelebration,
      auctionRound, unsoldPlayersPool, effectiveBasePrice, soldTimeline,
      auctionStats,
    } = this.state;

    const isReAuction = auctionRound === 're-auction';

    if (status === 'finished') {
      const teams = [userTeam, aiTeam];
      const { highestPaidPlayer, stealPlayer } = auctionStats;
      const biggestSpender = teams.reduce((max, t) => {
        const spent = 100 - t.purse;
        return spent > (100 - (max?.purse || 100)) ? t : max;
      }, teams[0]);

      return (
        <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <h2 className="gradient-text text-5xl mb-4 font-black text-center">Auction Concluded!</h2>
          
          {/* Auction Highlights */}
          <div className="glass p-6 mb-8 max-w-3xl mx-auto">
            <h3 className="text-accent font-black text-xl tracking-widest mb-5 uppercase text-center"> Auction Highlights</h3>
            <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {highestPaidPlayer && (
                <div className="bg-panel p-4 rounded-xl border border-accent border-opacity-40 text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-xs text-secondary uppercase tracking-widest mb-1 font-bold">Highest Paid</div>
                  <div className="text-white font-black text-lg">{highestPaidPlayer.name}</div>
                  <div className="text-accent font-bold text-xl">{highestPaidPlayer.soldPrice} Cr</div>
                  <div className="text-secondary text-xs mt-1">{highestPaidPlayer.teamName}</div>
                </div>
              )}
              {stealPlayer && (
                <div className="bg-panel p-4 rounded-xl border border-success border-opacity-40 text-center">
                  <div className="text-3xl mb-2"></div>
                  <div className="text-xs text-secondary uppercase tracking-widest mb-1 font-bold">Steal of Auction</div>
                  <div className="text-white font-black text-lg">{stealPlayer.name}</div>
                  <div className="text-success font-bold text-xl">{stealPlayer.soldPrice} Cr</div>
                  <div className="text-secondary text-xs mt-1">Rating {stealPlayer.rating} • Base {stealPlayer.basePrice} Cr</div>
                </div>
              )}
              {biggestSpender && (
                <div className="bg-panel p-4 rounded-xl border border-primary border-opacity-40 text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-xs text-secondary uppercase tracking-widest mb-1 font-bold">Biggest Spender</div>
                  <div className="text-white font-black text-lg">{biggestSpender.name}</div>
                  <div className="text-primary font-bold text-xl">{(100 - biggestSpender.purse).toFixed(1)} Cr spent</div>
                  <div className="text-secondary text-xs mt-1">{biggestSpender.purse.toFixed(1)} Cr remaining</div>
                </div>
              )}
            </div>
          </div>

          {/* Team Summaries */}
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto mb-12">
            {teams.map(team => (
              <div key={team.id} className="glass p-6">
                <h3 className="text-accent font-bold text-xl mb-2">{team.name}</h3>
                <div className="text-2xl font-black mb-2">{team.purse.toFixed(1)} <span className="text-sm text-secondary">Cr left</span></div>
                <div className="text-sm text-secondary">{team.players ? team.players.length : 0} players</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <button className="btn btn-primary px-10 py-4 text-lg font-black tracking-widest shadow-lg shadow-accent/20" onClick={() => {
                this.props.setTeams([userTeam, aiTeam]);
                this.props.setMyTeamId(userTeam.id);
                this.props.setView('selection');
            }}>
               PROCEED TO MATCH SIMULATION
            </button>
            <button className="btn btn-outline px-10 py-4 text-lg" onClick={() => this.props.setView('modeSelect')}>
              Return to Menu
            </button>
          </div>
        </div>
      );
    }

    const player = players[currentPlayerIndex];
    const teams = [userTeam, aiTeam];
    const isUserLeading = highestBidderId === userTeam.id;

    return (
      <>
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
              <span className="sold-emoji">{soldCelebration.isSteal ? '' : ''}</span>
              <div className="sold-title">{soldCelebration.isSteal ? 'STEAL OF THE AUCTION!' : 'Congratulations!'}</div>
              <div className="sold-player-name">{soldCelebration.playerName}</div>
              <div className="sold-team-name">Sold to {soldCelebration.teamName}</div>
              <div className="sold-price">{soldCelebration.price} Cr</div>
              {soldCelebration.isSteal && (
                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold', marginBottom: '8px' }}>
                  🔥 Under Base Price Steal!
                </div>
              )}
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
              <span className="unsold-emoji"></span>
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

            {aiThinking && status === 'active' && (
              <div className="ai-thinking mt-3">
                {aiThinkingText}
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

          {/* Current Bid + Highest Bidder Display */}
          <div className="glass text-center p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-accent opacity-60"></div>
            <div className="text-xl text-secondary mb-4 font-bold tracking-widest">CURRENT BID</div>
            <div className="text-6xl font-black mb-2 flex items-center justify-center gap-2">
              {currentBid || effectiveBasePrice || player.basePrice} <span className="text-3xl text-secondary">Cr</span>
            </div>
            {highestBidderName && (
              <div style={{
                marginTop: '12px',
                background: highestBidderId === userTeam.id ? 'rgba(212,175,55,0.15)' : 'rgba(34,197,94,0.15)',
                border: `1px solid ${highestBidderId === userTeam.id ? 'rgba(212,175,55,0.5)' : 'rgba(34,197,94,0.5)'}`,
                borderRadius: '999px',
                padding: '8px 20px',
                display: 'inline-block',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: highestBidderId === userTeam.id ? '#d4af37' : '#22c55e',
              }}>
                {highestBidderId === aiTeam.id ? ' ' : ' '} BID BY: {highestBidderName.toUpperCase()}
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
                            ? `✓ LEADING: ${userTeam.name.toUpperCase()}`
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
          <div className="glass max-h-[200px] h-[200px] p-4 flex flex-col scrollable-panel overflow-y-auto">
            <h4 className="mb-3 text-sm tracking-widest text-accent font-bold uppercase border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>LIVE BID HISTORY</h4>
            <div className="flex-1 overflow-y-auto pr-2">
              {bidHistory.length === 0 ? (
                <div className="text-secondary text-center mt-4 italic">Awaiting first bid...</div>
              ) : (
                bidHistory.map((bid, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm px-2 rounded transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>
                      <span style={{ color: bid.isAI ? '#22c55e' : '#d4af37' }} className="font-bold">
                        {bid.isAI ? ' ' : ' '}{bid.teamName}
                      </span>
                      {' '}bid <span className="font-bold">{bid.amount} Cr</span>
                    </span>
                    <span className="text-secondary text-xs mt-1">{bid.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Teams + Bought Players Scrollable */}
        <div className="glass p-6 scrollable-panel mobile-order-3 flex flex-col gap-4 overflow-y-auto" style={{ height: '100%', maxHeight: '85vh', paddingBottom: '160px' }}>
          <h3 className="text-center text-accent tracking-widest font-bold text-lg flex items-center justify-center gap-3 sticky top-0 z-10 pb-2" style={{ background: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            TEAMS PURSE
            {unsoldPlayersPool.length > 0 && (
              <span className="unsold-badge">{unsoldPlayersPool.length} unsold</span>
            )}
          </h3>



          {/* Individual Team Panels */}
          <div className="flex flex-col gap-4">
            {teams.map(team => {
              const minBasePrice = Math.min(...players.map(p => p.basePrice));
              const inactive = this.isTeamInactive(team, minBasePrice);
              return (
                <div key={team.id} className={`bg-panel p-4 rounded-lg border transition-all ${inactive ? 'border-danger border-opacity-30 opacity-60' : ''}`} style={!inactive ? { border: '1px solid rgba(255,255,255,0.05)' } : {}}>
                  <div className="flex justify-between mb-2 items-center">
                    <span className="font-bold text-lg">
                      {team.name} {team.id === 2 && <span className="text-xs text-success"> AI</span>}
                      {inactive && <span className="text-xs bg-danger text-white px-2 py-1 rounded ml-2 align-middle">RESTING</span>}
                    </span>
                    <span className="text-accent font-black text-xl">{team.purse.toFixed(1)} <span className="text-sm">Cr</span></span>
                  </div>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${team.players && team.players.length >= 18 ? 'text-danger' : 'text-secondary'}`}>
                    Squad: {team.players ? team.players.length : 0} / 18
                  </div>
                  {team.players && team.players.length > 0 && (
                    <div className="border-t pt-3 flex flex-col gap-1" style={{ borderColor: 'rgba(255,255,255,0.1)', maxHeight: '180px', overflowY: 'auto' }}>
                      {team.players.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs items-center p-1 rounded hover:bg-white hover:bg-opacity-5">
                          <div>
                            <span className="font-medium">{p.name}</span>
                            <span className="text-secondary ml-2" style={{ fontSize: '10px' }}>{p.role}</span>
                          </div>
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

      {/* Scrolling Broadcast Ticker via Portal */}
      {soldTimeline.length > 0 && createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#050508', padding: '10px 0', borderTop: '2px solid #d4af37', zIndex: 10000, boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' }}>
          <marquee loop="-1" scrollamount="8" style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ display: 'flex', gap: '50px' }}>
              {soldTimeline.map((entry, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                   {entry.playerName} sold to <span style={{ color: entry.teamId === 1 ? '#d4af37' : '#22c55e' }}>{entry.teamName}</span> for <span style={{ color: '#d4af37' }}>{entry.price} Cr</span> {entry.isSteal ? <span style={{ color: '#22c55e' }}>(STEAL)</span> : ''}
                </span>
              ))}
            </div>
          </marquee>
        </div>,
        document.body
      )}
      </>
    );
  }
}

export default ComputerAuction;
