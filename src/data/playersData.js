// tier:1 = Recognized/International/IPL-known player (ALWAYS included in pool)
// tier:2 = Uncapped/Domestic (randomly selected, 10-15 per set added to pool)
export const PLAYER_SETS = {
  1: 'SET 1 — BATSMEN',
  2: 'SET 2 — WICKETKEEPERS',
  3: 'SET 3 — ALL-ROUNDERS',
  4: 'SET 4 — BOWLERS',
};

const img = {
  a: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop',
  b: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop',
  c: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop',
  d: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop',
  e: 'https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop',
};

const mk = (id, name, role, set, tier, basePrice, rating, imgKey, stats) => ({
  id, name, role, set, tier, basePrice, rating,
  image: img[imgKey],
  stats,
  status: 'available', soldPrice: 0, soldTo: null
});

const bat = (m, r, sr) => ({ matches: m, runs: r, wickets: 0, strikeRate: sr, economy: 0 });
const bowl = (m, w, eco) => ({ matches: m, runs: 0, wickets: w, strikeRate: 0, economy: eco });
const ar = (m, r, w, sr, eco) => ({ matches: m, runs: r, wickets: w, strikeRate: sr, economy: eco });
const wk = (m, r, sr) => ({ matches: m, runs: r, wickets: 0, strikeRate: sr, economy: 0 });

const playersData = [
  // ══════════════ SET 1: BATSMEN ══════════════
  // — Tier 1 (always included) —
  mk(1,  'Virat Kohli',       'Batsman', 1, 1, 2,   95, 'a', bat(244,8074,130.0)),
  mk(2,  'Rohit Sharma',      'Batsman', 1, 1, 2,   93, 'b', bat(159,4231,139.4)),
  mk(3,  'Shubman Gill',      'Batsman', 1, 1, 2,   92, 'a', bat(88, 4131,145.8)),
  mk(4,  'Yashasvi Jaiswal',  'Batsman', 1, 1, 2,   91, 'c', bat(85, 3366,148.5)),
  mk(5,  'Suryakumar Yadav',  'Batsman', 1, 1, 2,   94, 'c', bat(72, 2837,175.7)),
  mk(6,  'Travis Head',       'Batsman', 1, 1, 2,   93, 'e', bat(149,3098,148.1)),
  mk(7,  'David Warner',      'Batsman', 1, 1, 1.5, 90, 'a', bat(125,4551,153.1)),
  mk(8,  'Faf du Plessis',    'Batsman', 1, 1, 1.5, 89, 'c', bat(142,3688,138.6)),
  mk(9,  'Shreyas Iyer',      'Batsman', 1, 1, 1.5, 89, 'b', bat(112,3799,150.6)),
  mk(10, 'Ruturaj Gaikwad',   'Batsman', 1, 1, 1.5, 89, 'a', bat(106,4717,127.6)),
  mk(11, 'Rinku Singh',       'Batsman', 1, 1, 1.5, 88, 'c', bat(99, 2316,150.5)),
  mk(12, 'Tilak Varma',       'Batsman', 1, 1, 1.5, 87, 'b', bat(73, 3203,148.0)),
  mk(13, 'Abhishek Sharma',   'Batsman', 1, 1, 1.5, 88, 'e', bat(107,3861,141.9)),
  mk(14, 'Steve Smith',       'Batsman', 1, 1, 1.5, 88, 'b', bat(114,2756,127.3)),
  mk(15, 'Kane Williamson',   'Batsman', 1, 1, 1.5, 88, 'e', bat(89, 2177,122.6)),
  mk(16, 'Rajat Patidar',     'Batsman', 1, 1, 1,   86, 'e', bat(93, 3765,136.1)),
  mk(17, 'Shikhar Dhawan',    'Batsman', 1, 1, 1,   84, 'a', bat(206,6244,127.2)),
  mk(18, 'Devdutt Padikkal',  'Batsman', 1, 1, 1,   85, 'c', bat(79, 2684,125.3)),
  mk(19, 'Prithvi Shaw',      'Batsman', 1, 1, 0.75,82, 'c', bat(75, 2038,138.9)),
  mk(20, 'Robin Uthappa',     'Batsman', 1, 1, 0.75,82, 'b', bat(205,4952,130.5)),
  // — Tier 2 Uncapped Batsmen — (randomly selected at pool build)
  mk(21, 'Nitish Kumar Reddy','Batsman', 1, 2, 0.5, 78, 'a', bat(45, 1100,138.0)),
  mk(22, 'Ayush Badoni',      'Batsman', 1, 2, 0.5, 76, 'c', bat(52, 1280,142.0)),
  mk(23, 'Anuj Rawat',        'Batsman', 1, 2, 0.5, 75, 'b', bat(38, 890, 130.0)),
  mk(24, 'Himmat Singh',      'Batsman', 1, 2, 0.5, 74, 'e', bat(30, 650, 128.0)),
  mk(25, 'Yash Dhull',        'Batsman', 1, 2, 0.5, 74, 'a', bat(28, 610, 126.0)),
  mk(26, 'Naman Dhir',        'Batsman', 1, 2, 0.5, 73, 'c', bat(35, 720, 135.0)),
  mk(27, 'Vivrant Sharma',    'Batsman', 1, 2, 0.5, 73, 'b', bat(25, 550, 133.0)),
  mk(28, 'Shaik Rasheed',     'Batsman', 1, 2, 0.5, 72, 'a', bat(22, 480, 124.0)),
  mk(29, 'Sai Sudharsan',     'Batsman', 1, 2, 0.75,77, 'c', bat(42, 1050,132.0)),
  mk(30, 'Nehal Wadhera',     'Batsman', 1, 2, 0.5, 74, 'd', bat(33, 740, 140.0)),
  mk(31, 'Kunal Pandya',      'Batsman', 1, 2, 0.5, 72, 'e', bat(20, 420, 122.0)),
  mk(32, 'Baba Indrajith',    'Batsman', 1, 2, 0.5, 71, 'a', bat(24, 500, 118.0)),

  // ══════════════ SET 2: WICKETKEEPERS ══════════════
  // — Tier 1 —
  mk(33, 'MS Dhoni',          'Wicketkeeper', 2, 1, 2,   94, 'b', wk(264,5082,136.1)),
  mk(34, 'Rishabh Pant',      'Wicketkeeper', 2, 1, 2,   91, 'd', wk(143,4077,144.4)),
  mk(35, 'Jos Buttler',       'Wicketkeeper', 2, 1, 2,   93, 'b', wk(94, 2991,161.4)),
  mk(36, 'Heinrich Klaasen',  'Wicketkeeper', 2, 1, 2,   92, 'e', wk(83, 2084,127.3)),
  mk(37, 'KL Rahul',          'Wicketkeeper', 2, 1, 1.5, 90, 'c', wk(114,2797,133.6)),
  mk(38, 'Nicholas Pooran',   'Wicketkeeper', 2, 1, 1.5, 90, 'd', wk(76, 3962,151.0)),
  mk(39, 'Sanju Samson',      'Wicketkeeper', 2, 1, 1.5, 89, 'c', wk(147,2977,162.6)),
  mk(40, 'Quinton de Kock',   'Wicketkeeper', 2, 1, 1.5, 89, 'd', wk(81, 3275,128.7)),
  mk(41, 'Ishan Kishan',      'Wicketkeeper', 2, 1, 1.5, 88, 'e', wk(109,4271,145.6)),
  mk(42, 'Phil Salt',         'Wicketkeeper', 2, 1, 1.5, 88, 'b', wk(62, 2016,161.2)),
  mk(43, 'Jonny Bairstow',    'Wicketkeeper', 2, 1, 1,   86, 'c', wk(98, 3254,138.7)),
  mk(44, 'Wriddhiman Saha',   'Wicketkeeper', 2, 1, 0.75,82, 'd', wk(165,2789,122.4)),
  mk(45, 'Dinesh Karthik',    'Wicketkeeper', 2, 1, 1,   85, 'b', wk(229,4839,137.9)),
  // — Tier 2 Uncapped WKs —
  mk(46, 'Dhruv Jurel',       'Wicketkeeper', 2, 2, 0.5, 77, 'a', wk(28, 680, 132.0)),
  mk(47, 'Jitesh Sharma',     'Wicketkeeper', 2, 2, 0.75,78, 'c', wk(48, 980, 148.0)),
  mk(48, 'Upendra Yadav',     'Wicketkeeper', 2, 2, 0.5, 75, 'e', wk(32, 650, 138.0)),
  mk(49, 'Vishnu Vinod',      'Wicketkeeper', 2, 2, 0.5, 74, 'b', wk(25, 520, 128.0)),
  mk(50, 'Prabhsimran Singh', 'Wicketkeeper', 2, 2, 0.5, 76, 'd', wk(40, 890, 142.0)),
  mk(51, 'Riyan Parag',       'Wicketkeeper', 2, 2, 0.75,78, 'a', wk(55, 1200,135.0)),
  mk(52, 'Suyash Prabhudessai','Wicketkeeper',2, 2, 0.5, 72, 'c', wk(22, 450, 124.0)),
  mk(53, 'Abhishek Porel',    'Wicketkeeper', 2, 2, 0.5, 73, 'e', wk(30, 620, 130.0)),
  mk(54, 'Kumar Kushagra',    'Wicketkeeper', 2, 2, 0.5, 72, 'b', wk(18, 380, 126.0)),
  mk(55, 'Smaran Nair',       'Wicketkeeper', 2, 2, 0.5, 70, 'a', wk(15, 310, 120.0)),

  // ══════════════ SET 3: ALL-ROUNDERS ══════════════
  // — Tier 1 —
  mk(56, 'Hardik Pandya',     'All-rounder', 3, 1, 2,   92, 'a', ar(115,3797,117,164.4,7.1)),
  mk(57, 'Ravindra Jadeja',   'All-rounder', 3, 1, 2,   93, 'e', ar(237,2502,132,127.6,7.6)),
  mk(58, 'Andre Russell',     'All-rounder', 3, 1, 2,   92, 'c', ar(126,4038,118,160.9,7.9)),
  mk(59, 'Sunil Narine',      'All-rounder', 3, 1, 2,   92, 'd', ar(176,3819,179,159.3,6.7)),
  mk(60, 'Ben Stokes',        'All-rounder', 3, 1, 1.5, 91, 'e', ar(132,4002,107,161.5,8.6)),
  mk(61, 'Pat Cummins',       'All-rounder', 3, 1, 1.5, 91, 'c', ar(96, 2932,65, 149.1,7.1)),
  mk(62, 'Glenn Maxwell',     'All-rounder', 3, 1, 1.5, 90, 'e', ar(71, 2850,81, 159.8,8.2)),
  mk(63, 'R Ashwin',          'All-rounder', 3, 1, 1.5, 89, 'd', ar(184,2153,180,118.4,6.8)),
  mk(64, 'Liam Livingstone',  'All-rounder', 3, 1, 1.5, 88, 'd', ar(104,3654,53, 156.3,7.4)),
  mk(65, 'Sam Curran',        'All-rounder', 3, 1, 1.5, 88, 'c', ar(95, 3644,54, 129.5,7.7)),
  mk(66, 'Marcus Stoinis',    'All-rounder', 3, 1, 1.5, 88, 'e', ar(117,3095,81, 134.9,7.8)),
  mk(67, 'Axar Patel',        'All-rounder', 3, 1, 1.5, 89, 'a', ar(201,2317,182,138.1,7.0)),
  mk(68, 'Shivam Dube',       'All-rounder', 3, 1, 1,   87, 'a', ar(101,4595,63, 145.0,8.2)),
  mk(69, 'Moeen Ali',         'All-rounder', 3, 1, 1,   87, 'd', ar(72, 3622,98, 133.4,6.6)),
  mk(70, 'Cameron Green',     'All-rounder', 3, 1, 1.5, 88, 'a', ar(83, 4703,92, 162.3,8.6)),
  mk(71, 'Shardul Thakur',    'All-rounder', 3, 1, 1,   85, 'c', ar(87, 3048,82, 132.8,7.7)),
  mk(72, 'Washington Sundar', 'All-rounder', 3, 1, 1,   85, 'a', ar(137,4212,102,127.1,8.3)),
  mk(73, 'Rahul Tewatia',     'All-rounder', 3, 1, 1,   85, 'b', ar(102,3080,103,146.4,8.3)),
  mk(74, 'Jason Holder',      'All-rounder', 3, 1, 1,   84, 'd', ar(87, 2281,99, 126.2,8.4)),
  // — Tier 2 Uncapped All-rounders —
  mk(75, 'Nitish Rana',       'All-rounder', 3, 2, 0.75,78, 'b', ar(120,2900,55, 138.0,8.5)),
  mk(76, 'Dhruv Jurel AR',    'All-rounder', 3, 2, 0.5, 75, 'a', ar(40, 850, 35, 132.0,9.0)),
  mk(77, 'Romario Shepherd',  'All-rounder', 3, 2, 0.75,77, 'e', ar(55, 980, 58, 148.0,8.8)),
  mk(78, 'Vijay Shankar',     'All-rounder', 3, 2, 0.5, 74, 'c', ar(60, 1200,48, 130.0,8.6)),
  mk(79, 'Sherfane Rutherford','All-rounder',3, 2, 0.5, 75, 'd', ar(45, 980, 40, 145.0,9.0)),
  mk(80, 'Venkatesh Iyer',    'All-rounder', 3, 2, 0.75,77, 'b', ar(62, 1480,42, 142.0,8.4)),
  mk(81, 'SKY Reserve AR',    'All-rounder', 3, 2, 0.5, 73, 'a', ar(35, 750, 30, 136.0,9.1)),
  mk(82, 'Krishnappa Gowtham','All-rounder', 3, 2, 0.5, 73, 'e', ar(55, 950, 52, 127.0,8.9)),
  mk(83, 'Shahbaz Ahmed',     'All-rounder', 3, 2, 0.5, 74, 'c', ar(65, 1050,65, 132.0,7.9)),
  mk(84, 'Suyash Sharma AR',  'All-rounder', 3, 2, 0.5, 72, 'b', ar(30, 450, 30, 120.0,9.2)),
  mk(85, 'Sai Kishore',       'All-rounder', 3, 2, 0.5, 74, 'd', ar(52, 420, 55, 108.0,7.4)),
  mk(86, 'Ramandeep Singh',   'All-rounder', 3, 2, 0.5, 73, 'a', ar(40, 720, 25, 148.0,9.5)),
  mk(87, 'Shashank Singh',    'All-rounder', 3, 2, 0.75,76, 'e', ar(58, 1250,42, 152.0,9.0)),

  // ══════════════ SET 4: BOWLERS ══════════════
  // — Tier 1 —
  mk(88, 'Jasprit Bumrah',    'Bowler', 4, 1, 2,   96, 'd', bowl(147,92, 6.6)),
  mk(89, 'Rashid Khan',       'Bowler', 4, 1, 2,   95, 'e', bowl(312,478,6.2)),
  mk(90, 'Mitchell Starc',    'Bowler', 4, 1, 2,   92, 'e', bowl(83, 114,8.2)),
  mk(91, 'Kagiso Rabada',     'Bowler', 4, 1, 2,   92, 'e', bowl(85, 106,7.5)),
  mk(92, 'Mohammed Shami',    'Bowler', 4, 1, 1.5, 91, 'b', bowl(80, 76, 8.3)),
  mk(93, 'Trent Boult',       'Bowler', 4, 1, 1.5, 91, 'b', bowl(143,52, 8.3)),
  mk(94, 'Kuldeep Yadav',     'Bowler', 4, 1, 1.5, 90, 'a', bowl(85, 92, 6.8)),
  mk(95, 'Yuzvendra Chahal',  'Bowler', 4, 1, 1.5, 89, 'b', bowl(97, 78, 7.6)),
  mk(96, 'Matheesha Pathirana','Bowler', 4, 1, 1.5, 89, 'e', bowl(106,84, 7.0)),
  mk(97, 'Arshdeep Singh',    'Bowler', 4, 1, 1.5, 88, 'e', bowl(104,53, 6.9)),
  mk(98, 'Mohammed Siraj',    'Bowler', 4, 1, 1.5, 89, 'b', bowl(141,52, 8.1)),
  mk(99, 'Harshal Patel',     'Bowler', 4, 1, 1,   87, 'c', bowl(95, 108,8.9)),
  mk(100,'Bhuvneshwar Kumar', 'Bowler', 4, 1, 1,   87, 'a', bowl(87, 75, 7.3)),
  mk(101,'Deepak Chahar',     'Bowler', 4, 1, 1,   86, 'd', bowl(105,94, 7.0)),
  mk(102,'Anrich Nortje',     'Bowler', 4, 1, 1,   88, 'e', bowl(64, 84, 7.6)),
  mk(103,'Mark Wood',         'Bowler', 4, 1, 1,   87, 'b', bowl(71, 89, 8.1)),
  mk(104,'Gerald Coetzee',    'Bowler', 4, 1, 1,   86, 'c', bowl(52, 62, 7.8)),
  mk(105,'Mohit Sharma',      'Bowler', 4, 1, 0.75,86, 'e', bowl(128,58, 8.1)),
  mk(106,'Ravi Bishnoi',      'Bowler', 4, 1, 0.75,84, 'd', bowl(74, 59, 7.2)),
  // — Tier 2 Uncapped Bowlers —
  mk(107,'Tushar Deshpande',  'Bowler', 4, 2, 0.5, 76, 'a', bowl(58, 66, 8.8)),
  mk(108,'Akash Madhwal',     'Bowler', 4, 2, 0.5, 75, 'c', bowl(42, 48, 7.9)),
  mk(109,'Nandre Burger',     'Bowler', 4, 2, 0.5, 76, 'e', bowl(35, 41, 8.2)),
  mk(110,'Naveen-ul-Haq',     'Bowler', 4, 2, 0.5, 76, 'b', bowl(50, 54, 8.5)),
  mk(111,'Mukesh Kumar',      'Bowler', 4, 2, 0.5, 75, 'd', bowl(45, 50, 8.6)),
  mk(112,'Mayank Yadav',      'Bowler', 4, 2, 0.75,77, 'a', bowl(30, 35, 7.4)),
  mk(113,'Yash Thakur',       'Bowler', 4, 2, 0.5, 74, 'c', bowl(38, 42, 9.1)),
  mk(114,'Suyash Sharma',     'Bowler', 4, 2, 0.5, 74, 'e', bowl(35, 40, 8.3)),
  mk(115,'Harshit Rana',      'Bowler', 4, 2, 0.5, 75, 'b', bowl(40, 46, 8.7)),
  mk(116,'Vaibhav Arora',     'Bowler', 4, 2, 0.5, 73, 'a', bowl(32, 36, 9.0)),
  mk(117,'Vyshak Vijaykumar', 'Bowler', 4, 2, 0.5, 74, 'd', bowl(42, 48, 8.5)),
  mk(118,'Rasikh Dar',        'Bowler', 4, 2, 0.5, 72, 'c', bowl(28, 28, 9.4)),
  mk(119,'Sundar Raman',      'Bowler', 4, 2, 0.5, 71, 'e', bowl(22, 22, 9.8)),
];

export default playersData;
