# CRICKETX — Professional Cricket Player Performance & Analytics Platform

> **Explore. Analyze. Compare. Dominate.**

CricketX is an enterprise-grade, fully functional, responsive cricket analytics website designed for coaches, captains, scouts, and cricket data analysts. Inspired by the professional presentation of ESPNcricinfo, Cricbuzz, and the Chennai Super Kings official digital ecosystem, CricketX blends dark navy aesthetics, cricket green accents, and championship gold highlights with mathematical performance modeling.

---

## 🧮 1. The Official CricketX Performance Formula

Every player's composite score is computed using the exact weighted algorithm:

$$\text{Performance Score} = (\text{Batting} \times 40\%) + (\text{Bowling} \times 25\%) + (\text{Fielding} \times 20\%) + (\text{Fitness} \times 15\%)$$

### Classification Standards
* **85 – 100** $\rightarrow$ **Excellent** (Gold Highlight)
* **70 – 84** $\rightarrow$ **Good** (Emerald Green)
* **50 – 69** $\rightarrow$ **Average** (Cyan / Blue)
* **Below 50** $\rightarrow$ **Needs Improvement** (Rose / Red)

---

## 🚀 2. Key Features & Page Breakdown

1. **Home / Overview Dashboard (`#/dashboard`)**
   * **Live KPI Counters**: Total Players, Total Teams, Verified Records, Pending Submissions, Highest Score, Average Score.
   * **Chart.js Visualizations**:
     * Performance Category Distribution (Bar histogram)
     * Players by Role Breakdown (Doughnut)
     * Team Performance Averages (Bar chart)
     * Batting vs Bowling Ratings (Comparative chart)
   * **Spotlight Carousels**: Top 5 Verified Players, Best Batsmen, Best Bowlers, Best All-Rounders, Best Wicketkeepers, and Recently Updated Records.

2. **Player Directory (`#/players`)**
   * Real-time search by player name, nationality, or franchise.
   * Multi-dimensional filtering by Team, Role (Batsman, Bowler, All-Rounder, Wicketkeeper), Category, and Minimum Performance Score range slider (0–100).
   * Sorting by Performance Score, Career Runs, Career Wickets, Batting Average, Strike Rate, Batting Rating, Bowling Rating, and Name.
   * Grid view and Table view toggle.

3. **Complete Player Profile Page (`#/player/:id`)**
   * High-impact profile header with jersey number, team badge, role badge, nationality, playing styles, and verification status.
   * Circular SVG Score Gauge with animated stroke offset.
   * Section A: Detailed Batting Statistics (Runs, Balls, HS, Avg, SR, 100s, 50s, 4s, 6s).
   * Section B: Detailed Bowling Statistics (Overs, Maidens, Runs, Wickets, Avg, Econ, Bowling SR, Best Figures, 5w).
   * Section C: Fielding Statistics (Catches, Stumpings, Run-outs).
   * Section D: 4-Factor Scoring Breakdown and weighted component progress bars.
   * Section E: Performance Trends Line Chart across recent fixtures.
   * Section F: Data-Driven Strengths & Tactical Weaknesses derived strictly from stored metrics.
   * Section G: Match History Log table.
   * Section H: Actions (Add to Compare, View Squad, Print/Export Summary).

4. **Head-to-Head Comparison Tool (`#/compare`)**
   * Compare 2, 3, or 4 players simultaneously.
   * Interactive multi-player Radar Chart evaluating Batting, Bowling, Fielding, Fitness, Current Form, and Match Impact.
   * Side-by-side metric matrix highlighting leading statistics in vibrant green.
   * Automated **CricketX Analytical Matchup Verdict**.

5. **Teams Directory & Squad Analytics (`#/teams`, `#/team/:id`)**
   * Franchise profiles (CSK, MI, RCB, KKR, GT, RR, SRH, DC) with championship trophy counts, coach, ground, and average squad ratings.
   * Complete squad breakdown and role distribution.

6. **Best Playing XI Recommendation Engine (`#/playing-xi`)**
   * Algorithmic team generator tailored to match pitch conditions (*Balanced*, *Batting Paradise*, *Green Seam / Bowling Priority*).
   * Automatically balances 1 Wicketkeeper, 4-5 Batsmen, 2 All-Rounders, and 3-4 Specialist Bowlers.
   * Designates Captain (👑) and Vice Captain (⭐) based on peak composite ratings.
   * Interactive visual cricket pitch diagram with lineup cards.

7. **Official Rankings Podium (`#/rankings`)**
   * Top 3 podium stages with Gold 🥇, Silver 🥈, and Bronze 🥉 medals.
   * Tabs for Overall, Top Batsmen, Top Bowlers, Top All-Rounders, and Top Wicketkeepers.

8. **Submit Player Record (`#/add-player`)**
   * Interactive form with real-time score preview that live-updates the performance score and category as the user adjusts scores.
   * Public submissions are marked as `pending` and sent to the Admin Verification Queue.

9. **Admin Operations Portal (`#/admin`)**
   * Secure admin authentication using JWT tokens and bcrypt password hashing.
   * **Pending Approvals Queue**: 1-click **Approve** (verifies and publishes record) or **Reject**.
   * **Manage All Players**: Search, edit complete scores/stats via modal, or delete players.
   * **Direct Add**: Create official verified players directly.
   * **Database Reset / Reseed**: 1-click restore to official demo dataset.

---

## 🛠️ 3. Technology Stack

* **Frontend**: HTML5, CSS3 (Custom Design System, Glassmorphism, Dark Navy theme), Vanilla JavaScript (Modular Single Page Application router), Chart.js (v4.4.2).
* **Backend**: Node.js, Express.js REST API.
* **Database**: Persistent SQLite (`better-sqlite3`) with foreign keys, cascading deletes, and WAL mode.
* **Security**: JWT authentication, bcryptjs password hashing, server-side input validation (0-100 score bounds, type checks).

---

## 🔑 4. Default Admin Credentials

* **Username**: `admin`
* **Password**: `Admin@CricketX2025`
*(An "Autofill Demo Credentials" button is also provided on the login page for convenience)*

---

## 💻 5. How to Run the Project in VS Code

### Prerequisites
* **Node.js** (v18+ or v20+) installed on your machine.

### Quick Start Instructions
1. Open the project folder in **VS Code**:
   ```bash
   cd "d:\fft project 1"
   ```

2. Start the CricketX server:
   ```bash
   npm start
   ```
   *(Or for live development: `npm run dev`)*

3. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

4. Run the automated test suite:
   ```bash
   npm test
   ```

5. (Optional) Re-seed the database at any time:
   ```bash
   npm run seed
   ```
