/* ==========================================================================
   CRICKETX — PLAYER PROFILE MODULE
   Comprehensive player profile rendering with detailed statistics,
   trends, data-driven strengths & weaknesses, match logs, and action hooks.
   ========================================================================== */

const ProfileView = (() => {
  let currentPlayer = null;

  async function load(playerId) {
    const container = document.getElementById('view-profile');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">🏏</div>
        <p style="color: var(--text-secondary);">Loading comprehensive player analytics...</p>
      </div>
    `;

    try {
      const data = await API.getPlayer(playerId);
      if (!data.success || !data.player) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem;">
            <h2 style="color: var(--color-danger); margin-bottom: 1rem;">Player Not Found</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">The requested player record does not exist or has been removed.</p>
            <a href="#/players" class="cx-btn cx-btn-primary">Return to Directory</a>
          </div>
        `;
        return;
      }

      currentPlayer = data;
      render(data, container);
    } catch (err) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem;">
          <h2 style="color: var(--color-danger); margin-bottom: 1rem;">Error Loading Profile</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${err.message}</p>
          <a href="#/players" class="cx-btn cx-btn-secondary">Back to Players</a>
        </div>
      `;
    }
  }

  function getCategoryBadgeClass(category) {
    switch (category) {
      case 'Excellent': return 'badge-excellent';
      case 'Good': return 'badge-good';
      case 'Average': return 'badge-average';
      default: return 'badge-needs-improvement';
    }
  }

  function render(data, container) {
    const { player, batting, bowling, fielding, matches, observations } = data;
    const catClass = getCategoryBadgeClass(player.category);

    const fallbackInitials = player.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // SVG Score Meter calculations
    const strokeDash = 283; // 2 * PI * 45
    const dashOffset = strokeDash - (strokeDash * player.performance_score) / 100;

    let gaugeColorClass = 'gold';
    if (player.category === 'Good') gaugeColorClass = 'green';
    else if (player.category === 'Average') gaugeColorClass = 'blue';
    else if (player.category === 'Needs Improvement') gaugeColorClass = 'red';

    container.innerHTML = `
      <!-- Breadcrumb Navigation & Notice -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary);">
          <a href="#/players" style="color: var(--text-muted);">&larr; Back to Directory</a>
          <span>/</span>
          <span style="color: #ffffff; font-weight: 600;">${player.name}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--accent-gold); background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.25rem 0.75rem; border-radius: var(--radius-full);">
          ⚡ Illustrative Demo Data for Performance Modeling
        </div>
      </div>

      <!-- Player Profile Hero Header -->
      <div class="cx-profile-hero">
        <div class="cx-profile-main">
          <div style="position: relative;">
            <img 
              src="${player.photo_url || ''}" 
              alt="${player.name}"
              class="cx-profile-avatar-large"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div class="cx-player-fallback-avatar cx-profile-avatar-large" style="display: ${player.photo_url ? 'none' : 'flex'};">
              ${fallbackInitials}
            </div>
            ${player.jersey_number ? `
              <div style="position: absolute; bottom: 4px; right: 4px; background: #070d19; border: 2px solid var(--accent-gold); color: var(--accent-gold); font-size: 0.9rem; font-weight: 800; padding: 2px 7px; border-radius: 6px;">
                #${player.jersey_number}
              </div>
            ` : ''}
          </div>

          <div class="cx-profile-info">
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.25rem;">
              <span style="color: var(--accent-gold); font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">
                ${player.team_name || 'Independent Franchise'}
              </span>
              <span style="color: var(--text-muted); font-size: 0.75rem;">•</span>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">${player.country}</span>
            </div>

            <h1>${player.name}</h1>

            <div class="cx-profile-meta-tags">
              <span class="cx-badge badge-role">${player.role}</span>
              <span class="cx-badge ${catClass}">${player.category}</span>
              ${player.verification_status === 'verified' ? `
                <span class="cx-badge badge-verified">✓ Verified Player</span>
              ` : `
                <span class="cx-badge badge-pending">⏳ Verification Pending</span>
              `}
              <span class="cx-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">
                ${player.career_status}
              </span>
            </div>

            <div class="cx-profile-styles">
              <div>🏏 <strong>Batting:</strong> ${player.batting_style || 'Right-hand bat'}</div>
              <div>⚡ <strong>Bowling:</strong> ${player.bowling_style || 'Right-arm medium'}</div>
            </div>
          </div>
        </div>

        <!-- Overall Score Ring Meter -->
        <div class="cx-profile-score-box">
          <div class="cx-score-gauge cx-score-gauge-large ${gaugeColorClass}">
            <svg viewBox="0 0 100 100">
              <circle class="cx-score-gauge-bg" cx="50" cy="50" r="45"></circle>
              <circle class="cx-score-gauge-val" cx="50" cy="50" r="45" style="stroke-dasharray: ${strokeDash}; stroke-dashoffset: ${dashOffset};"></circle>
            </svg>
            <div class="cx-score-gauge-text">${player.performance_score}<small>/100</small></div>
          </div>
          <div class="cx-profile-score-info">
            <span class="cx-profile-score-label">CricketX Performance Index</span>
            <div class="cx-badge ${catClass}" style="align-self: flex-start; margin: 0.35rem 0;">${player.category}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
              Formula: (Batting × 40%) + (Bowling × 25%) + (Fielding × 20%) + (Fitness × 15%)
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="cx-btn cx-btn-gold" onclick="App.toggleComparePlayer(${player.id})">
            ⚔️ Add to Head-to-Head Compare
          </button>
          ${player.team_id ? `
            <a href="#/team/${player.team_id}" class="cx-btn cx-btn-secondary">
              🛡️ View ${player.team_short_name || 'Team'} Squad
            </a>
          ` : ''}
          <button class="cx-btn cx-btn-secondary" onclick="window.print()">
            🖨️ Export / Print Summary
          </button>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          ID: #${player.id} • Registered by: ${player.submitted_by || 'Official'}
        </div>
      </div>

      <!-- Quick Summary KPIs Grid -->
      <div class="cx-kpi-grid" style="margin-bottom: 2rem;">
        <div class="cx-kpi-card" style="--kpi-accent: #38bdf8;">
          <div class="cx-kpi-head">
            <span class="cx-kpi-title">Matches / Innings</span>
            <span class="cx-kpi-icon">🏏</span>
          </div>
          <div class="cx-kpi-value">${batting?.matches || 0} <span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">/ ${batting?.innings || 0}</span></div>
          <div class="cx-kpi-sub">Career Appearances</div>
        </div>

        <div class="cx-kpi-card" style="--kpi-accent: #00d084;">
          <div class="cx-kpi-head">
            <span class="cx-kpi-title">Runs / High Score</span>
            <span class="cx-kpi-icon">💥</span>
          </div>
          <div class="cx-kpi-value">${batting?.runs || 0}</div>
          <div class="cx-kpi-sub">Highest Score: <strong>${batting?.highest_score || '0'}</strong></div>
        </div>

        <div class="cx-kpi-card" style="--kpi-accent: #f59e0b;">
          <div class="cx-kpi-head">
            <span class="cx-kpi-title">Batting Avg / SR</span>
            <span class="cx-kpi-icon">📈</span>
          </div>
          <div class="cx-kpi-value">${batting?.batting_average || 0}</div>
          <div class="cx-kpi-sub">Strike Rate: <strong>${batting?.strike_rate || 0}</strong></div>
        </div>

        <div class="cx-kpi-card" style="--kpi-accent: #f43f5e;">
          <div class="cx-kpi-head">
            <span class="cx-kpi-title">Wickets / Economy</span>
            <span class="cx-kpi-icon">🎯</span>
          </div>
          <div class="cx-kpi-value">${bowling?.wickets || 0}</div>
          <div class="cx-kpi-sub">Economy: <strong>${bowling?.economy_rate || 0}</strong> RPO</div>
        </div>

        <div class="cx-kpi-card" style="--kpi-accent: #a855f7;">
          <div class="cx-kpi-head">
            <span class="cx-kpi-title">Catches & Stumpings</span>
            <span class="cx-kpi-icon">🧤</span>
          </div>
          <div class="cx-kpi-value">${fielding?.catches || 0} <span style="font-size: 1.1rem; color: var(--text-muted); font-weight: 500;">+ ${fielding?.stumpings || 0} st</span></div>
          <div class="cx-kpi-sub">Dismissals involved</div>
        </div>
      </div>

      <!-- Section D: Fitness & Performance Factor Breakdown -->
      <div class="cx-chart-card" style="margin-bottom: 2rem;">
        <div class="cx-chart-head">
          <div class="cx-chart-title">
            <span>⚡ Factor Scoring Breakdown & Formula Components</span>
          </div>
          <div class="cx-badge ${catClass}">Formula Result: ${player.performance_score}/100</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
          <!-- Batting Rating -->
          <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid #38bdf8;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: #ffffff;">Batting Factor (40%)</span>
              <span style="font-weight: 800; color: #38bdf8;">${player.batting_score}/100</span>
            </div>
            <div class="cx-factor-progress" style="height: 8px;">
              <div class="cx-factor-fill" style="width: ${player.batting_score}%; background: #38bdf8;"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
              Weighted Score: <strong>${(player.batting_score * 0.4).toFixed(2)} pts</strong>
            </div>
          </div>

          <!-- Bowling Rating -->
          <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid #f43f5e;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: #ffffff;">Bowling Factor (25%)</span>
              <span style="font-weight: 800; color: #f43f5e;">${player.bowling_score}/100</span>
            </div>
            <div class="cx-factor-progress" style="height: 8px;">
              <div class="cx-factor-fill" style="width: ${player.bowling_score}%; background: #f43f5e;"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
              Weighted Score: <strong>${(player.bowling_score * 0.25).toFixed(2)} pts</strong>
            </div>
          </div>

          <!-- Fielding Rating -->
          <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: #ffffff;">Fielding Factor (20%)</span>
              <span style="font-weight: 800; color: #10b981;">${player.fielding_score}/100</span>
            </div>
            <div class="cx-factor-progress" style="height: 8px;">
              <div class="cx-factor-fill" style="width: ${player.fielding_score}%; background: #10b981;"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
              Weighted Score: <strong>${(player.fielding_score * 0.2).toFixed(2)} pts</strong>
            </div>
          </div>

          <!-- Fitness Rating -->
          <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid #fbbf24;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 700; color: #ffffff;">Fitness Factor (15%)</span>
              <span style="font-weight: 800; color: #fbbf24;">${player.fitness_score}/100</span>
            </div>
            <div class="cx-factor-progress" style="height: 8px;">
              <div class="cx-factor-fill" style="width: ${player.fitness_score}%; background: #fbbf24;"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
              Weighted Score: <strong>${(player.fitness_score * 0.15).toFixed(2)} pts</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Section F: Data-Driven Strengths & Tactical Weaknesses -->
      <div class="cx-sw-grid">
        <div class="cx-sw-column">
          <div class="cx-sw-col-title strengths">
            <span>🛡️ Analytical Strengths</span>
          </div>
          <div class="cx-sw-list">
            ${observations.strengths.map(s => `
              <div class="cx-sw-item strength">
                <div style="font-size: 1.1rem; color: var(--accent-green);">✔</div>
                <div>
                  <div class="cx-sw-item-title">${s.title}</div>
                  <div class="cx-sw-item-desc">${s.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cx-sw-column">
          <div class="cx-sw-col-title weaknesses">
            <span>🎯 Tactical Improvement Areas</span>
          </div>
          <div class="cx-sw-list">
            ${observations.weaknesses.map(w => `
              <div class="cx-sw-item weakness">
                <div style="font-size: 1.1rem; color: var(--accent-gold);">▲</div>
                <div>
                  <div class="cx-sw-item-title">${w.title}</div>
                  <div class="cx-sw-item-desc">${w.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Section E: Performance Trends Chart -->
      <div class="cx-chart-card" style="margin-bottom: 2rem;">
        <div class="cx-chart-head">
          <div class="cx-chart-title">
            <span>📈 Recent Match Performance Trends & Form Tracker</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Last 6 Fixtures</span>
        </div>
        <div class="cx-chart-body" style="height: 280px;">
          <canvas id="profileTrendsCanvas"></canvas>
        </div>
      </div>

      <!-- Detailed Stat Tables (A, B, C) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Section A: Batting Statistics -->
        <div class="cx-table-wrap">
          <div style="padding: 1rem 1.25rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <span>🏏 Detailed Batting Statistics</span>
            <span class="cx-badge badge-role">Batting Score: ${player.batting_score}</span>
          </div>
          <table class="cx-table">
            <tbody>
              <tr><th>Matches</th><td class="text-right">${batting?.matches || 0}</td></tr>
              <tr><th>Innings</th><td class="text-right">${batting?.innings || 0}</td></tr>
              <tr><th>Runs Scored</th><td class="text-right" style="color: var(--accent-green); font-weight: 700;">${batting?.runs || 0}</td></tr>
              <tr><th>Balls Faced</th><td class="text-right">${batting?.balls_faced || 0}</td></tr>
              <tr><th>Not Outs</th><td class="text-right">${batting?.not_outs || 0}</td></tr>
              <tr><th>Highest Score</th><td class="text-right" style="color: var(--accent-gold); font-weight: 700;">${batting?.highest_score || '0'}</td></tr>
              <tr><th>Batting Average</th><td class="text-right">${batting?.batting_average || 0}</td></tr>
              <tr><th>Strike Rate</th><td class="text-right">${batting?.strike_rate || 0}</td></tr>
              <tr><th>Centuries (100s)</th><td class="text-right">${batting?.hundreds || 0}</td></tr>
              <tr><th>Half-Centuries (50s)</th><td class="text-right">${batting?.fifties || 0}</td></tr>
              <tr><th>Boundaries (4s / 6s)</th><td class="text-right">${batting?.fours || 0} / ${batting?.sixes || 0}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Section B: Bowling Statistics -->
        <div class="cx-table-wrap">
          <div style="padding: 1rem 1.25rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <span>🎯 Detailed Bowling Statistics</span>
            <span class="cx-badge badge-role">Bowling Score: ${player.bowling_score}</span>
          </div>
          <table class="cx-table">
            <tbody>
              <tr><th>Matches</th><td class="text-right">${bowling?.matches || 0}</td></tr>
              <tr><th>Overs Bowled</th><td class="text-right">${bowling?.overs || 0}</td></tr>
              <tr><th>Maidens</th><td class="text-right">${bowling?.maidens || 0}</td></tr>
              <tr><th>Runs Conceded</th><td class="text-right">${bowling?.runs_conceded || 0}</td></tr>
              <tr><th>Wickets Taken</th><td class="text-right" style="color: var(--color-danger); font-weight: 700;">${bowling?.wickets || 0}</td></tr>
              <tr><th>Bowling Average</th><td class="text-right">${bowling?.bowling_average || 0}</td></tr>
              <tr><th>Economy Rate</th><td class="text-right">${bowling?.economy_rate || 0}</td></tr>
              <tr><th>Bowling Strike Rate</th><td class="text-right">${bowling?.bowling_strike_rate || 0}</td></tr>
              <tr><th>Best Bowling Figures</th><td class="text-right" style="color: var(--accent-gold); font-weight: 700;">${bowling?.best_bowling_figures || 'N/A'}</td></tr>
              <tr><th>Five-Wicket Hauls (5w)</th><td class="text-right">${bowling?.five_wicket_hauls || 0}</td></tr>
              <tr><th>Catches / Stumpings</th><td class="text-right">${fielding?.catches || 0} / ${fielding?.stumpings || 0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section G: Match History Log -->
      <div class="cx-table-wrap" style="margin-bottom: 2rem;">
        <div style="padding: 1rem 1.25rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span>📋 Recent Match Logs & Performances</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${matches.length} Fixtures Recorded</span>
        </div>
        <table class="cx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Competition</th>
              <th class="text-right">Runs</th>
              <th class="text-right">Balls</th>
              <th class="text-right">Wickets</th>
              <th class="text-right">Catches</th>
              <th class="text-right">Match Performance</th>
            </tr>
          </thead>
          <tbody>
            ${matches.length > 0 ? matches.map(m => `
              <tr>
                <td style="color: var(--text-secondary);">${m.match_date}</td>
                <td style="font-weight: 700; color: #ffffff;">vs ${m.opponent}</td>
                <td><span class="cx-badge" style="background: rgba(255,255,255,0.06); font-size: 0.72rem;">${m.competition}</span></td>
                <td class="text-right" style="font-weight: 700; color: ${m.runs >= 40 ? 'var(--accent-green)' : '#ffffff'};">${m.runs}</td>
                <td class="text-right" style="color: var(--text-muted);">${m.balls_faced}</td>
                <td class="text-right" style="font-weight: 700; color: ${m.wickets > 0 ? 'var(--color-danger)' : 'var(--text-muted)'};">${m.wickets}</td>
                <td class="text-right">${m.catches}</td>
                <td class="text-right" style="font-weight: 800; color: var(--accent-gold);">${m.match_score}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" class="text-center" style="padding: 2rem; color: var(--text-muted);">
                  No match history logs available.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

    // Render Trends Chart
    if (matches && matches.length > 0) {
      setTimeout(() => {
        ChartManager.renderTrendsChart('profileTrendsCanvas', matches);
      }, 50);
    }
  }

  return {
    load
  };
})();
