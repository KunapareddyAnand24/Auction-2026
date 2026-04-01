const fs = require('fs');
const files = [
  'src/components/ComputerAuction.jsx',
  'src/components/AuctionDashboard.jsx',
  'src/components/ResultsPage.jsx',
  'src/components/AdminDashboard.jsx',
  'src/components/ModeSelector.jsx',
  'src/components/UserProfile.jsx'
];
const emojis = ['🏆', '👤', '🤖', '🦅', '◆', '🔥', '😔', '🎉', '📋', '✅', '❌'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    emojis.forEach(e => {
      content = content.split(e + ' ').join('');
      content = content.split(' ' + e).join('');
      content = content.split(e).join('');
    });
    fs.writeFileSync(f, content);
  }
});
console.log('Successfully removed emojis');
