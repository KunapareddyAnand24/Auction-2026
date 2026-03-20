const playersData = [
  {
    "id": 1,
    "name": "Virat Kohli",
    "role": "Batsman",
    "basePrice": 2,
    "rating": 95,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 106,
      "runs": 3712,
      "wickets": 2,
      "strikeRate": 138.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 2,
    "name": "MS Dhoni",
    "role": "Wicketkeeper",
    "basePrice": 2,
    "rating": 94,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 76,
      "runs": 3811,
      "wickets": 1,
      "strikeRate": 134.2,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 3,
    "name": "Rohit Sharma",
    "role": "Batsman",
    "basePrice": 2,
    "rating": 93,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 104,
      "runs": 3749,
      "wickets": 0,
      "strikeRate": 151,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 4,
    "name": "Jasprit Bumrah",
    "role": "Bowler",
    "basePrice": 2,
    "rating": 96,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 147,
      "runs": 84,
      "wickets": 92,
      "strikeRate": 94.6,
      "economy": 8.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 5,
    "name": "Hardik Pandya",
    "role": "All-rounder",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 115,
      "runs": 3797,
      "wickets": 117,
      "strikeRate": 164.4,
      "economy": 7.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 6,
    "name": "Suryakumar Yadav",
    "role": "Batsman",
    "basePrice": 2,
    "rating": 94,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 72,
      "runs": 2837,
      "wickets": 1,
      "strikeRate": 131.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 7,
    "name": "KL Rahul",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 114,
      "runs": 2797,
      "wickets": 4,
      "strikeRate": 133.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 8,
    "name": "Rishabh Pant",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 143,
      "runs": 4077,
      "wickets": 1,
      "strikeRate": 144.4,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 9,
    "name": "Shubman Gill",
    "role": "Batsman",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 88,
      "runs": 4131,
      "wickets": 1,
      "strikeRate": 145.8,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 10,
    "name": "Shreyas Iyer",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 112,
      "runs": 3799,
      "wickets": 2,
      "strikeRate": 150.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 11,
    "name": "Ravindra Jadeja",
    "role": "All-rounder",
    "basePrice": 2,
    "rating": 93,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 115,
      "runs": 2550,
      "wickets": 79,
      "strikeRate": 155.8,
      "economy": 7.2
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 12,
    "name": "Rashid Khan",
    "role": "Bowler",
    "basePrice": 2,
    "rating": 95,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 143,
      "runs": 226,
      "wickets": 89,
      "strikeRate": 87.3,
      "economy": 8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 13,
    "name": "Jos Buttler",
    "role": "Wicketkeeper",
    "basePrice": 2,
    "rating": 93,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 94,
      "runs": 2991,
      "wickets": 2,
      "strikeRate": 161.4,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 14,
    "name": "Ben Stokes",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 132,
      "runs": 4002,
      "wickets": 107,
      "strikeRate": 161.5,
      "economy": 8.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 15,
    "name": "David Warner",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 125,
      "runs": 4551,
      "wickets": 1,
      "strikeRate": 153.1,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 16,
    "name": "Andre Russell",
    "role": "All-rounder",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 126,
      "runs": 4038,
      "wickets": 118,
      "strikeRate": 160.9,
      "economy": 7.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 17,
    "name": "Glenn Maxwell",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 71,
      "runs": 2850,
      "wickets": 81,
      "strikeRate": 159.8,
      "economy": 8.2
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 18,
    "name": "Sunil Narine",
    "role": "All-rounder",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 82,
      "runs": 3300,
      "wickets": 95,
      "strikeRate": 126.9,
      "economy": 7.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 19,
    "name": "Trent Boult",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 143,
      "runs": 27,
      "wickets": 52,
      "strikeRate": 83.4,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 20,
    "name": "Kagiso Rabada",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 85,
      "runs": 233,
      "wickets": 106,
      "strikeRate": 72.5,
      "economy": 7.5
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 21,
    "name": "Pat Cummins",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 96,
      "runs": 2932,
      "wickets": 65,
      "strikeRate": 149.1,
      "economy": 7.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 22,
    "name": "Mitchell Starc",
    "role": "Bowler",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 83,
      "runs": 299,
      "wickets": 114,
      "strikeRate": 92.8,
      "economy": 8.2
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 23,
    "name": "Yuzvendra Chahal",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 97,
      "runs": 107,
      "wickets": 78,
      "strikeRate": 97.2,
      "economy": 7.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 24,
    "name": "Kuldeep Yadav",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 85,
      "runs": 114,
      "wickets": 92,
      "strikeRate": 78.8,
      "economy": 6.8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 25,
    "name": "Mohammed Shami",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 80,
      "runs": 228,
      "wickets": 76,
      "strikeRate": 72.2,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 26,
    "name": "Mohammed Siraj",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 141,
      "runs": 185,
      "wickets": 52,
      "strikeRate": 90.2,
      "economy": 8.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 27,
    "name": "R Ashwin",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 141,
      "runs": 4566,
      "wickets": 70,
      "strikeRate": 164.8,
      "economy": 7.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 28,
    "name": "Ishan Kishan",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 109,
      "runs": 4271,
      "wickets": 1,
      "strikeRate": 145.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 29,
    "name": "Sanju Samson",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 147,
      "runs": 2977,
      "wickets": 3,
      "strikeRate": 162.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 30,
    "name": "Ruturaj Gaikwad",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 106,
      "runs": 4717,
      "wickets": 1,
      "strikeRate": 127.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 31,
    "name": "Yashasvi Jaiswal",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 85,
      "runs": 3366,
      "wickets": 3,
      "strikeRate": 148.5,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 32,
    "name": "Rinku Singh",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 99,
      "runs": 2316,
      "wickets": 3,
      "strikeRate": 147.5,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 33,
    "name": "Quinton de Kock",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 81,
      "runs": 3275,
      "wickets": 4,
      "strikeRate": 128.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 34,
    "name": "Faf du Plessis",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 142,
      "runs": 3688,
      "wickets": 0,
      "strikeRate": 138.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 35,
    "name": "Marcus Stoinis",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 117,
      "runs": 3095,
      "wickets": 81,
      "strikeRate": 134.9,
      "economy": 7.8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 36,
    "name": "Nicholas Pooran",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 90,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 76,
      "runs": 3962,
      "wickets": 1,
      "strikeRate": 145,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 37,
    "name": "Heinrich Klaasen",
    "role": "Wicketkeeper",
    "basePrice": 2,
    "rating": 92,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 83,
      "runs": 2084,
      "wickets": 0,
      "strikeRate": 127.3,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 38,
    "name": "Travis Head",
    "role": "Batsman",
    "basePrice": 2,
    "rating": 93,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 149,
      "runs": 3098,
      "wickets": 3,
      "strikeRate": 148.1,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 39,
    "name": "Cameron Green",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 83,
      "runs": 4703,
      "wickets": 92,
      "strikeRate": 162.3,
      "economy": 8.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 40,
    "name": "Liam Livingstone",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 104,
      "runs": 3654,
      "wickets": 53,
      "strikeRate": 156.3,
      "economy": 7.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 41,
    "name": "Sam Curran",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 95,
      "runs": 3644,
      "wickets": 54,
      "strikeRate": 129.5,
      "economy": 7.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 42,
    "name": "Moeen Ali",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 72,
      "runs": 3622,
      "wickets": 98,
      "strikeRate": 133.4,
      "economy": 6.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 43,
    "name": "Deepak Chahar",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 105,
      "runs": 246,
      "wickets": 94,
      "strikeRate": 99.4,
      "economy": 8.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 44,
    "name": "Shardul Thakur",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 87,
      "runs": 3048,
      "wickets": 82,
      "strikeRate": 132.8,
      "economy": 7.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 45,
    "name": "Axar Patel",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 99,
      "runs": 3849,
      "wickets": 108,
      "strikeRate": 132.1,
      "economy": 7.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 46,
    "name": "Washington Sundar",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 137,
      "runs": 4212,
      "wickets": 102,
      "strikeRate": 127.1,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 47,
    "name": "Arshdeep Singh",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 104,
      "runs": 246,
      "wickets": 53,
      "strikeRate": 78.4,
      "economy": 6.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 48,
    "name": "Tilak Varma",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 73,
      "runs": 3203,
      "wickets": 2,
      "strikeRate": 128,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 49,
    "name": "Abhishek Sharma",
    "role": "Batsman",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 107,
      "runs": 3861,
      "wickets": 0,
      "strikeRate": 141.9,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 50,
    "name": "Matheesha Pathirana",
    "role": "Bowler",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 106,
      "runs": 177,
      "wickets": 84,
      "strikeRate": 88.4,
      "economy": 7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 51,
    "name": "Rajat Patidar",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 93,
      "runs": 3765,
      "wickets": 1,
      "strikeRate": 136.1,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 52,
    "name": "Shivam Dube",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 101,
      "runs": 4595,
      "wickets": 63,
      "strikeRate": 145,
      "economy": 8.2
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 53,
    "name": "Rahul Tewatia",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 102,
      "runs": 3080,
      "wickets": 103,
      "strikeRate": 146.4,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 54,
    "name": "Mohit Sharma",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 128,
      "runs": 165,
      "wickets": 58,
      "strikeRate": 99.7,
      "economy": 8.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 55,
    "name": "Bhuvneshwar Kumar",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 87,
      "runs": 76,
      "wickets": 75,
      "strikeRate": 80.6,
      "economy": 8.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 56,
    "name": "Jason Holder",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 87,
      "runs": 4677,
      "wickets": 100,
      "strikeRate": 162.8,
      "economy": 6.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 57,
    "name": "Tim David",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 93,
      "runs": 3779,
      "wickets": 1,
      "strikeRate": 144.8,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 58,
    "name": "Phil Salt",
    "role": "Wicketkeeper",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 110,
      "runs": 4495,
      "wickets": 3,
      "strikeRate": 155.4,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 59,
    "name": "Wanindu Hasaranga",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 126,
      "runs": 2365,
      "wickets": 81,
      "strikeRate": 152.3,
      "economy": 6.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 60,
    "name": "Aiden Markram",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 91,
      "runs": 4324,
      "wickets": 0,
      "strikeRate": 137,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 61,
    "name": "Prithvi Shaw",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 10,
      "runs": 441,
      "wickets": 0,
      "strikeRate": 115.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 62,
    "name": "Manish Pandey",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 38,
      "runs": 135,
      "wickets": 0,
      "strikeRate": 125.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 63,
    "name": "Mayank Agarwal",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 27,
      "runs": 1593,
      "wickets": 2,
      "strikeRate": 130,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 64,
    "name": "Rahul Tripathi",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 30,
      "runs": 1574,
      "wickets": 2,
      "strikeRate": 123.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 65,
    "name": "Devdutt Padikkal",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 17,
      "runs": 1447,
      "wickets": 0,
      "strikeRate": 122.2,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 66,
    "name": "Nitish Rana",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 36,
      "runs": 1313,
      "wickets": 0,
      "strikeRate": 122.9,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 67,
    "name": "Venkatesh Iyer",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 53,
      "runs": 572,
      "wickets": 27,
      "strikeRate": 125.5,
      "economy": 9.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 68,
    "name": "Deepak Hooda",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 16,
      "runs": 1541,
      "wickets": 40,
      "strikeRate": 125.3,
      "economy": 10.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 69,
    "name": "Krunal Pandya",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 44,
      "runs": 835,
      "wickets": 10,
      "strikeRate": 129.5,
      "economy": 10.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 70,
    "name": "Shahrukh Khan",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 42,
      "runs": 705,
      "wickets": 0,
      "strikeRate": 134.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 71,
    "name": "Abdul Samad",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 57,
      "runs": 903,
      "wickets": 1,
      "strikeRate": 127.4,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 72,
    "name": "Riyan Parag",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 79,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 27,
      "runs": 1333,
      "wickets": 30,
      "strikeRate": 117.6,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 73,
    "name": "Tewatia",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 35,
      "runs": 999,
      "wickets": 20,
      "strikeRate": 124,
      "economy": 9.5
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 74,
    "name": "Vijay Shankar",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 34,
      "runs": 1020,
      "wickets": 5,
      "strikeRate": 120,
      "economy": 8.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 75,
    "name": "Jitesh Sharma",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 11,
      "runs": 306,
      "wickets": 0,
      "strikeRate": 132,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 76,
    "name": "Dhruv Jurel",
    "role": "Wicketkeeper",
    "basePrice": 0.5,
    "rating": 79,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 45,
      "runs": 137,
      "wickets": 1,
      "strikeRate": 119,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 77,
    "name": "Prabhsimran Singh",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 45,
      "runs": 1378,
      "wickets": 2,
      "strikeRate": 124.8,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 78,
    "name": "Anuj Rawat",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 59,
      "runs": 473,
      "wickets": 0,
      "strikeRate": 118.3,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 79,
    "name": "KS Bharat",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 15,
      "runs": 1091,
      "wickets": 0,
      "strikeRate": 120.8,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 80,
    "name": "Wriddhiman Saha",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 11,
      "runs": 556,
      "wickets": 1,
      "strikeRate": 140.1,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 81,
    "name": "Harshal Patel",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 47,
      "runs": 56,
      "wickets": 44,
      "strikeRate": 68.7,
      "economy": 8.2
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 82,
    "name": "Avesh Khan",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 31,
      "runs": 84,
      "wickets": 40,
      "strikeRate": 83.7,
      "economy": 8.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 83,
    "name": "Prasiddh Krishna",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 12,
      "runs": 37,
      "wickets": 36,
      "strikeRate": 68.8,
      "economy": 11
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 84,
    "name": "Navdeep Saini",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 29,
      "runs": 47,
      "wickets": 34,
      "strikeRate": 88.3,
      "economy": 10
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 85,
    "name": "Umesh Yadav",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 48,
      "runs": 40,
      "wickets": 33,
      "strikeRate": 89.4,
      "economy": 10.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 86,
    "name": "Ishant Sharma",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 18,
      "runs": 59,
      "wickets": 20,
      "strikeRate": 85,
      "economy": 8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 87,
    "name": "Sandeep Sharma",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 51,
      "runs": 92,
      "wickets": 16,
      "strikeRate": 87,
      "economy": 10.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 88,
    "name": "Khaleel Ahmed",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 32,
      "runs": 96,
      "wickets": 22,
      "strikeRate": 73.9,
      "economy": 7.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 89,
    "name": "T Natarajan",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 36,
      "runs": 87,
      "wickets": 35,
      "strikeRate": 87.5,
      "economy": 7.5
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 90,
    "name": "Chetan Sakariya",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 27,
      "runs": 69,
      "wickets": 32,
      "strikeRate": 65.4,
      "economy": 9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 91,
    "name": "Mukesh Kumar",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 24,
      "runs": 23,
      "wickets": 35,
      "strikeRate": 76.4,
      "economy": 8.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 92,
    "name": "Yash Thakur",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 17,
      "runs": 24,
      "wickets": 17,
      "strikeRate": 79.1,
      "economy": 8.6
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 93,
    "name": "Tushar Deshpande",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 57,
      "runs": 4,
      "wickets": 21,
      "strikeRate": 83.9,
      "economy": 8.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 94,
    "name": "Ravi Bishnoi",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 20,
      "runs": 82,
      "wickets": 37,
      "strikeRate": 86,
      "economy": 10.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 95,
    "name": "Rahul Chahar",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 33,
      "runs": 99,
      "wickets": 37,
      "strikeRate": 69.2,
      "economy": 10.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 96,
    "name": "Varun Chakaravarthy",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 28,
      "runs": 0,
      "wickets": 8,
      "strikeRate": 71.3,
      "economy": 9.8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 97,
    "name": "Mayank Markande",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 50,
      "runs": 6,
      "wickets": 12,
      "strikeRate": 70.5,
      "economy": 10.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 98,
    "name": "Amit Mishra",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 79,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 45,
      "runs": 97,
      "wickets": 39,
      "strikeRate": 60.6,
      "economy": 8.1
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 99,
    "name": "Piyush Chawla",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 79,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 33,
      "runs": 28,
      "wickets": 28,
      "strikeRate": 77.6,
      "economy": 9.4
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 100,
    "name": "Karn Sharma",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 29,
      "runs": 92,
      "wickets": 38,
      "strikeRate": 79.3,
      "economy": 8.5
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 101,
    "name": "Sai Sudharsan",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 41,
      "runs": 1261,
      "wickets": 0,
      "strikeRate": 140.7,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 102,
    "name": "Nehal Wadhera",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 29,
      "runs": 193,
      "wickets": 0,
      "strikeRate": 135.5,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 103,
    "name": "Ayush Badoni",
    "role": "Batsman",
    "basePrice": 1,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 36,
      "runs": 121,
      "wickets": 1,
      "strikeRate": 143.6,
      "economy": 0
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 104,
    "name": "Shahbaz Ahmed",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 51,
      "runs": 1418,
      "wickets": 16,
      "strikeRate": 133.7,
      "economy": 9.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 105,
    "name": "Mahipal Lomror",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 15,
      "runs": 788,
      "wickets": 38,
      "strikeRate": 129.3,
      "economy": 10.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 106,
    "name": "Suyash Sharma",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 50,
      "runs": 82,
      "wickets": 22,
      "strikeRate": 83,
      "economy": 8.3
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 107,
    "name": "Umran Malik",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 54,
      "runs": 64,
      "wickets": 5,
      "strikeRate": 80.5,
      "economy": 7.7
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 108,
    "name": "Kartik Tyagi",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 18,
      "runs": 50,
      "wickets": 42,
      "strikeRate": 89.6,
      "economy": 9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 109,
    "name": "Akash Deep",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 52,
      "runs": 2,
      "wickets": 6,
      "strikeRate": 69.7,
      "economy": 8.9
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 110,
    "name": "Mukesh Choudhary",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": {
      "matches": 40,
      "runs": 8,
      "wickets": 25,
      "strikeRate": 81.4,
      "economy": 8.8
    },
    "status": "available",
    "soldPrice": 0,
    "soldTo": null
  },
  {
    "id": 111,
    "name": "Devon Conway",
    "role": "Wicketkeeper",
    "basePrice": 2,
    "rating": 91,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 65, "runs": 2150, "wickets": 0, "strikeRate": 135.2, "economy": 0 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 112,
    "name": "Daryl Mitchell",
    "role": "All-rounder",
    "basePrice": 1.5,
    "rating": 89,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 58, "runs": 1450, "wickets": 12, "strikeRate": 138.5, "economy": 8.5 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 113,
    "name": "Rachin Ravindra",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 88,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 22, "runs": 650, "wickets": 18, "strikeRate": 142.1, "economy": 7.8 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 114,
    "name": "Ajinkya Rahane",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 84,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 158, "runs": 4400, "wickets": 1, "strikeRate": 123.4, "economy": 0 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 115,
    "name": "Ambati Rayudu",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 188, "runs": 4329, "wickets": 0, "strikeRate": 127.5, "economy": 0 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 116,
    "name": "Rahmanullah Gurbaz",
    "role": "Wicketkeeper",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 45, "runs": 1250, "wickets": 0, "strikeRate": 142.8, "economy": 0 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 117,
    "name": "Noor Ahmad",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 87,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 32, "runs": 45, "wickets": 42, "strikeRate": 85.4, "economy": 7.2 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 118,
    "name": "Sai Kishore",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 25, "runs": 65, "wickets": 28, "strikeRate": 92.4, "economy": 7.4 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 119,
    "name": "Abhinav Manohar",
    "role": "Batsman",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 18, "runs": 380, "wickets": 0, "strikeRate": 145.2, "economy": 0 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 120,
    "name": "Kyle Mayers",
    "role": "All-rounder",
    "basePrice": 1,
    "rating": 86,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 35, "runs": 850, "wickets": 12, "strikeRate": 155.6, "economy": 8.9 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 121,
    "name": "Romario Shepherd",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 83,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 28, "runs": 350, "wickets": 24, "strikeRate": 165.4, "economy": 9.2 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 122,
    "name": "Alzarri Joseph",
    "role": "Bowler",
    "basePrice": 1,
    "rating": 85,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 42, "runs": 85, "wickets": 48, "strikeRate": 95.2, "economy": 8.8 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 123,
    "name": "Shivam Mavi",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 32, "runs": 120, "wickets": 33, "strikeRate": 120.4, "economy": 8.5 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 124,
    "name": "Kamlesh Nagarkoti",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 15, "runs": 45, "wickets": 12, "strikeRate": 115.2, "economy": 8.9 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 125,
    "name": "Arjun Tendulkar",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 75,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 4, "runs": 15, "wickets": 3, "strikeRate": 85.2, "economy": 9.5 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 126,
    "name": "Hrithik Shokeen",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 79,
    "image": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 12, "runs": 110, "wickets": 5, "strikeRate": 118.4, "economy": 8.3 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 127,
    "name": "Ramandeep Singh",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 80,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 10, "runs": 95, "wickets": 6, "strikeRate": 125.2, "economy": 8.2 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 128,
    "name": "Anukul Roy",
    "role": "All-rounder",
    "basePrice": 0.5,
    "rating": 81,
    "image": "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 18, "runs": 145, "wickets": 12, "strikeRate": 128.4, "economy": 7.8 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 129,
    "name": "Vaibhav Arora",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 82,
    "image": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 14, "runs": 10, "wickets": 15, "strikeRate": 82.4, "economy": 8.9 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 130,
    "name": "Kulwant Khejroliya",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 78,
    "image": "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 9, "runs": 5, "wickets": 8, "strikeRate": 78.4, "economy": 9.2 },
    "status": "available", "soldPrice": 0, "soldTo": null
  },
  {
    "id": 131,
    "name": "Yudhvir Singh Charak",
    "role": "Bowler",
    "basePrice": 0.5,
    "rating": 77,
    "image": "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
    "stats": { "matches": 6, "runs": 20, "wickets": 5, "strikeRate": 95.2, "economy": 8.7 },
    "status": "available", "soldPrice": 0, "soldTo": null
  }
];

export default playersData;
