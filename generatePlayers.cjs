const fs = require('fs');

// We will hardcode 60 of the most popular IPL players across different franchises.
const popularPlayers = [
    { name: "Virat Kohli", role: "Batsman", rating: 95 },
    { name: "MS Dhoni", role: "Wicketkeeper", rating: 94 },
    { name: "Rohit Sharma", role: "Batsman", rating: 93 },
    { name: "Jasprit Bumrah", role: "Bowler", rating: 96 },
    { name: "Hardik Pandya", role: "All-rounder", rating: 92 },
    { name: "Suryakumar Yadav", role: "Batsman", rating: 94 },
    { name: "KL Rahul", role: "Wicketkeeper", rating: 90 },
    { name: "Rishabh Pant", role: "Wicketkeeper", rating: 91 },
    { name: "Shubman Gill", role: "Batsman", rating: 92 },
    { name: "Shreyas Iyer", role: "Batsman", rating: 89 },

    { name: "Ravindra Jadeja", role: "All-rounder", rating: 93 },
    { name: "Rashid Khan", role: "Bowler", rating: 95 },
    { name: "Jos Buttler", role: "Wicketkeeper", rating: 93 },
    { name: "Ben Stokes", role: "All-rounder", rating: 91 },
    { name: "David Warner", role: "Batsman", rating: 90 },
    { name: "Andre Russell", role: "All-rounder", rating: 92 },
    { name: "Glenn Maxwell", role: "All-rounder", rating: 90 },
    { name: "Sunil Narine", role: "All-rounder", rating: 92 },
    { name: "Trent Boult", role: "Bowler", rating: 91 },
    { name: "Kagiso Rabada", role: "Bowler", rating: 90 },

    { name: "Pat Cummins", role: "All-rounder", rating: 91 },
    { name: "Mitchell Starc", role: "Bowler", rating: 92 },
    { name: "Yuzvendra Chahal", role: "Bowler", rating: 89 },
    { name: "Kuldeep Yadav", role: "Bowler", rating: 90 },
    { name: "Mohammed Shami", role: "Bowler", rating: 91 },
    { name: "Mohammed Siraj", role: "Bowler", rating: 89 },
    { name: "R Ashwin", role: "All-rounder", rating: 89 },
    { name: "Ishan Kishan", role: "Wicketkeeper", rating: 88 },
    { name: "Sanju Samson", role: "Wicketkeeper", rating: 89 },
    { name: "Ruturaj Gaikwad", role: "Batsman", rating: 89 },

    { name: "Yashasvi Jaiswal", role: "Batsman", rating: 91 },
    { name: "Rinku Singh", role: "Batsman", rating: 88 },
    { name: "Quinton de Kock", role: "Wicketkeeper", rating: 89 },
    { name: "Faf du Plessis", role: "Batsman", rating: 89 },
    { name: "Marcus Stoinis", role: "All-rounder", rating: 88 },
    { name: "Nicholas Pooran", role: "Wicketkeeper", rating: 90 },
    { name: "Heinrich Klaasen", role: "Wicketkeeper", rating: 92 },
    { name: "Travis Head", role: "Batsman", rating: 93 },
    { name: "Cameron Green", role: "All-rounder", rating: 88 },
    { name: "Liam Livingstone", role: "All-rounder", rating: 88 },

    { name: "Sam Curran", role: "All-rounder", rating: 88 },
    { name: "Moeen Ali", role: "All-rounder", rating: 87 },
    { name: "Deepak Chahar", role: "Bowler", rating: 86 },
    { name: "Shardul Thakur", role: "All-rounder", rating: 85 },
    { name: "Axar Patel", role: "All-rounder", rating: 89 },
    { name: "Washington Sundar", role: "All-rounder", rating: 85 },
    { name: "Arshdeep Singh", role: "Bowler", rating: 88 },
    { name: "Tilak Varma", role: "Batsman", rating: 87 },
    { name: "Abhishek Sharma", role: "Batsman", rating: 88 },
    { name: "Matheesha Pathirana", role: "Bowler", rating: 89 },

    { name: "Rajat Patidar", role: "Batsman", rating: 86 },
    { name: "Shivam Dube", role: "All-rounder", rating: 87 },
    { name: "Rahul Tewatia", role: "All-rounder", rating: 85 },
    { name: "Mohit Sharma", role: "Bowler", rating: 86 },
    { name: "Bhuvneshwar Kumar", role: "Bowler", rating: 87 },
    { name: "Jason Holder", role: "All-rounder", rating: 84 },
    { name: "Tim David", role: "Batsman", rating: 86 },
    { name: "Phil Salt", role: "Wicketkeeper", rating: 88 },
    { name: "Wanindu Hasaranga", role: "All-rounder", rating: 88 },
    { name: "Aiden Markram", role: "Batsman", rating: 87 }
];

// Combine unique names
const playersData = [];
const usedNames = new Set();
let id = 1;

popularPlayers.forEach(p => {
    usedNames.add(p.name);

    // Generate realistic stats
    const stats = {
        matches: Math.floor(Math.random() * 80) + 70, // 70-150 matches for regulars
        runs: p.role !== 'Bowler' ? Math.floor(Math.random() * 3000) + 2000 : Math.floor(Math.random() * 300),
        wickets: p.role !== 'Batsman' && p.role !== 'Wicketkeeper' ? Math.floor(Math.random() * 80) + 40 : Math.floor(Math.random() * 5),
        strikeRate: p.role !== 'Bowler' ? +(Math.random() * 40 + 125).toFixed(1) : +(Math.random() * 30 + 70).toFixed(1),
        economy: p.role !== 'Batsman' && p.role !== 'Wicketkeeper' ? +(Math.random() * 2.5 + 6.5).toFixed(1) : 0
    };

    const imgs = [
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop"
    ];

    let basePrice = 2.0;
    if (p.rating < 92) basePrice = 1.5;
    if (p.rating <= 87) basePrice = 1.0;

    playersData.push({
        id: id++,
        name: p.name,
        role: p.role,
        basePrice: basePrice,
        rating: p.rating,
        image: imgs[Math.floor(Math.random() * imgs.length)],
        stats: stats,
        status: "available",
        soldPrice: 0,
        soldTo: null
    });
});

// Fill the rest up to 110 with common/fringe players
const additionalNames = [
    { name: "Prithvi Shaw", role: "Batsman" }, { name: "Manish Pandey", role: "Batsman" },
    { name: "Mayank Agarwal", role: "Batsman" }, { name: "Rahul Tripathi", role: "Batsman" },
    { name: "Devdutt Padikkal", role: "Batsman" }, { name: "Nitish Rana", role: "Batsman" },
    { name: "Venkatesh Iyer", role: "All-rounder" }, { name: "Deepak Hooda", role: "All-rounder" },
    { name: "Krunal Pandya", role: "All-rounder" }, { name: "Shahrukh Khan", role: "Batsman" },
    { name: "Abdul Samad", role: "Batsman" }, { name: "Riyan Parag", role: "All-rounder" },
    { name: "Tewatia", role: "All-rounder" }, { name: "Vijay Shankar", role: "All-rounder" },
    { name: "Jitesh Sharma", role: "Wicketkeeper" }, { name: "Dhruv Jurel", role: "Wicketkeeper" },
    { name: "Prabhsimran Singh", role: "Wicketkeeper" }, { name: "Anuj Rawat", role: "Wicketkeeper" },
    { name: "KS Bharat", role: "Wicketkeeper" }, { name: "Wriddhiman Saha", role: "Wicketkeeper" },
    { name: "Harshal Patel", role: "Bowler" }, { name: "Avesh Khan", role: "Bowler" },
    { name: "Prasiddh Krishna", role: "Bowler" }, { name: "Navdeep Saini", role: "Bowler" },
    { name: "Umesh Yadav", role: "Bowler" }, { name: "Ishant Sharma", role: "Bowler" },
    { name: "Sandeep Sharma", role: "Bowler" }, { name: "Khaleel Ahmed", role: "Bowler" },
    { name: "T Natarajan", role: "Bowler" }, { name: "Chetan Sakariya", role: "Bowler" },
    { name: "Mukesh Kumar", role: "Bowler" }, { name: "Yash Thakur", role: "Bowler" },
    { name: "Tushar Deshpande", role: "Bowler" }, { name: "Ravi Bishnoi", role: "Bowler" },
    { name: "Rahul Chahar", role: "Bowler" }, { name: "Varun Chakaravarthy", role: "Bowler" },
    { name: "Mayank Markande", role: "Bowler" }, { name: "Amit Mishra", role: "Bowler" },
    { name: "Piyush Chawla", role: "Bowler" }, { name: "Karn Sharma", role: "Bowler" },
    { name: "Sai Sudharsan", role: "Batsman" }, { name: "Nehal Wadhera", role: "Batsman" },
    { name: "Ayush Badoni", role: "Batsman" }, { name: "Shahbaz Ahmed", role: "All-rounder" },
    { name: "Mahipal Lomror", role: "All-rounder" }, { name: "Suyash Sharma", role: "Bowler" },
    { name: "Umran Malik", role: "Bowler" }, { name: "Kartik Tyagi", role: "Bowler" },
    { name: "Akash Deep", role: "Bowler" }, { name: "Mukesh Choudhary", role: "Bowler" }
];

additionalNames.forEach(p => {
    if (!usedNames.has(p.name)) {
        usedNames.add(p.name);

        const rating = Math.floor(Math.random() * 8) + 78; // 78 to 85
        let basePrice = 0.5;
        if (rating >= 83) basePrice = 1.0;

        const stats = {
            matches: Math.floor(Math.random() * 50) + 10,
            runs: p.role !== 'Bowler' ? Math.floor(Math.random() * 1500) + 100 : Math.floor(Math.random() * 100),
            wickets: p.role !== 'Batsman' && p.role !== 'Wicketkeeper' ? Math.floor(Math.random() * 40) + 5 : Math.floor(Math.random() * 3),
            strikeRate: p.role !== 'Bowler' ? +(Math.random() * 30 + 115).toFixed(1) : +(Math.random() * 30 + 60).toFixed(1),
            economy: p.role !== 'Batsman' && p.role !== 'Wicketkeeper' ? +(Math.random() * 3.5 + 7.5).toFixed(1) : 0
        };

        const imgs = [
            "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631193512748-9993bd39715b?q=80&w=200&auto=format&fit=crop"
        ];

        playersData.push({
            id: id++,
            name: p.name,
            role: p.role,
            basePrice: basePrice,
            rating: rating,
            image: imgs[Math.floor(Math.random() * imgs.length)],
            stats: stats,
            status: "available",
            soldPrice: 0,
            soldTo: null
        });
    }
});

const fileContent = `const playersData = ${JSON.stringify(playersData, null, 2)};\n\nexport default playersData;\n`;
fs.writeFileSync('src/data/playersData.js', fileContent);
console.log('Successfully generated 110 players with popular names and stats.');
