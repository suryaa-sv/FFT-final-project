const bcrypt = require('bcryptjs');
const { db, calculatePerformanceScore, classifyPerformance } = require('./db');

function seedDatabase() {
  console.log('Seeding CricketX Database...');

  // 1. Clear existing data
  db.exec(`
    DELETE FROM match_history;
    DELETE FROM fielding_stats;
    DELETE FROM bowling_stats;
    DELETE FROM batting_stats;
    DELETE FROM players;
    DELETE FROM teams;
    DELETE FROM admins;
  `);

  // 2. Insert Admin Account
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Admin@CricketX2025', salt);
  const insertAdmin = db.prepare(`
    INSERT INTO admins (username, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `);
  insertAdmin.run('admin', passwordHash, 'CricketX Master Analyst', 'Super Administrator');
  console.log('✔ Admin account seeded (admin / Admin@CricketX2025)');

  // 3. Insert Teams
  const teamsData = [
    { name: 'Chennai Super Kings', short_name: 'CSK', code: 'CSK', primary_color: '#f59e0b', secondary_color: '#005fa2', city: 'Chennai', championships: 5, home_ground: 'M. A. Chidambaram Stadium', coach: 'Stephen Fleming' },
    { name: 'Mumbai Indians', short_name: 'MI', code: 'MI', primary_color: '#004ba0', secondary_color: '#d1ab3e', city: 'Mumbai', championships: 5, home_ground: 'Wankhede Stadium', coach: 'Mark Boucher' },
    { name: 'Royal Challengers Bengaluru', short_name: 'RCB', code: 'RCB', primary_color: '#d32f2f', secondary_color: '#0f172a', city: 'Bengaluru', championships: 0, home_ground: 'M. Chinnaswamy Stadium', coach: 'Andy Flower' },
    { name: 'Kolkata Knight Riders', short_name: 'KKR', code: 'KKR', primary_color: '#3a225d', secondary_color: '#b3995d', city: 'Kolkata', championships: 3, home_ground: 'Eden Gardens', coach: 'Chandrakant Pandit' },
    { name: 'Gujarat Titans', short_name: 'GT', code: 'GT', primary_color: '#1b2133', secondary_color: '#e5b95a', city: 'Ahmedabad', championships: 1, home_ground: 'Narendra Modi Stadium', coach: 'Ashish Nehra' },
    { name: 'Rajasthan Royals', short_name: 'RR', code: 'RR', primary_color: '#e61975', secondary_color: '#254aa5', city: 'Jaipur', championships: 1, home_ground: 'Sawai Mansingh Stadium', coach: 'Kumar Sangakkara' },
    { name: 'Sunrisers Hyderabad', short_name: 'SRH', code: 'SRH', primary_color: '#f26522', secondary_color: '#1a1a1a', city: 'Hyderabad', championships: 1, home_ground: 'Rajiv Gandhi Intl Stadium', coach: 'Daniel Vettori' },
    { name: 'Delhi Capitals', short_name: 'DC', code: 'DC', primary_color: '#172b4d', secondary_color: '#d71920', city: 'Delhi', championships: 0, home_ground: 'Arun Jaitley Stadium', coach: 'Ricky Ponting' }
  ];

  const insertTeam = db.prepare(`
    INSERT INTO teams (name, short_name, code, primary_color, secondary_color, city, championships, home_ground, coach)
    VALUES (@name, @short_name, @code, @primary_color, @secondary_color, @city, @championships, @home_ground, @coach)
  `);

  const teamIds = {};
  for (const team of teamsData) {
    const res = insertTeam.run(team);
    teamIds[team.code] = res.lastInsertRowid;
  }
  console.log(`✔ ${teamsData.length} Teams seeded`);

  // 4. Seed Players
  // The exact formula: (Batting × 40%) + (Bowling × 25%) + (Fielding × 20%) + (Fitness × 15%)
  const rawPlayers = [
    {
      name: 'MS Dhoni',
      teamCode: 'CSK',
      country: 'India',
      role: 'Wicketkeeper',
      jersey_number: 7,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium (occasional)',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 91,
      bowling_score: 25,
      fielding_score: 97,
      fitness_score: 90,
      notes: 'Legendary finisher and captain. World-class glove work behind stumps.',
      batting: { matches: 250, innings: 218, runs: 5082, balls_faced: 3740, not_outs: 87, highest_score: '84*', batting_average: 38.79, strike_rate: 135.92, hundreds: 0, fifties: 24, fours: 349, sixes: 239 },
      bowling: { matches: 250, overs: 2.0, maidens: 0, runs_conceded: 17, wickets: 1, bowling_average: 17.0, economy_rate: 8.50, bowling_strike_rate: 12.0, best_bowling_figures: '1/14', five_wicket_hauls: 0 },
      fielding: { catches: 142, run_outs: 24, stumpings: 42 }
    },
    {
      name: 'Virat Kohli',
      teamCode: 'RCB',
      country: 'India',
      role: 'Batsman',
      jersey_number: 18,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 98,
      bowling_score: 30,
      fielding_score: 93,
      fitness_score: 99,
      notes: 'Master chase-builder with unmatched consistency and supreme fitness standards.',
      batting: { matches: 252, innings: 244, runs: 8004, balls_faced: 6060, not_outs: 36, highest_score: '113', batting_average: 38.48, strike_rate: 132.07, hundreds: 8, fifties: 55, fours: 705, sixes: 272 },
      bowling: { matches: 252, overs: 41.5, maidens: 0, runs_conceded: 368, wickets: 4, bowling_average: 92.0, economy_rate: 8.80, bowling_strike_rate: 62.7, best_bowling_figures: '2/25', five_wicket_hauls: 0 },
      fielding: { catches: 114, run_outs: 19, stumpings: 0 }
    },
    {
      name: 'Ravindra Jadeja',
      teamCode: 'CSK',
      country: 'India',
      role: 'All-Rounder',
      jersey_number: 8,
      batting_style: 'Left-hand bat',
      bowling_style: 'Slow left-arm orthodox',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 87,
      bowling_score: 92,
      fielding_score: 99,
      fitness_score: 94,
      notes: 'Premier 3-dimensional all-rounder with lethal arm-speed and tight bowling lines.',
      batting: { matches: 240, innings: 182, runs: 2959, balls_faced: 2280, not_outs: 74, highest_score: '62*', batting_average: 27.40, strike_rate: 129.78, hundreds: 0, fifties: 3, fours: 206, sixes: 102 },
      bowling: { matches: 240, overs: 620.4, maidens: 4, runs_conceded: 4725, wickets: 160, bowling_average: 29.53, economy_rate: 7.61, bowling_strike_rate: 23.2, best_bowling_figures: '5/16', five_wicket_hauls: 1 },
      fielding: { catches: 104, run_outs: 25, stumpings: 0 }
    },
    {
      name: 'Jasprit Bumrah',
      teamCode: 'MI',
      country: 'India',
      role: 'Bowler',
      jersey_number: 93,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm fast',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 32,
      bowling_score: 99,
      fielding_score: 82,
      fitness_score: 92,
      notes: 'Generational pace ace with pin-point yorkers and devastating variations.',
      batting: { matches: 133, innings: 28, runs: 69, balls_faced: 67, not_outs: 19, highest_score: '16*', batting_average: 7.66, strike_rate: 102.98, hundreds: 0, fifties: 0, fours: 5, sixes: 1 },
      bowling: { matches: 133, overs: 512.3, maidens: 9, runs_conceded: 3740, wickets: 165, bowling_average: 22.66, economy_rate: 7.30, bowling_strike_rate: 18.6, best_bowling_figures: '5/10', five_wicket_hauls: 2 },
      fielding: { catches: 27, run_outs: 6, stumpings: 0 }
    },
    {
      name: 'Rohit Sharma',
      teamCode: 'MI',
      country: 'India',
      role: 'Batsman',
      jersey_number: 45,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 95,
      bowling_score: 45,
      fielding_score: 86,
      fitness_score: 84,
      notes: 'Hitman with sublime timing, record six-hitting ability, and tactical pedigree.',
      batting: { matches: 257, innings: 252, runs: 6628, balls_faced: 5055, not_outs: 28, highest_score: '109*', batting_average: 29.58, strike_rate: 131.14, hundreds: 2, fifties: 43, fours: 599, sixes: 280 },
      bowling: { matches: 257, overs: 52.3, maidens: 0, runs_conceded: 421, wickets: 15, bowling_average: 28.06, economy_rate: 8.01, bowling_strike_rate: 21.0, best_bowling_figures: '4/6', five_wicket_hauls: 0 },
      fielding: { catches: 101, run_outs: 12, stumpings: 0 }
    },
    {
      name: 'Ruturaj Gaikwad',
      teamCode: 'CSK',
      country: 'India',
      role: 'Batsman',
      jersey_number: 31,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 93,
      bowling_score: 20,
      fielding_score: 88,
      fitness_score: 91,
      notes: 'Elegant strokeplay with strong opening anchor temperament.',
      batting: { matches: 66, innings: 65, runs: 2380, balls_faced: 1740, not_outs: 9, highest_score: '108*', batting_average: 42.50, strike_rate: 136.78, hundreds: 2, fifties: 18, fours: 226, sixes: 89 },
      bowling: { matches: 66, overs: 1.0, maidens: 0, runs_conceded: 12, wickets: 0, bowling_average: 0, economy_rate: 12.00, bowling_strike_rate: 0, best_bowling_figures: '0/12', five_wicket_hauls: 0 },
      fielding: { catches: 36, run_outs: 4, stumpings: 0 }
    },
    {
      name: 'Suryakumar Yadav',
      teamCode: 'MI',
      country: 'India',
      role: 'Batsman',
      jersey_number: 63,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 97,
      bowling_score: 25,
      fielding_score: 92,
      fitness_score: 92,
      notes: '360-degree innovation with unmatched scoring range behind square.',
      batting: { matches: 150, innings: 135, runs: 3594, balls_faced: 2470, not_outs: 20, highest_score: '103*', batting_average: 31.25, strike_rate: 145.50, hundreds: 2, fifties: 24, fours: 377, sixes: 130 },
      bowling: { matches: 150, overs: 2.0, maidens: 0, runs_conceded: 16, wickets: 0, bowling_average: 0, economy_rate: 8.00, bowling_strike_rate: 0, best_bowling_figures: '0/16', five_wicket_hauls: 0 },
      fielding: { catches: 68, run_outs: 9, stumpings: 0 }
    },
    {
      name: 'Shubman Gill',
      teamCode: 'GT',
      country: 'India',
      role: 'Batsman',
      jersey_number: 77,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 94,
      bowling_score: 22,
      fielding_score: 89,
      fitness_score: 94,
      notes: 'Classical technique combined with explosive boundary acceleration.',
      batting: { matches: 103, innings: 100, runs: 3216, balls_faced: 2368, not_outs: 14, highest_score: '129', batting_average: 37.39, strike_rate: 135.81, hundreds: 4, fifties: 20, fours: 308, sixes: 98 },
      bowling: { matches: 103, overs: 0, maidens: 0, runs_conceded: 0, wickets: 0, bowling_average: 0, economy_rate: 0, bowling_strike_rate: 0, best_bowling_figures: 'N/A', five_wicket_hauls: 0 },
      fielding: { catches: 41, run_outs: 5, stumpings: 0 }
    },
    {
      name: 'Rashid Khan',
      teamCode: 'GT',
      country: 'Afghanistan',
      role: 'All-Rounder',
      jersey_number: 19,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm leg break / Googly',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 74,
      bowling_score: 98,
      fielding_score: 91,
      fitness_score: 95,
      notes: 'World-renowned mystery leg spinner with high-impact death batting cameos.',
      batting: { matches: 121, innings: 64, runs: 543, balls_faced: 350, not_outs: 22, highest_score: '79*', batting_average: 12.92, strike_rate: 155.14, hundreds: 0, fifties: 1, fours: 36, sixes: 38 },
      bowling: { matches: 121, overs: 476.0, maidens: 6, runs_conceded: 3245, wickets: 149, bowling_average: 21.77, economy_rate: 6.81, bowling_strike_rate: 19.1, best_bowling_figures: '4/24', five_wicket_hauls: 0 },
      fielding: { catches: 48, run_outs: 11, stumpings: 0 }
    },
    {
      name: 'Heinrich Klaasen',
      teamCode: 'SRH',
      country: 'South Africa',
      role: 'Wicketkeeper',
      jersey_number: 4,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 95,
      bowling_score: 15,
      fielding_score: 89,
      fitness_score: 90,
      notes: 'Most feared spin destroyer in modern white-ball cricket with colossal power hitting.',
      batting: { matches: 35, innings: 33, runs: 993, balls_faced: 588, not_outs: 8, highest_score: '104', batting_average: 39.72, strike_rate: 168.87, hundreds: 1, fifties: 6, fours: 67, sixes: 65 },
      bowling: { matches: 35, overs: 0, maidens: 0, runs_conceded: 0, wickets: 0, bowling_average: 0, economy_rate: 0, bowling_strike_rate: 0, best_bowling_figures: 'N/A', five_wicket_hauls: 0 },
      fielding: { catches: 22, run_outs: 3, stumpings: 6 }
    },
    {
      name: 'Hardik Pandya',
      teamCode: 'MI',
      country: 'India',
      role: 'All-Rounder',
      jersey_number: 33,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm fast-medium',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 86,
      bowling_score: 84,
      fielding_score: 88,
      fitness_score: 89,
      notes: 'Dynamic seam-bowling all-rounder who balances team equilibrium.',
      batting: { matches: 137, innings: 128, runs: 2525, balls_faced: 1731, not_outs: 39, highest_score: '91', batting_average: 28.37, strike_rate: 145.86, hundreds: 0, fifties: 10, fours: 190, sixes: 139 },
      bowling: { matches: 137, overs: 295.1, maidens: 1, runs_conceded: 2630, wickets: 64, bowling_average: 41.09, economy_rate: 8.91, bowling_strike_rate: 27.6, best_bowling_figures: '3/17', five_wicket_hauls: 0 },
      fielding: { catches: 68, run_outs: 12, stumpings: 0 }
    },
    {
      name: 'Pat Cummins',
      teamCode: 'SRH',
      country: 'Australia',
      role: 'Bowler',
      jersey_number: 30,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm fast',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 68,
      bowling_score: 95,
      fielding_score: 88,
      fitness_score: 96,
      notes: 'World Cup winning captain with lethal hard-length bowling and handy blitz hitting.',
      batting: { matches: 58, innings: 41, runs: 515, balls_faced: 350, not_outs: 15, highest_score: '56*', batting_average: 19.80, strike_rate: 147.14, hundreds: 0, fifties: 2, fours: 38, sixes: 34 },
      bowling: { matches: 58, overs: 218.4, maidens: 2, runs_conceded: 1880, wickets: 63, bowling_average: 29.84, economy_rate: 8.59, bowling_strike_rate: 20.8, best_bowling_figures: '4/34', five_wicket_hauls: 0 },
      fielding: { catches: 22, run_outs: 5, stumpings: 0 }
    },
    {
      name: 'Mitchell Starc',
      teamCode: 'KKR',
      country: 'Australia',
      role: 'Bowler',
      jersey_number: 56,
      batting_style: 'Left-hand bat',
      bowling_style: 'Left-arm fast',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 45,
      bowling_score: 96,
      fielding_score: 80,
      fitness_score: 93,
      notes: 'Fiery left-arm thunderbolts capable of cleaning up top orders and swinging new ball.',
      batting: { matches: 41, innings: 17, runs: 121, balls_faced: 110, not_outs: 8, highest_score: '29', batting_average: 13.44, strike_rate: 110.0, hundreds: 0, fifties: 0, fours: 8, sixes: 4 },
      bowling: { matches: 41, overs: 154.2, maidens: 3, runs_conceded: 1250, wickets: 51, bowling_average: 24.50, economy_rate: 8.09, bowling_strike_rate: 18.1, best_bowling_figures: '4/15', five_wicket_hauls: 0 },
      fielding: { catches: 14, run_outs: 3, stumpings: 0 }
    },
    {
      name: 'Rishabh Pant',
      teamCode: 'DC',
      country: 'India',
      role: 'Wicketkeeper',
      jersey_number: 17,
      batting_style: 'Left-hand bat',
      bowling_style: 'Right-arm medium (occasional)',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 92,
      bowling_score: 10,
      fielding_score: 91,
      fitness_score: 89,
      notes: 'Fearless match-winner with unconventional range and lightning stumpings.',
      batting: { matches: 111, innings: 110, runs: 3284, balls_faced: 2217, not_outs: 18, highest_score: '128*', batting_average: 35.69, strike_rate: 148.12, hundreds: 1, fifties: 18, fours: 295, sixes: 154 },
      bowling: { matches: 111, overs: 0, maidens: 0, runs_conceded: 0, wickets: 0, bowling_average: 0, economy_rate: 0, bowling_strike_rate: 0, best_bowling_figures: 'N/A', five_wicket_hauls: 0 },
      fielding: { catches: 75, run_outs: 14, stumpings: 23 }
    },
    {
      name: 'Travis Head',
      teamCode: 'SRH',
      country: 'Australia',
      role: 'Batsman',
      jersey_number: 62,
      batting_style: 'Left-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 96,
      bowling_score: 40,
      fielding_score: 87,
      fitness_score: 92,
      notes: 'Explosive powerplay decimator with blistering intent and fearless boundary hitting.',
      batting: { matches: 25, innings: 25, runs: 852, balls_faced: 468, not_outs: 3, highest_score: '102', batting_average: 38.72, strike_rate: 182.05, hundreds: 1, fifties: 5, fours: 94, sixes: 45 },
      bowling: { matches: 25, overs: 14.0, maidens: 0, runs_conceded: 122, wickets: 4, bowling_average: 30.50, economy_rate: 8.71, bowling_strike_rate: 21.0, best_bowling_figures: '2/16', five_wicket_hauls: 0 },
      fielding: { catches: 14, run_outs: 2, stumpings: 0 }
    },
    {
      name: 'Trent Boult',
      teamCode: 'RR',
      country: 'New Zealand',
      role: 'Bowler',
      jersey_number: 18,
      batting_style: 'Right-hand bat',
      bowling_style: 'Left-arm fast-medium',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 28,
      bowling_score: 95,
      fielding_score: 85,
      fitness_score: 92,
      notes: 'First-over strike specialist whose vicious inswing rips through opposing top orders.',
      batting: { matches: 104, innings: 29, runs: 82, balls_faced: 98, not_outs: 16, highest_score: '17', batting_average: 6.30, strike_rate: 83.67, hundreds: 0, fifties: 0, fours: 7, sixes: 2 },
      bowling: { matches: 104, overs: 395.2, maidens: 11, runs_conceded: 3260, wickets: 121, bowling_average: 26.94, economy_rate: 8.24, bowling_strike_rate: 19.6, best_bowling_figures: '4/18', five_wicket_hauls: 0 },
      fielding: { catches: 29, run_outs: 4, stumpings: 0 }
    },
    {
      name: 'Kuldeep Yadav',
      teamCode: 'DC',
      country: 'India',
      role: 'Bowler',
      jersey_number: 23,
      batting_style: 'Left-hand bat',
      bowling_style: 'Left-arm wrist spin',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 35,
      bowling_score: 94,
      fielding_score: 81,
      fitness_score: 88,
      notes: 'Rare left-arm wrist spin with deceptive variations, sharp turn, and high strike rate.',
      batting: { matches: 84, innings: 28, runs: 122, balls_faced: 135, not_outs: 14, highest_score: '16', batting_average: 8.71, strike_rate: 90.37, hundreds: 0, fifties: 0, fours: 10, sixes: 1 },
      bowling: { matches: 84, overs: 300.1, maidens: 3, runs_conceded: 2420, wickets: 87, bowling_average: 27.81, economy_rate: 8.06, bowling_strike_rate: 20.7, best_bowling_figures: '4/14', five_wicket_hauls: 0 },
      fielding: { catches: 19, run_outs: 3, stumpings: 0 }
    },
    {
      name: 'Sanju Samson',
      teamCode: 'RR',
      country: 'India',
      role: 'Wicketkeeper',
      jersey_number: 11,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium (occasional)',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      batting_score: 93,
      bowling_score: 10,
      fielding_score: 90,
      fitness_score: 91,
      notes: 'Pure timing, effortless maximums, and high-impact middle-order aggression.',
      batting: { matches: 167, innings: 163, runs: 4419, balls_faced: 3179, not_outs: 19, highest_score: '119', batting_average: 30.68, strike_rate: 139.0, hundreds: 3, fifties: 25, fours: 352, sixes: 206 },
      bowling: { matches: 167, overs: 0, maidens: 0, runs_conceded: 0, wickets: 0, bowling_average: 0, economy_rate: 0, bowling_strike_rate: 0, best_bowling_figures: 'N/A', five_wicket_hauls: 0 },
      fielding: { catches: 82, run_outs: 11, stumpings: 16 }
    },
    // Seed 2 Pending Player Records to demonstrate Admin Approval Workflow right out of the box!
    {
      name: 'Aarav Deshmukh',
      teamCode: 'CSK',
      country: 'India',
      role: 'All-Rounder',
      jersey_number: 22,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm fast-medium',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'pending',
      batting_score: 76,
      bowling_score: 72,
      fielding_score: 80,
      fitness_score: 85,
      notes: 'State junior championship breakthrough talent seeking official verification.',
      batting: { matches: 12, innings: 11, runs: 285, balls_faced: 210, not_outs: 3, highest_score: '68*', batting_average: 35.62, strike_rate: 135.71, hundreds: 0, fifties: 2, fours: 24, sixes: 10 },
      bowling: { matches: 12, overs: 38.0, maidens: 1, runs_conceded: 295, wickets: 14, bowling_average: 21.07, economy_rate: 7.76, bowling_strike_rate: 16.2, best_bowling_figures: '3/22', five_wicket_hauls: 0 },
      fielding: { catches: 8, run_outs: 2, stumpings: 0 }
    },
    {
      name: 'Rohan Varma',
      teamCode: 'MI',
      country: 'India',
      role: 'Bowler',
      jersey_number: 49,
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm off break',
      career_status: 'Active',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      verification_status: 'pending',
      batting_score: 30,
      bowling_score: 82,
      fielding_score: 75,
      fitness_score: 80,
      notes: 'Varsity spin prospect submitted for academy performance indexing.',
      batting: { matches: 10, innings: 5, runs: 28, balls_faced: 35, not_outs: 2, highest_score: '12', batting_average: 9.33, strike_rate: 80.0, hundreds: 0, fifties: 0, fours: 2, sixes: 0 },
      bowling: { matches: 10, overs: 36.0, maidens: 2, runs_conceded: 250, wickets: 15, bowling_average: 16.66, economy_rate: 6.94, bowling_strike_rate: 14.4, best_bowling_figures: '4/21', five_wicket_hauls: 0 },
      fielding: { catches: 4, run_outs: 1, stumpings: 0 }
    }
  ];

  const insertPlayer = db.prepare(`
    INSERT INTO players (
      name, team_id, country, role, jersey_number, batting_style, bowling_style,
      career_status, photo_url, verification_status, batting_score, bowling_score,
      fielding_score, fitness_score, performance_score, category, notes
    ) VALUES (
      @name, @team_id, @country, @role, @jersey_number, @batting_style, @bowling_style,
      @career_status, @photo_url, @verification_status, @batting_score, @bowling_score,
      @fielding_score, @fitness_score, @performance_score, @category, @notes
    )
  `);

  const insertBatting = db.prepare(`
    INSERT INTO batting_stats (
      player_id, matches, innings, runs, balls_faced, not_outs, highest_score,
      batting_average, strike_rate, hundreds, fifties, fours, sixes
    ) VALUES (
      @player_id, @matches, @innings, @runs, @balls_faced, @not_outs, @highest_score,
      @batting_average, @strike_rate, @hundreds, @fifties, @fours, @sixes
    )
  `);

  const insertBowling = db.prepare(`
    INSERT INTO bowling_stats (
      player_id, matches, overs, maidens, runs_conceded, wickets,
      bowling_average, economy_rate, bowling_strike_rate, best_bowling_figures, five_wicket_hauls
    ) VALUES (
      @player_id, @matches, @overs, @maidens, @runs_conceded, @wickets,
      @bowling_average, @economy_rate, @bowling_strike_rate, @best_bowling_figures, @five_wicket_hauls
    )
  `);

  const insertFielding = db.prepare(`
    INSERT INTO fielding_stats (player_id, catches, run_outs, stumpings)
    VALUES (@player_id, @catches, @run_outs, @stumpings)
  `);

  const insertMatch = db.prepare(`
    INSERT INTO match_history (
      player_id, match_date, opponent, competition, runs, balls_faced, wickets, overs, catches, match_score
    ) VALUES (
      @player_id, @match_date, @opponent, @competition, @runs, @balls_faced, @wickets, @overs, @catches, @match_score
    )
  `);

  const opponents = ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Gujarat Titans', 'Royal Challengers Bengaluru', 'Delhi Capitals'];
  const competitions = ['IPL 2024', 'T20 World Cup', 'Champions Trophy', 'Premier League'];

  for (const p of rawPlayers) {
    const score = calculatePerformanceScore(p.batting_score, p.bowling_score, p.fielding_score, p.fitness_score);
    const category = classifyPerformance(score);
    const team_id = teamIds[p.teamCode] || null;

    const res = insertPlayer.run({
      name: p.name,
      team_id,
      country: p.country,
      role: p.role,
      jersey_number: p.jersey_number,
      batting_style: p.batting_style,
      bowling_style: p.bowling_style,
      career_status: p.career_status,
      photo_url: p.photo_url,
      verification_status: p.verification_status,
      batting_score: p.batting_score,
      bowling_score: p.bowling_score,
      fielding_score: p.fielding_score,
      fitness_score: p.fitness_score,
      performance_score: score,
      category,
      notes: p.notes
    });

    const playerId = res.lastInsertRowid;

    // Batting stats
    insertBatting.run({
      player_id: playerId,
      ...p.batting
    });

    // Bowling stats
    insertBowling.run({
      player_id: playerId,
      ...p.bowling
    });

    // Fielding stats
    insertFielding.run({
      player_id: playerId,
      ...p.fielding
    });

    // Seed 6 realistic match history logs for trends chart
    for (let m = 1; m <= 6; m++) {
      let mRuns = 0;
      let mBalls = 0;
      let mWickets = 0;
      let mOvers = 0;
      let mCatches = Math.random() > 0.6 ? 1 : 0;

      if (p.role === 'Batsman' || p.role === 'Wicketkeeper') {
        mRuns = Math.floor(Math.random() * 65) + 15;
        mBalls = Math.floor(mRuns * 0.75) + 5;
      } else if (p.role === 'All-Rounder') {
        mRuns = Math.floor(Math.random() * 45) + 10;
        mBalls = Math.floor(mRuns * 0.8) + 4;
        mWickets = Math.floor(Math.random() * 3);
        mOvers = 4.0;
      } else if (p.role === 'Bowler') {
        mRuns = Math.floor(Math.random() * 12);
        mBalls = Math.floor(mRuns * 0.9);
        mWickets = Math.floor(Math.random() * 4) + (m % 2 === 0 ? 1 : 0);
        mOvers = 4.0;
      }

      const matchPerf = parseFloat(((mRuns * 0.6) + (mWickets * 18) + (mCatches * 10) + 20).toFixed(1));

      insertMatch.run({
        player_id: playerId,
        match_date: `2024-05-${10 + m}`,
        opponent: opponents[m % opponents.length],
        competition: competitions[m % competitions.length],
        runs: mRuns,
        balls_faced: mBalls,
        wickets: mWickets,
        overs: mOvers,
        catches: mCatches,
        match_score: matchPerf
      });
    }
  }

  console.log(`✔ ${rawPlayers.length} Players seeded with stats, fielding, and match history!`);
  console.log('Database seeded successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
