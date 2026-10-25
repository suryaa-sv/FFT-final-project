/* ==========================================================================
   CRICKETX — PLAYER COMPARISON MODULE
   Multi-player comparison, radar overlay, head-to-head metric matrix, verdict
   ========================================================================== */

const CompareView = (() => {
  let comparedPlayers = [];

  async function load(playerIds = []) {
    const container = document.getElementById('view-compare');
    if (!container) return;

    if (!playerIds || playerIds.length < 2) {
      // Default to 2 top players if none selected (e.g. Virat Kohli vs Rohit Sharma or Ruturaj)
      playerIds = App.getComparisonQueue();
      if (playerIds.length < 2) {
        playerIds = [2, 5]; // Default seeded IDs for demo
      }
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">⚔️</div>
        <p style="color: var(--text-secondary);">Calculating head-to-head analytics matrix...</p>
      </div>
    `;

    try {
      const data = await API.comparePlayers(playerIds);
      if (!data.success || !data.players || data.players.length < 2) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem;">
            <h2 style="color: var(--color-danger); margin-bottom: 1rem;">Comparison Failed</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Select at least 2 players to perform comparative head-to-head analysis.</p>
            <a href="#/players" class="cx-btn cx-btn-primary">Browse Players</a>
          </div>
        `;
        return;
      }

      comparedPlayers = data.players;
      render(data, container);
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem;">
          <h2 style="color: var(--color-danger); margin-bottom: 1rem;">Unable to Compare</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${err.message}</p>
          <a href="#/players" class="cx-btn cx-btn-secondary">Back to Players</a>
        </div>
      `;
    }
  }

  function render(data, container) {
    const { players, winner, verdict } = data;
    const maxScore = Math.max(...players.map(p => p.performance_score));

    // Find winners for matrix cells
    const bestRuns = Math.max(...players.map(p => p.runs || 0));
    const bestWkts = Math.max(...players.map(p => p.wickets || 0));
    const bestAvg = Math.max(...players.map(p => p.batting_average || 0));
    const bestSR = Math.max(...players.map(p => p.strike_rate || 0));
    const bestBowlAvg = Math.min(...players.filter(p => (p.bowling_average || 0) > 0).map(p => p.bowling_average) || [999]);
    const bestEcon = Math.min(...players.filter(p => (p.economy_rate || 0) > 0).map(p => p.economy_rate) || [999]);
    const bestCatches = Math.max(...players.map(p => p.catches || 0));

    container.innerHTML = `
      <div class="cx-section-head">
        <div class="cx-section-title-wrap">
          <h2>⚔️ Head-to-Head Player Comparison</h2>
          <p>Multi-dimensional performance analysis, radar metrics, and side-by-side skill evaluation.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="cx-btn cx-btn-outline-green" onclick="App.openCompareSelectorModal()">
            ➕ Add / Change Players
          </button>
          <button class="cx-btn cx-btn-secondary" onclick="App.clearCompare()">
            ✕ Clear Comparison
          </button>
        </div>
      </div>

      <!-- CricketX Analytical Verdict -->
      <div class="cx-compare-verdict">
        <div class="cx-compare-verdict-title">
          <span>👑 CricketX Performance Verdict: <strong>${winner}</strong></span>
        </div>
        <div class="cx-compare-verdict-text">${verdict}</div>
      </div>

      <!-- Player Cards Stage -->
      <div class="cx-compare-stage">
        ${players.map(p => {
          const isWinner = p.performance_score === maxScore;
          const fallbackInitials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return `
            <div class="cx-compare-card ${isWinner ? 'winner-card' : ''}">
              <img 
                src="${p.photo_url || ''}" 
                alt="${p.name}" 
                class="cx-compare-avatar"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
              />
              <div class="cx-player-fallback-avatar cx-compare-avatar" style="display: ${p.photo_url ? 'none' : 'flex'};">
                ${fallbackInitials}
              </div>

              <div class="cx-compare-name">${p.name}</div>
              <div class="cx-compare-team">${p.team_short_name || 'Independent'} • ${p.role}</div>

              <div class="cx-compare-score-box">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Performance Score</div>
                <div class="cx-compare-score-val">${p.performance_score}</div>
                <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : p.category === 'Good' ? 'badge-good' : 'badge-average'}">${p.category}</span>
              </div>

              <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 0.5rem;">
                <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-secondary" style="flex: 1;">View Profile</a>
                <button class="cx-btn cx-btn-sm cx-btn-danger" onclick="App.removeFromCompare(${p.id})">Remove</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Radar Comparison Chart -->
      <div class="cx-chart-card" style="margin-bottom: 2.25rem;">
        <div class="cx-chart-head">
          <div class="cx-chart-title">
            <span>🕸️ Multi-Dimensional Skill Radar</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Comparing Batting, Bowling, Fielding, Fitness, Form & Match Impact</span>
        </div>
        <div class="cx-chart-body" style="height: 380px;">
          <canvas id="compareRadarCanvas"></canvas>
        </div>
      </div>

      <!-- Comprehensive Side-by-Side Stat Matrix -->
      <div class="cx-table-wrap" style="margin-bottom: 2rem;">
        <div style="padding: 1.1rem 1.25rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span>📊 Head-to-Head Statistics Matrix</span>
          <span style="font-size: 0.75rem; color: var(--accent-green);">★ Green denotes leading statistic</span>
        </div>
        <table class="cx-table">
          <thead>
            <tr>
              <th>Performance Metric</th>
              ${players.map(p => `<th class="text-right" style="color: var(--accent-gold);">${p.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Overall Performance Score</strong></td>
              ${players.map(p => `<td class="text-right ${p.performance_score === maxScore ? 'stat-winner' : ''}">${p.performance_score}</td>`).join('')}
            </tr>
            <tr>
              <td>Performance Classification</td>
              ${players.map(p => `<td class="text-right"><span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : 'badge-good'}">${p.category}</span></td>`).join('')}
            </tr>
            <tr>
              <td>Batting Rating (40% weight)</td>
              ${players.map(p => {
                const maxBat = Math.max(...players.map(pl => pl.batting_score));
                return `<td class="text-right ${p.batting_score === maxBat ? 'stat-winner' : ''}">${p.batting_score}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td>Bowling Rating (25% weight)</td>
              ${players.map(p => {
                const maxBowl = Math.max(...players.map(pl => pl.bowling_score));
                return `<td class="text-right ${p.bowling_score === maxBowl ? 'stat-winner' : ''}">${p.bowling_score}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td>Fielding Rating (20% weight)</td>
              ${players.map(p => {
                const maxField = Math.max(...players.map(pl => pl.fielding_score));
                return `<td class="text-right ${p.fielding_score === maxField ? 'stat-winner' : ''}">${p.fielding_score}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td>Fitness Rating (15% weight)</td>
              ${players.map(p => {
                const maxFit = Math.max(...players.map(pl => pl.fitness_score));
                return `<td class="text-right ${p.fitness_score === maxFit ? 'stat-winner' : ''}">${p.fitness_score}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td>Career Runs</td>
              ${players.map(p => `<td class="text-right ${(p.runs || 0) === bestRuns && bestRuns > 0 ? 'stat-winner' : ''}">${p.runs || 0}</td>`).join('')}
            </tr>
            <tr>
              <td>Batting Average</td>
              ${players.map(p => `<td class="text-right ${(p.batting_average || 0) === bestAvg && bestAvg > 0 ? 'stat-winner' : ''}">${p.batting_average || 0}</td>`).join('')}
            </tr>
            <tr>
              <td>Batting Strike Rate</td>
              ${players.map(p => `<td class="text-right ${(p.strike_rate || 0) === bestSR && bestSR > 0 ? 'stat-winner' : ''}">${p.strike_rate || 0}</td>`).join('')}
            </tr>
            <tr>
              <td>Career Wickets</td>
              ${players.map(p => `<td class="text-right ${(p.wickets || 0) === bestWkts && bestWkts > 0 ? 'stat-winner' : ''}">${p.wickets || 0}</td>`).join('')}
            </tr>
            <tr>
              <td>Economy Rate</td>
              ${players.map(p => `<td class="text-right ${(p.economy_rate || 0) === bestEcon && (p.economy_rate || 0) > 0 ? 'stat-winner' : ''}">${p.economy_rate || 'N/A'}</td>`).join('')}
            </tr>
            <tr>
              <td>Catches Taken</td>
              ${players.map(p => `<td class="text-right ${(p.catches || 0) === bestCatches && bestCatches > 0 ? 'stat-winner' : ''}">${p.catches || 0}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Render Radar Chart
    setTimeout(() => {
      ChartManager.renderRadarComparison('compareRadarCanvas', players);
    }, 50);
  }

  return {
    load
  };
})();
