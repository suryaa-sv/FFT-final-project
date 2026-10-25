/* ==========================================================================
   CRICKETX — CORE APPLICATION CONTROLLER
   State management, event binding, directory filters, comparison tray, UI orchestrator
   ========================================================================== */

const App = (() => {
  // Global State
  let comparisonQueue = JSON.parse(localStorage.getItem('cricketx_compare_queue') || '[]');
  let currentFilter = {
    search: '',
    team_id: '',
    role: 'All',
    category: 'All',
    min_score: 0,
    sort: 'score_desc',
    viewMode: 'grid' // 'grid' or 'table'
  };

  // Toast Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cx-toast ${type}`;
    const icon = type === 'success' ? '✔' : type === 'error' ? '✖' : 'ℹ';
    toast.innerHTML = `
      <span style="font-weight: 800; font-size: 1.1rem;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Modal Management
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // Comparison Tray
  function getComparisonQueue() {
    return comparisonQueue;
  }

  function toggleComparePlayer(playerId) {
    const id = parseInt(playerId);
    const index = comparisonQueue.indexOf(id);

    if (index > -1) {
      comparisonQueue.splice(index, 1);
      showToast('Player removed from comparison queue', 'info');
    } else {
      if (comparisonQueue.length >= 4) {
        showToast('Maximum 4 players can be compared at once', 'error');
        return;
      }
      comparisonQueue.push(id);
      showToast('Player added to comparison queue!', 'success');
    }

    localStorage.setItem('cricketx_compare_queue', JSON.stringify(comparisonQueue));
    updateComparePill();

    // If currently on compare view, re-trigger
    if (window.location.hash.startsWith('#/compare')) {
      CompareView.load(comparisonQueue);
    }
  }

  function removeFromCompare(playerId) {
    const id = parseInt(playerId);
    comparisonQueue = comparisonQueue.filter(pid => pid !== id);
    localStorage.setItem('cricketx_compare_queue', JSON.stringify(comparisonQueue));
    updateComparePill();
    if (window.location.hash.startsWith('#/compare')) {
      CompareView.load(comparisonQueue);
    }
  }

  function clearCompare() {
    comparisonQueue = [];
    localStorage.removeItem('cricketx_compare_queue');
    updateComparePill();
    showToast('Comparison queue cleared', 'info');
    if (window.location.hash.startsWith('#/compare')) {
      CompareView.load([]);
    }
  }

  function updateComparePill() {
    const pill = document.getElementById('comparePill');
    const badge = document.getElementById('compareBadge');
    if (!pill || !badge) return;

    if (comparisonQueue.length > 0) {
      pill.classList.add('visible');
      badge.textContent = comparisonQueue.length;
    } else {
      pill.classList.remove('visible');
    }
  }

  // Comparison Selector Modal
  async function openCompareSelectorModal() {
    const listWrap = document.getElementById('compareSelectorList');
    if (!listWrap) return;

    listWrap.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading players...</div>';
    openModal('compareSelectorModal');

    try {
      const res = await API.getPlayers({ limit: 50 });
      const players = res.players || [];

      listWrap.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 380px; overflow-y: auto;">
          ${players.map(p => {
            const isSelected = comparisonQueue.includes(p.id);
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; color: #ffffff;">${p.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${p.team_short_name || 'Franchise'} • ${p.role} • Score: ${p.performance_score}</div>
                </div>
                <button class="cx-btn cx-btn-sm ${isSelected ? 'cx-btn-danger' : 'cx-btn-primary'}" onclick="App.toggleComparePlayer(${p.id}); App.openCompareSelectorModal();">
                  ${isSelected ? 'Remove' : '+ Select'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (e) {
      listWrap.innerHTML = `<div style="color: var(--color-danger); text-align: center;">${e.message}</div>`;
    }
  }

  // Auth UI Sync
  function updateAuthUI() {
    const btn = document.getElementById('adminHeaderBtn');
    if (!btn) return;

    const isLoggedIn = API.isAdminLoggedIn();
    if (isLoggedIn) {
      btn.classList.add('logged-in');
      btn.innerHTML = '🛡️ Admin Portal';
    } else {
      btn.classList.remove('logged-in');
      btn.innerHTML = '🔒 Admin Login';
    }
  }

  // View Switcher Utility
  function activateView(viewId) {
    document.querySelectorAll('.cx-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
  }

  // 1. DASHBOARD VIEW CONTROLLER
  async function loadDashboard() {
    activateView('view-dashboard');
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    try {
      const data = await API.getDashboard();
      if (!data.success) return;

      const { kpis, charts, top_performers, best_batsmen, best_bowlers, best_allrounders, best_wicketkeepers, recently_updated } = data;

      // Update KPI Cards
      document.getElementById('kpiTotalPlayers').textContent = kpis.total_players;
      document.getElementById('kpiTotalTeams').textContent = kpis.total_teams;
      document.getElementById('kpiVerifiedPlayers').textContent = kpis.verified_players;
      document.getElementById('kpiPendingPlayers').textContent = kpis.pending_players;
      document.getElementById('kpiHighestScore').textContent = kpis.highest_score;
      document.getElementById('kpiAverageScore').textContent = kpis.average_score;

      if (kpis.highest_player) {
        document.getElementById('kpiHighestSub').innerHTML = `Top: <strong>${kpis.highest_player.name}</strong> (${kpis.highest_player.role})`;
      }

      // Render Top 5 Verified Players Grid
      const top5Wrap = document.getElementById('dashboardTop5Grid');
      if (top5Wrap) {
        top5Wrap.innerHTML = top_performers.map((p, idx) => {
          const fallbackInitials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const rankColors = ['#f59e0b', '#94a3b8', '#b45309', '#00d084', '#00d084'];
          const rankColor = rankColors[idx] || '#00d084';

          return `
            <div class="cx-player-card">
              <div class="cx-player-card-header">
                <div class="cx-player-avatar-wrap">
                  <img src="${p.photo_url || ''}" alt="${p.name}" class="cx-player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                  <div class="cx-player-fallback-avatar" style="display: ${p.photo_url ? 'none' : 'flex'};">${fallbackInitials}</div>
                  ${p.jersey_number ? `<span class="cx-jersey-badge">#${p.jersey_number}</span>` : ''}
                </div>
                <div class="cx-player-card-meta">
                  <div class="cx-player-team-tag">
                    <span style="color: ${rankColor}; font-weight: 800;">#${idx + 1}</span> • ${p.team_short_name || 'Franchise'}
                  </div>
                  <div class="cx-player-card-name" onclick="Router.navigate('/player/${p.id}')">${p.name}</div>
                  <div class="cx-player-role-row">
                    <span class="cx-badge badge-role">${p.role}</span>
                    <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : 'badge-good'}">${p.category}</span>
                  </div>
                </div>
                <div class="cx-score-gauge gold">
                  <svg viewBox="0 0 100 100">
                    <circle class="cx-score-gauge-bg" cx="50" cy="50" r="45"></circle>
                    <circle class="cx-score-gauge-val" cx="50" cy="50" r="45" style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (283 * p.performance_score) / 100};"></circle>
                  </svg>
                  <div class="cx-score-gauge-text">${p.performance_score}</div>
                </div>
              </div>

              <div class="cx-player-card-body">
                <div class="cx-card-stat-grid">
                  <div class="cx-card-stat-item">
                    <span class="cx-card-stat-label">Runs</span>
                    <span class="cx-card-stat-val">${p.runs || 0}</span>
                  </div>
                  <div class="cx-card-stat-item">
                    <span class="cx-card-stat-label">Wickets</span>
                    <span class="cx-card-stat-val">${p.wickets || 0}</span>
                  </div>
                  <div class="cx-card-stat-item">
                    <span class="cx-card-stat-label">Fitness</span>
                    <span class="cx-card-stat-val" style="color: #fbbf24;">${p.fitness_score}</span>
                  </div>
                </div>
              </div>

              <div class="cx-player-card-actions">
                <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-primary">View Full Profile</a>
                <button class="cx-btn cx-btn-sm cx-btn-secondary" onclick="App.toggleComparePlayer(${p.id})">⚔️ Compare</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Render Category Spotlights
      renderSpotlightRows('dashBestBatsmenList', best_batsmen, p => `${p.runs || 0} Runs • ${p.batting_average || 0} Avg`);
      renderSpotlightRows('dashBestBowlersList', best_bowlers, p => `${p.wickets || 0} Wkts • ${p.economy_rate || 0} Econ`);
      renderSpotlightRows('dashBestAllroundersList', best_allrounders, p => `${p.runs || 0} R • ${p.wickets || 0} W`);
      renderSpotlightRows('dashBestKeepersList', best_wicketkeepers, p => `${p.catches || 0} C • ${p.stumpings || 0} St`);

      // Render Recently Updated Table
      const recentWrap = document.getElementById('dashRecentTableBody');
      if (recentWrap) {
        recentWrap.innerHTML = recently_updated.map(p => `
          <tr onclick="Router.navigate('/player/${p.id}')" style="cursor: pointer;">
            <td>
              <div style="font-weight: 700; color: #ffffff;">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.country}</div>
            </td>
            <td><span class="cx-badge badge-role">${p.role}</span></td>
            <td style="color: var(--accent-gold); font-weight: 600;">${p.team_short_name || 'Independent'}</td>
            <td>
              <span class="cx-badge ${p.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'}">
                ${p.verification_status}
              </span>
            </td>
            <td class="text-right" style="font-weight: 800; color: var(--accent-green);">${p.performance_score}</td>
            <td class="text-right"><span class="cx-btn cx-btn-sm cx-btn-secondary">Profile &rarr;</span></td>
          </tr>
        `).join('');
      }

      // Render Charts
      setTimeout(() => {
        ChartManager.renderDistributionChart('dashChartDistribution', charts.score_distribution);
        ChartManager.renderRoleChart('dashChartRole', charts.role_distribution);
        ChartManager.renderTeamPerformanceChart('dashChartTeamAverages', charts.team_averages);
        ChartManager.renderBattingVsBowlingChart('dashChartBatVsBowl', charts.batting_vs_bowling);
      }, 50);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }

  function renderSpotlightRows(containerId, list, statFormatter) {
    const el = document.getElementById(containerId);
    if (!el || !list) return;

    el.innerHTML = list.map(p => {
      const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return `
        <div class="cx-mini-player-row" onclick="Router.navigate('/player/${p.id}')">
          <div class="cx-mini-player-info">
            <div class="cx-mini-avatar">${initials}</div>
            <div>
              <div class="cx-mini-name">${p.name}</div>
              <div class="cx-mini-meta">${p.team_short_name || 'Franchise'} • ${statFormatter(p)}</div>
            </div>
          </div>
          <div class="cx-mini-score">
            <div class="cx-mini-score-val">${p.performance_score}</div>
            <div class="cx-mini-score-cat" style="color: ${p.category === 'Excellent' ? 'var(--accent-gold)' : 'var(--accent-green)'};">${p.category}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. PLAYER DIRECTORY CONTROLLER
  async function loadPlayers(params = {}) {
    activateView('view-players');
    const container = document.getElementById('playersContentArea');
    if (!container) return;

    // Merge params into currentFilter
    Object.assign(currentFilter, params);

    // Sync input controls
    const searchInput = document.getElementById('playerDirectorySearch');
    if (searchInput && currentFilter.search) searchInput.value = currentFilter.search;

    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <p style="color: var(--text-secondary);">Querying player performance database...</p>
      </div>
    `;

    try {
      const res = await API.getPlayers(currentFilter);
      const players = res.players || [];
      const totalCount = res.total || 0;

      document.getElementById('playerDirectoryCount').textContent = `Showing ${players.length} of ${totalCount} player records`;

      if (players.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏏</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">No players found</h3>
            <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.5rem auto;">
              No player records match your active search and filter parameters. Try clearing some filters.
            </p>
            <button class="cx-btn cx-btn-secondary" onclick="App.resetPlayerFilters()">Reset All Filters</button>
          </div>
        `;
        return;
      }

      if (currentFilter.viewMode === 'grid') {
        container.innerHTML = `
          <div class="cx-players-grid">
            ${players.map(p => {
              const fallbackInitials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return `
                <div class="cx-player-card">
                  <div class="cx-player-card-header">
                    <div class="cx-player-avatar-wrap">
                      <img src="${p.photo_url || ''}" alt="${p.name}" class="cx-player-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                      <div class="cx-player-fallback-avatar" style="display: ${p.photo_url ? 'none' : 'flex'};">${fallbackInitials}</div>
                      ${p.jersey_number ? `<span class="cx-jersey-badge">#${p.jersey_number}</span>` : ''}
                    </div>
                    <div class="cx-player-card-meta">
                      <div class="cx-player-team-tag">${p.team_short_name || 'Franchise'} • ${p.country}</div>
                      <div class="cx-player-card-name" onclick="Router.navigate('/player/${p.id}')">${p.name}</div>
                      <div class="cx-player-role-row">
                        <span class="cx-badge badge-role">${p.role}</span>
                        <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : p.category === 'Good' ? 'badge-good' : 'badge-average'}">${p.category}</span>
                      </div>
                    </div>
                    <div class="cx-score-gauge ${p.category === 'Excellent' ? 'gold' : 'green'}">
                      <svg viewBox="0 0 100 100">
                        <circle class="cx-score-gauge-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="cx-score-gauge-val" cx="50" cy="50" r="45" style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (283 * p.performance_score) / 100};"></circle>
                      </svg>
                      <div class="cx-score-gauge-text">${p.performance_score}</div>
                    </div>
                  </div>

                  <div class="cx-player-card-body">
                    <div class="cx-card-stat-grid">
                      <div class="cx-card-stat-item">
                        <span class="cx-card-stat-label">Runs</span>
                        <span class="cx-card-stat-val">${p.runs || 0}</span>
                      </div>
                      <div class="cx-card-stat-item">
                        <span class="cx-card-stat-label">Wickets</span>
                        <span class="cx-card-stat-val">${p.wickets || 0}</span>
                      </div>
                      <div class="cx-card-stat-item">
                        <span class="cx-card-stat-label">SR / Econ</span>
                        <span class="cx-card-stat-val">${p.strike_rate || p.economy_rate || 'N/A'}</span>
                      </div>
                    </div>

                    <!-- 4 Sub-score mini bars -->
                    <div class="cx-factor-bars">
                      <div class="cx-factor-row">
                        <span class="cx-factor-name">Batting</span>
                        <div class="cx-factor-progress"><div class="cx-factor-fill" style="width: ${p.batting_score}%; background: #38bdf8;"></div></div>
                        <span class="cx-factor-val">${p.batting_score}</span>
                      </div>
                      <div class="cx-factor-row">
                        <span class="cx-factor-name">Bowling</span>
                        <div class="cx-factor-progress"><div class="cx-factor-fill" style="width: ${p.bowling_score}%; background: #f43f5e;"></div></div>
                        <span class="cx-factor-val">${p.bowling_score}</span>
                      </div>
                      <div class="cx-factor-row">
                        <span class="cx-factor-name">Fielding</span>
                        <div class="cx-factor-progress"><div class="cx-factor-fill" style="width: ${p.fielding_score}%; background: #10b981;"></div></div>
                        <span class="cx-factor-val">${p.fielding_score}</span>
                      </div>
                      <div class="cx-factor-row">
                        <span class="cx-factor-name">Fitness</span>
                        <div class="cx-factor-progress"><div class="cx-factor-fill" style="width: ${p.fitness_score}%; background: #fbbf24;"></div></div>
                        <span class="cx-factor-val">${p.fitness_score}</span>
                      </div>
                    </div>
                  </div>

                  <div class="cx-player-card-actions">
                    <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-primary">View Profile</a>
                    <button class="cx-btn cx-btn-sm cx-btn-secondary" onclick="App.toggleComparePlayer(${p.id})">⚔️ Compare</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // Table view
        container.innerHTML = `
          <div class="cx-table-wrap">
            <table class="cx-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th class="text-right">Runs</th>
                  <th class="text-right">Avg</th>
                  <th class="text-right">SR</th>
                  <th class="text-right">Wickets</th>
                  <th class="text-right">Economy</th>
                  <th class="text-right">Performance Score</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${players.map(p => `
                  <tr>
                    <td>
                      <div class="cx-table-player-cell" onclick="Router.navigate('/player/${p.id}')" style="cursor: pointer;">
                        <div>
                          <div style="font-weight: 700; color: #ffffff;">${p.name}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${p.country}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="cx-badge badge-role">${p.role}</span></td>
                    <td style="color: var(--accent-gold); font-weight: 600;">${p.team_short_name || 'Independent'}</td>
                    <td class="text-right">${p.runs || 0}</td>
                    <td class="text-right">${p.batting_average || 0}</td>
                    <td class="text-right">${p.strike_rate || 0}</td>
                    <td class="text-right">${p.wickets || 0}</td>
                    <td class="text-right">${p.economy_rate || 0}</td>
                    <td class="text-right" style="font-weight: 800; color: var(--accent-green); font-size: 1.05rem;">${p.performance_score}</td>
                    <td>
                      <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : p.category === 'Good' ? 'badge-good' : 'badge-average'}">
                        ${p.category}
                      </span>
                    </td>
                    <td class="text-right">
                      <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                        <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-primary">Profile</a>
                        <button class="cx-btn cx-btn-sm cx-btn-secondary" onclick="App.toggleComparePlayer(${p.id})">⚔️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 2rem;">${err.message}</div>`;
    }
  }

  function handleFilterChange() {
    currentFilter.search = document.getElementById('playerDirectorySearch')?.value || '';
    currentFilter.team_id = document.getElementById('playerDirectoryTeamFilter')?.value || '';
    currentFilter.category = document.getElementById('playerDirectoryCategoryFilter')?.value || 'All';
    currentFilter.sort = document.getElementById('playerDirectorySort')?.value || 'score_desc';
    loadPlayers();
  }

  function handleRoleFilter(role, btnEl) {
    currentFilter.role = role;
    document.querySelectorAll('.cx-role-pill-btn').forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');
    loadPlayers();
  }

  function handleMinScoreChange(val) {
    currentFilter.min_score = val;
    document.getElementById('sliderValDisplay').textContent = `${val}+`;
    loadPlayers();
  }

  function toggleDirectoryView(mode) {
    currentFilter.viewMode = mode;
    document.getElementById('btnViewGrid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('btnViewTable')?.classList.toggle('active', mode === 'table');
    loadPlayers();
  }

  function resetPlayerFilters() {
    currentFilter = {
      search: '',
      team_id: '',
      role: 'All',
      category: 'All',
      min_score: 0,
      sort: 'score_desc',
      viewMode: currentFilter.viewMode
    };

    const s = document.getElementById('playerDirectorySearch'); if (s) s.value = '';
    const t = document.getElementById('playerDirectoryTeamFilter'); if (t) t.value = '';
    const c = document.getElementById('playerDirectoryCategoryFilter'); if (c) c.value = 'All';
    const so = document.getElementById('playerDirectorySort'); if (so) so.value = 'score_desc';
    const sl = document.getElementById('minScoreSlider'); if (sl) sl.value = 0;
    const sld = document.getElementById('sliderValDisplay'); if (sld) sld.textContent = '0+';

    document.querySelectorAll('.cx-role-pill-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === 'All Roles');
    });

    loadPlayers();
  }

  // 3. TEAMS VIEW CONTROLLER
  async function loadTeams() {
    activateView('view-teams');
    const container = document.getElementById('teamsGrid');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 3rem;">Loading franchise teams and statistics...</div>';

    try {
      const res = await API.getTeams();
      const teams = res.teams || [];

      container.innerHTML = teams.map(t => `
        <div class="cx-kpi-card" style="border-top: 4px solid ${t.primary_color}; cursor: pointer;" onclick="Router.navigate('/team/${t.id}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
              <span class="cx-badge" style="background: ${t.primary_color}22; color: ${t.primary_color}; border: 1px solid ${t.primary_color}; margin-bottom: 0.35rem;">
                ${t.code}
              </span>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #ffffff;">${t.name}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${t.city} • Home: ${t.home_ground}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.5rem; font-weight: 900; color: var(--accent-gold);">${t.championships} 🏆</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Titles</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; background: rgba(0,0,0,0.25); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Squad Size</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #ffffff;">${t.squad_count} Players</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Avg Performance</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-green);">${t.avg_performance_score || 'N/A'}</div>
            </div>
          </div>

          ${t.star_player ? `
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
              ⭐ Key Star: <strong>${t.star_player.name}</strong> (${t.star_player.performance_score} score)
            </div>
          ` : ''}

          <div style="display: flex; gap: 0.5rem;">
            <a href="#/team/${t.id}" class="cx-btn cx-btn-sm cx-btn-primary" style="flex: 1;">View Squad Analytics &rarr;</a>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">${e.message}</div>`;
    }
  }

  // 4. TEAM DETAIL VIEW CONTROLLER
  async function loadTeamDetail(id) {
    activateView('view-team-detail');
    const container = document.getElementById('view-team-detail');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 4rem;">Loading team squad analysis...</div>';

    try {
      const data = await API.getTeam(id);
      if (!data.success) return;

      const { team, squad, teamAnalytics } = data;

      container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <a href="#/teams" class="cx-btn cx-btn-sm cx-btn-secondary">&larr; Back to Teams</a>
        </div>

        <div class="cx-profile-hero" style="border-top: 4px solid ${team.primary_color};">
          <div>
            <div class="cx-badge" style="background: ${team.primary_color}33; color: #ffffff; border: 1px solid ${team.primary_color}; margin-bottom: 0.5rem;">
              ${team.code} Franchise
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 0.5rem;">${team.name}</h1>
            <div style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.75rem;">
              🏟️ <strong>Home Ground:</strong> ${team.home_ground} • 👨‍💼 <strong>Head Coach:</strong> ${team.coach || 'Head Coach'}
            </div>
            <div style="font-size: 1.1rem; color: var(--accent-gold); font-weight: 800;">
              🏆 ${team.championships} Championship Trophies
            </div>
          </div>

          <div class="cx-profile-score-box">
            <div>
              <div class="cx-profile-score-label">Team Squad Average Score</div>
              <div class="cx-profile-score-num">${teamAnalytics.avg_performance}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${teamAnalytics.squad_size} Registered Players</div>
            </div>
          </div>
        </div>

        <!-- Squad Balance Metrics -->
        <div class="cx-kpi-grid" style="margin-bottom: 2rem;">
          <div class="cx-kpi-card" style="--kpi-accent: #38bdf8;">
            <div class="cx-kpi-head"><span class="cx-kpi-title">Batting Rating</span><span>🏏</span></div>
            <div class="cx-kpi-value">${teamAnalytics.avg_batting}</div>
            <div class="cx-kpi-sub">Squad Average</div>
          </div>
          <div class="cx-kpi-card" style="--kpi-accent: #f43f5e;">
            <div class="cx-kpi-head"><span class="cx-kpi-title">Bowling Rating</span><span>🎯</span></div>
            <div class="cx-kpi-value">${teamAnalytics.avg_bowling}</div>
            <div class="cx-kpi-sub">Squad Average</div>
          </div>
          <div class="cx-kpi-card" style="--kpi-accent: #10b981;">
            <div class="cx-kpi-head"><span class="cx-kpi-title">Fielding Sharpness</span><span>🧤</span></div>
            <div class="cx-kpi-value">${teamAnalytics.avg_fielding}</div>
            <div class="cx-kpi-sub">Squad Average</div>
          </div>
          <div class="cx-kpi-card" style="--kpi-accent: #fbbf24;">
            <div class="cx-kpi-head"><span class="cx-kpi-title">Fitness Index</span><span>⚡</span></div>
            <div class="cx-kpi-value">${teamAnalytics.avg_fitness}</div>
            <div class="cx-kpi-sub">Squad Average</div>
          </div>
        </div>

        <!-- Squad Player Roster Table -->
        <div class="cx-table-wrap">
          <div style="padding: 1rem 1.25rem; font-weight: 800; color: #ffffff; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <span>👥 ${team.name} Player Squad (${squad.length})</span>
            <button class="cx-btn cx-btn-sm cx-btn-primary" onclick="Router.navigate('/playing-xi')">Generate Team XI &rarr;</button>
          </div>
          <table class="cx-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Role</th>
                <th>Country</th>
                <th class="text-right">Batting Score</th>
                <th class="text-right">Bowling Score</th>
                <th class="text-right">Fitness Score</th>
                <th class="text-right">Performance Score</th>
                <th>Classification</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${squad.map(p => `
                <tr>
                  <td>
                    <div class="cx-table-player-cell" onclick="Router.navigate('/player/${p.id}')" style="cursor: pointer;">
                      <div style="font-weight: 700; color: #ffffff;">${p.name}</div>
                    </div>
                  </td>
                  <td><span class="cx-badge badge-role">${p.role}</span></td>
                  <td style="color: var(--text-secondary);">${p.country}</td>
                  <td class="text-right" style="color: #38bdf8;">${p.batting_score}</td>
                  <td class="text-right" style="color: #f43f5e;">${p.bowling_score}</td>
                  <td class="text-right" style="color: #fbbf24;">${p.fitness_score}</td>
                  <td class="text-right" style="font-weight: 800; color: var(--accent-green); font-size: 1.05rem;">${p.performance_score}</td>
                  <td>
                    <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : 'badge-good'}">${p.category}</span>
                  </td>
                  <td class="text-right">
                    <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-primary">Profile</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">${e.message}</div>`;
    }
  }

  // 5. RANKINGS VIEW CONTROLLER
  async function loadRankings(activeTab = 'overall') {
    activateView('view-rankings');
    const container = document.getElementById('view-rankings');
    if (!container) return;

    container.innerHTML = `
      <div class="cx-section-head">
        <div class="cx-section-title-wrap">
          <h2>🏆 Official CricketX Player Rankings</h2>
          <p>Global leaderboards based on the weighted 4-factor performance formula.</p>
        </div>
      </div>

      <div class="cx-profile-tabs" style="margin-bottom: 2rem;">
        <button class="cx-profile-tab-btn ${activeTab === 'overall' ? 'active' : ''}" onclick="App.loadRankings('overall')">🌟 Overall Index</button>
        <button class="cx-profile-tab-btn ${activeTab === 'batsmen' ? 'active' : ''}" onclick="App.loadRankings('batsmen')">🏏 Top Batsmen</button>
        <button class="cx-profile-tab-btn ${activeTab === 'bowlers' ? 'active' : ''}" onclick="App.loadRankings('bowlers')">🎯 Top Bowlers</button>
        <button class="cx-profile-tab-btn ${activeTab === 'allrounders' ? 'active' : ''}" onclick="App.loadRankings('allrounders')">⚡ All-Rounders</button>
        <button class="cx-profile-tab-btn ${activeTab === 'wicketkeepers' ? 'active' : ''}" onclick="App.loadRankings('wicketkeepers')">🧤 Wicketkeepers</button>
      </div>

      <div id="rankingsTableArea">
        <div style="text-align: center; padding: 3rem;">Calculating rankings standings...</div>
      </div>
    `;

    try {
      const data = await API.getRankings();
      if (!data.success) return;

      const list = data.rankings[activeTab] || [];
      const tableArea = document.getElementById('rankingsTableArea');
      if (!tableArea) return;

      // Render top 3 podium if at least 3 players exist
      let podiumHtml = '';
      if (list.length >= 3) {
        const [r1, r2, r3] = list;
        podiumHtml = `
          <div class="cx-podium-wrap">
            <!-- Rank 2 (Silver) -->
            <div class="cx-podium-step rank-2" onclick="Router.navigate('/player/${r2.id}')" style="cursor: pointer;">
              <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🥈</div>
              <div style="font-weight: 800; color: #ffffff; font-size: 1.05rem;">${r2.name}</div>
              <div style="color: var(--accent-gold); font-size: 0.8rem; margin-bottom: 0.5rem;">${r2.team_short_name || 'Independent'}</div>
              <div class="cx-podium-block">
                <div style="font-size: 1.8rem; font-weight: 900; color: #ffffff;">${r2.performance_score}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Rank #2</div>
              </div>
            </div>

            <!-- Rank 1 (Gold) -->
            <div class="cx-podium-step rank-1" onclick="Router.navigate('/player/${r1.id}')" style="cursor: pointer;">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">👑 🥇</div>
              <div style="font-weight: 900; color: #ffffff; font-size: 1.25rem;">${r1.name}</div>
              <div style="color: var(--accent-gold); font-size: 0.85rem; margin-bottom: 0.5rem;">${r1.team_short_name || 'Independent'}</div>
              <div class="cx-podium-block">
                <div style="font-size: 2.3rem; font-weight: 900; color: var(--accent-gold);">${r1.performance_score}</div>
                <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 800; text-transform: uppercase;">Leader #1</div>
              </div>
            </div>

            <!-- Rank 3 (Bronze) -->
            <div class="cx-podium-step rank-3" onclick="Router.navigate('/player/${r3.id}')" style="cursor: pointer;">
              <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🥉</div>
              <div style="font-weight: 800; color: #ffffff; font-size: 1.05rem;">${r3.name}</div>
              <div style="color: var(--accent-gold); font-size: 0.8rem; margin-bottom: 0.5rem;">${r3.team_short_name || 'Independent'}</div>
              <div class="cx-podium-block">
                <div style="font-size: 1.8rem; font-weight: 900; color: #ffffff;">${r3.performance_score}</div>
                <div style="font-size: 0.75rem; color: #b45309; text-transform: uppercase;">Rank #3</div>
              </div>
            </div>
          </div>
        `;
      }

      tableArea.innerHTML = `
        ${podiumHtml}

        <div class="cx-table-wrap">
          <table class="cx-table">
            <thead>
              <tr>
                <th style="width: 60px;">Rank</th>
                <th>Player</th>
                <th>Role</th>
                <th>Team</th>
                <th class="text-right">Batting Score</th>
                <th class="text-right">Bowling Score</th>
                <th class="text-right">Fitness Score</th>
                <th class="text-right">Performance Score</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((p, idx) => {
                const rankNum = idx + 1;
                const medal = rankNum === 1 ? '🥇 ' : rankNum === 2 ? '🥈 ' : rankNum === 3 ? '🥉 ' : '';
                return `
                  <tr>
                    <td style="font-weight: 800; color: ${rankNum <= 3 ? 'var(--accent-gold)' : 'var(--text-muted)'}; font-size: 1rem;">
                      ${medal}${rankNum}
                    </td>
                    <td>
                      <div class="cx-table-player-cell" onclick="Router.navigate('/player/${p.id}')" style="cursor: pointer;">
                        <span style="font-weight: 700; color: #ffffff;">${p.name}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">(${p.country})</span>
                      </div>
                    </td>
                    <td><span class="cx-badge badge-role">${p.role}</span></td>
                    <td style="color: var(--accent-gold); font-weight: 600;">${p.team_short_name || 'Independent'}</td>
                    <td class="text-right" style="color: #38bdf8;">${p.batting_score}</td>
                    <td class="text-right" style="color: #f43f5e;">${p.bowling_score}</td>
                    <td class="text-right" style="color: #fbbf24;">${p.fitness_score}</td>
                    <td class="text-right" style="font-weight: 800; color: var(--accent-green); font-size: 1.1rem;">${p.performance_score}</td>
                    <td><span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : 'badge-good'}">${p.category}</span></td>
                    <td class="text-right">
                      <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-primary">Profile</a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">${e.message}</div>`;
    }
  }

  // 6. PUBLIC ADD PLAYER FORM
  function loadAddPlayer() {
    activateView('view-add-player');
    const container = document.getElementById('view-add-player');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width: 840px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-lg);">
        <div style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.8rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">
            ➕ Submit Cricket Player Record for Performance Indexing
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">
            Enter player metrics. The formula automatically computes the official CricketX score in real-time. Public submissions will appear in the Admin Verification Queue.
          </p>
        </div>

        <form id="publicAddPlayerForm" onsubmit="App.handlePublicAddPlayer(event)">
          <!-- Core Info -->
          <div class="cx-form-grid" style="margin-bottom: 1.75rem;">
            <div class="cx-form-group">
              <label class="cx-label">Player Full Name *</label>
              <input type="text" id="pubName" class="cx-input" required placeholder="e.g. Sanju Samson" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Country / Nationality *</label>
              <input type="text" id="pubCountry" class="cx-input" required value="India" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Playing Role *</label>
              <select id="pubRole" class="cx-select" required>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Franchise / Team</label>
              <select id="pubTeam" class="cx-select">
                <option value="1">Chennai Super Kings (CSK)</option>
                <option value="2">Mumbai Indians (MI)</option>
                <option value="3">Royal Challengers Bengaluru (RCB)</option>
                <option value="4">Kolkata Knight Riders (KKR)</option>
                <option value="5">Gujarat Titans (GT)</option>
                <option value="6">Rajasthan Royals (RR)</option>
                <option value="7">Sunrisers Hyderabad (SRH)</option>
                <option value="8">Delhi Capitals (DC)</option>
              </select>
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Jersey Number</label>
              <input type="number" id="pubJersey" class="cx-input" placeholder="e.g. 18" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Photo URL (Optional)</label>
              <input type="url" id="pubPhoto" class="cx-input" placeholder="https://..." />
            </div>
          </div>

          <!-- The Official Formula Factor Inputs -->
          <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 1.05rem; margin-bottom: 0.35rem;">
              ⚡ Official 4-Factor Performance Scoring (0 - 100)
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              Formula: (Batting × 40%) + (Bowling × 25%) + (Fielding × 20%) + (Fitness × 15%)
            </div>

            <div class="cx-form-grid" style="margin-bottom: 1.25rem;">
              <div class="cx-form-group">
                <label class="cx-label">Batting Factor (40%) *</label>
                <input type="number" id="pubBat" class="cx-input" min="0" max="100" required value="85" oninput="App.updatePublicScorePreview()" />
                <span class="cx-form-helper">Score between 0 and 100</span>
              </div>

              <div class="cx-form-group">
                <label class="cx-label">Bowling Factor (25%) *</label>
                <input type="number" id="pubBowl" class="cx-input" min="0" max="100" required value="40" oninput="App.updatePublicScorePreview()" />
                <span class="cx-form-helper">Score between 0 and 100</span>
              </div>

              <div class="cx-form-group">
                <label class="cx-label">Fielding Factor (20%) *</label>
                <input type="number" id="pubField" class="cx-input" min="0" max="100" required value="88" oninput="App.updatePublicScorePreview()" />
                <span class="cx-form-helper">Score between 0 and 100</span>
              </div>

              <div class="cx-form-group">
                <label class="cx-label">Fitness Factor (15%) *</label>
                <input type="number" id="pubFit" class="cx-input" min="0" max="100" required value="92" oninput="App.updatePublicScorePreview()" />
                <span class="cx-form-helper">Score between 0 and 100</span>
              </div>
            </div>

            <!-- Live Score Result Box -->
            <div style="background: rgba(0, 208, 132, 0.12); border: 1px solid var(--accent-green); border-radius: var(--radius-md); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Calculated Performance Score</div>
                <div id="pubScoreResult" style="font-size: 2.2rem; font-weight: 900; color: var(--accent-green); line-height: 1;">
                  75.40 / 100
                </div>
              </div>
              <div style="text-align: right;">
                <div id="pubCategoryBadge" class="cx-badge badge-good" style="font-size: 0.95rem; padding: 0.4rem 1rem;">Good</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem;">Status: Pending Verification</div>
              </div>
            </div>
          </div>

          <!-- Extended Career Stats (Optional but recommended) -->
          <div style="font-weight: 700; color: #ffffff; margin-bottom: 1rem;">
            🏏 Additional Career Statistics (Optional)
          </div>

          <div class="cx-form-grid" style="margin-bottom: 2rem;">
            <div class="cx-form-group">
              <label class="cx-label">Matches</label>
              <input type="number" id="pubMatches" class="cx-input" value="25" />
            </div>
            <div class="cx-form-group">
              <label class="cx-label">Career Runs</label>
              <input type="number" id="pubRuns" class="cx-input" value="780" />
            </div>
            <div class="cx-form-group">
              <label class="cx-label">Batting Average</label>
              <input type="number" step="0.01" id="pubAvg" class="cx-input" value="35.4" />
            </div>
            <div class="cx-form-group">
              <label class="cx-label">Batting Strike Rate</label>
              <input type="number" step="0.01" id="pubSR" class="cx-input" value="138.2" />
            </div>
            <div class="cx-form-group">
              <label class="cx-label">Career Wickets</label>
              <input type="number" id="pubWkts" class="cx-input" value="5" />
            </div>
            <div class="cx-form-group">
              <label class="cx-label">Catches</label>
              <input type="number" id="pubCatches" class="cx-input" value="12" />
            </div>
          </div>

          <button type="submit" id="pubSubmitBtn" class="cx-btn cx-btn-primary cx-btn-lg" style="width: 100%;">
            🚀 Submit Player for Verification & Analysis &rarr;
          </button>
        </form>
      </div>
    `;

    updatePublicScorePreview();
  }

  function updatePublicScorePreview() {
    const b = Number(document.getElementById('pubBat')?.value) || 0;
    const bo = Number(document.getElementById('pubBowl')?.value) || 0;
    const f = Number(document.getElementById('pubField')?.value) || 0;
    const fit = Number(document.getElementById('pubFit')?.value) || 0;

    const score = (b * 0.40) + (bo * 0.25) + (f * 0.20) + (fit * 0.15);
    const rounded = score.toFixed(2);

    let cat = 'Needs Improvement';
    let catClass = 'badge-needs-improvement';
    if (score >= 85) { cat = 'Excellent'; catClass = 'badge-excellent'; }
    else if (score >= 70) { cat = 'Good'; catClass = 'badge-good'; }
    else if (score >= 50) { cat = 'Average'; catClass = 'badge-average'; }

    const resEl = document.getElementById('pubScoreResult');
    const badgeEl = document.getElementById('pubCategoryBadge');

    if (resEl) resEl.textContent = `${rounded} / 100`;
    if (badgeEl) {
      badgeEl.textContent = cat;
      badgeEl.className = `cx-badge ${catClass}`;
    }
  }

  async function handlePublicAddPlayer(e) {
    e.preventDefault();
    const btn = document.getElementById('pubSubmitBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Submitting record...';
    }

    try {
      const payload = {
        name: document.getElementById('pubName').value,
        country: document.getElementById('pubCountry').value,
        role: document.getElementById('pubRole').value,
        team_id: document.getElementById('pubTeam').value,
        jersey_number: document.getElementById('pubJersey').value,
        photo_url: document.getElementById('pubPhoto').value,
        batting_score: document.getElementById('pubBat').value,
        bowling_score: document.getElementById('pubBowl').value,
        fielding_score: document.getElementById('pubField').value,
        fitness_score: document.getElementById('pubFit').value,
        batting: {
          matches: document.getElementById('pubMatches').value,
          runs: document.getElementById('pubRuns').value,
          batting_average: document.getElementById('pubAvg').value,
          strike_rate: document.getElementById('pubSR').value
        },
        bowling: {
          matches: document.getElementById('pubMatches').value,
          wickets: document.getElementById('pubWkts').value
        },
        fielding: {
          catches: document.getElementById('pubCatches').value
        }
      };

      const res = await API.createPlayer(payload);
      showToast(res.message || 'Player record submitted successfully!', 'success');
      Router.navigate(`/player/${res.player_id}`);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Submit Player for Verification & Analysis →';
      }
    }
  }

  // Initial Setup
  function init() {
    updateAuthUI();
    updateComparePill();

    // Listen for auth changes
    window.addEventListener('auth-changed', () => {
      updateAuthUI();
    });

    // Register routes
    Router.register('/', () => loadDashboard());
    Router.register('/dashboard', () => loadDashboard());
    Router.register('/players', ({ query }) => loadPlayers(query));
    Router.register('/player/:id', ({ params }) => {
      activateView('view-profile');
      ProfileView.load(params.id);
    });
    Router.register('/teams', () => loadTeams());
    Router.register('/team/:id', ({ params }) => loadTeamDetail(params.id));
    Router.register('/compare', () => {
      activateView('view-compare');
      CompareView.load(comparisonQueue);
    });
    Router.register('/rankings', () => loadRankings());
    Router.register('/playing-xi', () => {
      activateView('view-playing-xi');
      PlayingXIView.load();
    });
    Router.register('/add-player', () => loadAddPlayer());
    Router.register('/admin', () => {
      activateView('view-admin');
      AdminView.load();
    });

    // Mobile nav hamburger toggle
    document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
      document.querySelector('.cx-nav')?.classList.toggle('mobile-open');
    });

    // Header Quick Search handler
    const headerSearch = document.getElementById('headerQuickSearch');
    if (headerSearch) {
      headerSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = headerSearch.value.trim();
          Router.navigate(`/players?search=${encodeURIComponent(val)}`);
        }
      });
    }

    // Keyboard shortcut '/' to search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        headerSearch?.focus();
      }
    });

    // Start router
    Router.init();
  }

  return {
    init,
    showToast,
    openModal,
    closeModal,
    getComparisonQueue,
    toggleComparePlayer,
    removeFromCompare,
    clearCompare,
    openCompareSelectorModal,
    loadDashboard,
    loadPlayers,
    handleFilterChange,
    handleRoleFilter,
    handleMinScoreChange,
    toggleDirectoryView,
    resetPlayerFilters,
    loadTeams,
    loadTeamDetail,
    loadRankings,
    loadAddPlayer,
    updatePublicScorePreview,
    handlePublicAddPlayer
  };
})();

// Bootstrap app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
