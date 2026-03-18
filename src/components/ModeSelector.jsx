import React, { Component } from 'react';

class ModeSelector extends Component {
  render() {
    const { setView, setGameMode } = this.props;

    const modes = [
      {
        key: 'computer',
        icon: '🤖',
        title: 'VS Computer',
        desc: 'Challenge the AI in a solo auction. Build your dream squad against an intelligent computer opponent.',
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
      <div className="container h-80vh flex flex-col justify-center items-center animate-fade-in">
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
        </div>
      </div>
    );
  }
}

export default ModeSelector;
