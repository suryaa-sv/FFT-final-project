const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cricketx.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and reliability
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Formula: (Batting × 40%) + (Bowling × 25%) + (Fielding × 20%) + (Fitness × 15%)
function calculatePerformanceScore(batting, bowling, fielding, fitness) {
  const b = parseFloat(batting) || 0;
  const bo = parseFloat(bowling) || 0;
  const f = parseFloat(fielding) || 0;
  const fit = parseFloat(fitness) || 0;

  const score = (b * 0.40) + (bo * 0.25) + (f * 0.20) + (fit * 0.15);
  return parseFloat(score.toFixed(2));
}

function classifyPerformance(score) {
  const num = parseFloat(score);
  if (num >= 85) return 'Excellent';
  if (num >= 70) return 'Good';
  if (num >= 50) return 'Average';
  return 'Needs Improvement';
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Administrator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      short_name TEXT NOT NULL,
      code TEXT NOT NULL,
      primary_color TEXT DEFAULT '#059669',
      secondary_color TEXT DEFAULT '#f59e0b',
      city TEXT,
      championships INTEGER DEFAULT 0,
      home_ground TEXT,
      coach TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
      country TEXT NOT NULL,
      role TEXT NOT NULL, -- 'Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'
      jersey_number INTEGER,
      batting_style TEXT DEFAULT 'Right-hand bat',
      bowling_style TEXT DEFAULT 'Right-arm medium',
      career_status TEXT DEFAULT 'Active', -- 'Active', 'Retired'
      photo_url TEXT,
      verification_status TEXT DEFAULT 'verified', -- 'verified', 'pending', 'rejected'
      batting_score REAL NOT NULL,
      bowling_score REAL NOT NULL,
      fielding_score REAL NOT NULL,
      fitness_score REAL NOT NULL,
      performance_score REAL NOT NULL,
      category TEXT NOT NULL,
      submitted_by TEXT DEFAULT 'Official',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batting_stats (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      matches INTEGER DEFAULT 0,
      innings INTEGER DEFAULT 0,
      runs INTEGER DEFAULT 0,
      balls_faced INTEGER DEFAULT 0,
      not_outs INTEGER DEFAULT 0,
      highest_score TEXT DEFAULT '0',
      batting_average REAL DEFAULT 0,
      strike_rate REAL DEFAULT 0,
      hundreds INTEGER DEFAULT 0,
      fifties INTEGER DEFAULT 0,
      fours INTEGER DEFAULT 0,
      sixes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bowling_stats (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      matches INTEGER DEFAULT 0,
      overs REAL DEFAULT 0,
      maidens INTEGER DEFAULT 0,
      runs_conceded INTEGER DEFAULT 0,
      wickets INTEGER DEFAULT 0,
      bowling_average REAL DEFAULT 0,
      economy_rate REAL DEFAULT 0,
      bowling_strike_rate REAL DEFAULT 0,
      best_bowling_figures TEXT DEFAULT '0/0',
      five_wicket_hauls INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fielding_stats (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      catches INTEGER DEFAULT 0,
      run_outs INTEGER DEFAULT 0,
      stumpings INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
      match_date TEXT,
      opponent TEXT,
      competition TEXT,
      runs INTEGER DEFAULT 0,
      balls_faced INTEGER DEFAULT 0,
      wickets INTEGER DEFAULT 0,
      overs REAL DEFAULT 0,
      catches INTEGER DEFAULT 0,
      match_score REAL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);
    CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_players_score ON players(performance_score);
    CREATE INDEX IF NOT EXISTS idx_players_status ON players(verification_status);
  `);
}

initSchema();

module.exports = {
  db,
  calculatePerformanceScore,
  classifyPerformance,
  initSchema
};
