import React, { Component } from 'react';

const FANTASY_RULES = [
  {
    category: 'BATTING',
    icon: '🏏',
    color: '#d4af37',
    rules: [
      { label: 'Run', points: '+1' },
      { label: 'Boundary (4)', points: '+1' },
      { label: 'Six', points: '+2' },
      { label: 'Half-century (50 runs)', points: '+8' },
      { label: 'Century (100 runs)', points: '+16' },
      { label: 'Duck (batsman out for 0)', points: '-2' },
      { label: 'Strike Rate < 70 (min 10 balls)', points: '-6', sub: true },
      { label: 'Strike Rate 70–99.9', points: '-4', sub: true },
      { label: 'Strike Rate 100–129.9', points: '0', sub: true },
      { label: 'Strike Rate 130–149.9', points: '+2', sub: true },
      { label: 'Strike Rate 150–170', points: '+4', sub: true },
      { label: 'Strike Rate > 170', points: '+6', sub: true },
    ]
  },
  {
    category: 'BOWLING',
    icon: '⚾',
    color: '#4fc3f7',
    rules: [
      { label: 'Wicket (excl. run-out)', points: '+20' },
      { label: 'Maiden Over', points: '+12' },
      { label: 'Wide', points: '-2' },
      { label: 'No Ball', points: '-2' },
      { label: '3 Wickets Bonus', points: '+4' },
      { label: '4 Wickets Bonus', points: '+8' },
      { label: '5+ Wickets Bonus', points: '+16' },
      { label: 'Economy < 5', points: '+6', sub: true },
      { label: 'Economy 5–5.99', points: '+4', sub: true },
      { label: 'Economy 6–7', points: '+2', sub: true },
      { label: 'Economy 7–10', points: '0', sub: true },
      { label: 'Economy 10–11', points: '-2', sub: true },
      { label: 'Economy 11.01–12', points: '-4', sub: true },
      { label: 'Economy > 12', points: '-6', sub: true },
    ]
  },
  {
    category: 'FIELDING',
    icon: '🛡️',
    color: '#22c55e',
    rules: [
      { label: 'Catch', points: '+8' },
      { label: '3+ Catches Bonus', points: '+4' },
      { label: 'Run Out', points: '+6' },
      { label: 'Stumping', points: '+6' },
    ]
  },
];

const AUCTION_RULES = [
  {
    num: '1',
    color: '#d4af37',
    title: 'Squad & Purse',
    desc: 'Each franchise starts with ₹100 Cr to build a maximum squad of 18 players. Running out of purse means no more bidding!',
  },
  {
    num: '2',
    color: '#4fc3f7',
    title: 'Bidding & Timer',
    desc: 'Each player gets 20 seconds. Any bid in the last 5 seconds resets the timer to +5 seconds for a final chance. Bid in increments of 0.25 Cr.',
  },
  {
    num: '3',
    color: '#22c55e',
    title: 'Sets & Re-Auction',
    desc: 'Players are auctioned in Sets (Batsmen → WK → All-rounders → Bowlers). Unsold players come back in a Re-Auction at 50% base price.',
  },
  {
    num: '4',
    color: '#a855f7',
    title: 'REST System',
    desc: 'Once you have 11+ players, you can REST to stop bidding safely. When all teams REST, the auction ends.',
  },
  {
    num: '5',
    color: '#f97316',
    title: 'Playing XI & Impact Player',
    desc: 'After the auction, each team selects 11 players for the Playing XI and 1 Impact Player. Fantasy scores are calculated to determine the winner.',
  },
  {
    num: '6',
    color: '#ec4899',
    title: 'Winner Determination',
    desc: 'Fantasy points are totalled per team based on player career stats. The team with the highest total fantasy score wins the APL Trophy!',
  },
];

class ModeSelector extends Component {
  render() {
    const { setView, setGameMode, onContinueGame, hasActiveSession } = this.props;

    const modes = [
      {
        key: 'computer',
        icon: '',
        title: 'VS Computer',
        desc: 'Challenge the Gemini AI in a solo auction. Build your dream squad against an intelligent computer opponent.',
        badge: 'Solo Mode',
        badgeClass: 'mode-card-badge--solo',
      },
      {
        key: 'multiplayer',
        icon: '👥',
        title: 'VS Custom Player',
        desc: 'Create or join a room with friends. Play across devices on the same lobby in real-time.',
        badge: 'Multiplayer',
        badgeClass: 'mode-card-badge--multi',
      },
      {
        key: 'quick',
        icon: '⚡',
        title: 'Quick Auction',
        desc: 'Jump straight into an auction with default 2-team setup. Fast and fun — no setup needed.',
        badge: 'Instant Play',
        badgeClass: 'mode-card-badge--quick',
      },
    ];

    const handleSelect = (key) => {
      if (setGameMode) setGameMode(key);
      if (key === 'computer') {
        setView('computerAuction');
      } else if (key === 'multiplayer') {
        setView('room');
      } else if (key === 'quick') {
        setView('quickAuction');
      }
    };

    return (
      <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
        {/* ── Mode Selection ── */}
        <div className="container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 className="gradient-text text-5xl mb-4 font-black tracking-tight text-center">
            CHOOSE YOUR MODE
          </h1>
          <p className="text-secondary mb-12 text-lg text-center" style={{ maxWidth: '500px' }}>
            Pick how you want to play the APL Auction 2026
          </p>

          <div className="mode-grid">
            {modes.map((mode) => (
              <div
                key={mode.key}
                className="mode-card"
                onClick={() => handleSelect(mode.key)}
              >
                <span className="mode-card-icon">{mode.icon}</span>
                <div className="mode-card-title">{mode.title}</div>
                <div className="mode-card-desc">{mode.desc}</div>
                <span className={`mode-card-badge ${mode.badgeClass}`}>
                  {mode.badge}
                </span>
              </div>
            ))}

            {/* Continue Game Card */}
            <div
              className={`mode-card continue-game-card ${hasActiveSession ? '' : 'continue-game-card--disabled'}`}
              onClick={() => {
                if (hasActiveSession && onContinueGame) {
                  onContinueGame();
                } else if (!hasActiveSession) {
                  alert('No active game session found. Start a new game first!');
                }
              }}
            >
              <span className="mode-card-icon">🔄</span>
              <div className="mode-card-title">Continue Game</div>
              <div className="mode-card-desc">
                {hasActiveSession
                  ? 'Rejoin your ongoing auction. Resume right where you left off.'
                  : 'No active session detected. Start a new game to enable this option.'}
              </div>
              <span className={`mode-card-badge mode-card-badge--continue ${hasActiveSession ? '' : 'mode-card-badge--inactive'}`}>
                {hasActiveSession ? '● Session Active' : '○ No Session'}
              </span>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5 }}>
            <div style={{ fontSize: '1.5rem', animation: 'bounce 1.5s infinite' }}>↓</div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888' }}>Scroll for Rules &amp; Points</div>
          </div>
        </div>

        {/* ── Rules & Instructions Section ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '4rem 1rem',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div className="container" style={{ maxWidth: '900px' }}>

            {/* Auction Rules */}
            <div style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem', fontWeight: 900, textAlign: 'center', marginBottom: '2rem',
                background: 'linear-gradient(135deg, #d4af37, #4fc3f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                🏟 AUCTION RULES
              </h2>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                {AUCTION_RULES.map(rule => (
                  <div key={rule.num} className="glass p-5" style={{ borderLeft: `3px solid ${rule.color}`, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0,
                        background: rule.color + '22', color: rule.color, border: `2px solid ${rule.color}44`
                      }}>
                        {rule.num}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>{rule.title}</div>
                        <div style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.5 }}>{rule.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fantasy Points Tables */}
            <div>
              <h2 style={{
                fontSize: '2rem', fontWeight: 900, textAlign: 'center', marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #22c55e, #d4af37)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                ⭐ HOW FANTASY POINTS WORK
              </h2>
              <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '2rem' }}>
                After the auction, select your Playing XI &amp; 1 Impact Player. Points are calculated from career stats to determine the winner.
              </p>

              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                {FANTASY_RULES.map(cat => (
                  <div key={cat.category} className="glass p-5" style={{ borderTop: `3px solid ${cat.color}`, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                      <span style={{ fontWeight: 900, fontSize: '1rem', color: cat.color, letterSpacing: '0.15em' }}>{cat.category}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {cat.rules.map((r, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: r.sub ? '3px 0 3px 16px' : '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          opacity: r.sub ? 0.85 : 1,
                        }}>
                          <span style={{ fontSize: '0.8rem', color: r.sub ? '#999' : '#ccc' }}>
                            {r.sub ? '↳ ' : ''}{r.label}
                          </span>
                          <span style={{
                            fontWeight: 700, fontSize: '0.85rem',
                            color: r.points.startsWith('+') ? '#22c55e' : r.points.startsWith('-') ? '#ef4444' : '#888'
                          }}>
                            {r.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                className="btn btn-primary px-10 py-4 text-lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                ↑ Back to Top — Choose Your Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ModeSelector;
