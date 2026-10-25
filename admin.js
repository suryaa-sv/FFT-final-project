/* ==========================================================================
   CRICKETX — ADMIN PORTAL & RECORD MANAGEMENT
   Secure admin login, pending submissions review, player editing, deletions, re-seeding
   ========================================================================== */

const AdminView = (() => {
  let activeTab = 'pending';
  let allPlayersCache = [];

  async function load() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    const isLoggedIn = API.isAdminLoggedIn();
    if (!isLoggedIn) {
      renderLoginForm(container);
      return;
    }

    renderDashboard(container);
  }

  function renderLoginForm(container) {
    container.innerHTML = `
      <div style="max-width: 480px; margin: 3rem auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 54px; height: 54px; background: rgba(0, 208, 132, 0.12); border: 1px solid var(--accent-green); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; font-size: 1.5rem;">
            🔒
          </div>
          <h2 style="font-size: 1.6rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">Admin Authentication</h2>
          <p style="color: var(--text-secondary); font-size: 0.88rem;">Sign in to access verified player record management and approval queue.</p>
        </div>

        <form id="adminLoginForm" onsubmit="AdminView.handleLogin(event)">
          <div class="cx-form-group" style="margin-bottom: 1.25rem;">
            <label class="cx-label" for="loginUsername">Admin Username</label>
            <input type="text" id="loginUsername" class="cx-input" placeholder="admin" required autocomplete="username" />
          </div>

          <div class="cx-form-group" style="margin-bottom: 1.5rem;">
            <label class="cx-label" for="loginPassword">Password</label>
            <input type="password" id="loginPassword" class="cx-input" placeholder="••••••••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" id="loginSubmitBtn" class="cx-btn cx-btn-primary" style="width: 100%; margin-bottom: 1rem;">
            Secure Sign In &rarr;
          </button>
        </form>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--border-light); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.8rem; color: var(--text-muted); text-align: center;">
          <div style="font-weight: 700; color: var(--accent-gold); margin-bottom: 0.25rem;">⚡ Demo Credentials</div>
          <div>Username: <code style="color: #ffffff;">admin</code> | Password: <code style="color: #ffffff;">Admin@CricketX2025</code></div>
          <button type="button" class="cx-btn cx-btn-sm cx-btn-secondary" style="margin-top: 0.5rem;" onclick="AdminView.fillDemoCredentials()">
            Autofill Demo Credentials
          </button>
        </div>
      </div>
    `;
  }

  function fillDemoCredentials() {
    const u = document.getElementById('loginUsername');
    const p = document.getElementById('loginPassword');
    if (u) u.value = 'admin';
    if (p) p.value = 'Admin@CricketX2025';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn');
    const u = document.getElementById('loginUsername')?.value;
    const p = document.getElementById('loginPassword')?.value;

    if (!u || !p) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Authenticating...';
    }

    try {
      await API.login(u, p);
      App.showToast('Authentication successful. Welcome, Admin!', 'success');
      load();
    } catch (err) {
      App.showToast(err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Secure Sign In →';
      }
    }
  }

  async function renderDashboard(container) {
    const user = API.getCurrentUser() || { name: 'Admin', role: 'Administrator' };

    container.innerHTML = `
      <div class="cx-section-head">
        <div class="cx-section-title-wrap">
          <h2>🛡️ CricketX Admin Operations Portal</h2>
          <p>Logged in as <strong>${user.name}</strong> (${user.role})</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="cx-btn cx-btn-secondary" onclick="AdminView.promptResetDb()">
            🔄 Reset / Re-seed Demo DB
          </button>
          <button class="cx-btn cx-btn-danger" onclick="AdminView.handleLogout()">
            🚪 Log Out
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="cx-profile-tabs" style="margin-bottom: 2rem;">
        <button class="cx-profile-tab-btn ${activeTab === 'pending' ? 'active' : ''}" onclick="AdminView.switchTab('pending')">
          ⏳ Pending Approvals Queue <span id="adminPendingCountBadge" class="cx-badge badge-pending" style="margin-left: 0.35rem; font-size: 0.7rem;">0</span>
        </button>
        <button class="cx-profile-tab-btn ${activeTab === 'manage' ? 'active' : ''}" onclick="AdminView.switchTab('manage')">
          👥 Manage All Players
        </button>
        <button class="cx-profile-tab-btn ${activeTab === 'direct-add' ? 'active' : ''}" onclick="AdminView.switchTab('direct-add')">
          ➕ Direct Add Verified Player
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="adminTabContent"></div>
    `;

    loadTabContent();
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.cx-profile-tab-btn').forEach(btn => btn.classList.remove('active'));
    loadTabContent();
  }

  async function loadTabContent() {
    const content = document.getElementById('adminTabContent');
    if (!content) return;

    if (activeTab === 'pending') {
      renderPendingTab(content);
    } else if (activeTab === 'manage') {
      renderManageTab(content);
    } else if (activeTab === 'direct-add') {
      renderDirectAddTab(content);
    }
  }

  // 1. Pending Approvals Queue
  async function renderPendingTab(content) {
    content.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <p style="color: var(--text-secondary);">Loading pending player verification requests...</p>
      </div>
    `;

    try {
      const res = await API.getPlayers({ status: 'pending', limit: 100 });
      const pendingPlayers = res.players || [];

      // Update badge
      const badge = document.getElementById('adminPendingCountBadge');
      if (badge) badge.textContent = pendingPlayers.length;

      if (pendingPlayers.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; padding: 4rem 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">All Caught Up!</h3>
            <p style="color: var(--text-secondary); max-width: 450px; margin: 0 auto 1.5rem auto;">
              No player records are currently waiting for verification review.
            </p>
            <a href="#/add-player" class="cx-btn cx-btn-outline-green">Submit a Test Player Record</a>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="cx-table-wrap">
          <table class="cx-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Role & Team</th>
                <th>Country</th>
                <th class="text-right">Batting</th>
                <th class="text-right">Bowling</th>
                <th class="text-right">Fielding</th>
                <th class="text-right">Fitness</th>
                <th class="text-right">Score</th>
                <th>Classification</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingPlayers.map(p => `
                <tr>
                  <td>
                    <div style="font-weight: 800; color: #ffffff;">${p.name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">Submitted: ${p.submitted_by || 'Public'}</div>
                  </td>
                  <td>
                    <div><span class="cx-badge badge-role">${p.role}</span></div>
                    <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 2px;">${p.team_short_name || 'Independent'}</div>
                  </td>
                  <td style="color: var(--text-secondary);">${p.country}</td>
                  <td class="text-right">${p.batting_score}</td>
                  <td class="text-right">${p.bowling_score}</td>
                  <td class="text-right">${p.fielding_score}</td>
                  <td class="text-right">${p.fitness_score}</td>
                  <td class="text-right" style="font-weight: 800; color: var(--accent-green);">${p.performance_score}</td>
                  <td>
                    <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : p.category === 'Good' ? 'badge-good' : 'badge-average'}">
                      ${p.category}
                    </span>
                  </td>
                  <td class="text-right">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                      <button class="cx-btn cx-btn-sm cx-btn-primary" onclick="AdminView.approvePlayer(${p.id})">
                        ✓ Approve
                      </button>
                      <button class="cx-btn cx-btn-sm cx-btn-danger" onclick="AdminView.rejectPlayer(${p.id})">
                        ✕ Reject
                      </button>
                      <a href="#/player/${p.id}" class="cx-btn cx-btn-sm cx-btn-secondary">
                        Profile
                      </a>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 2rem;">${err.message}</div>`;
    }
  }

  // 2. Manage All Players Tab
  async function renderManageTab(content) {
    content.innerHTML = `
      <div style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <input 
          type="text" 
          id="adminPlayerSearchInput" 
          class="cx-input" 
          placeholder="Filter players by name or team..." 
          style="max-width: 350px;"
          onkeyup="AdminView.filterManageList()"
        />
        <div style="font-size: 0.85rem; color: var(--text-secondary);" id="managePlayerCountText">
          Loading player roster...
        </div>
      </div>
      <div id="managePlayersTableWrap"></div>
    `;

    try {
      const res = await API.getPlayers({ status: 'all', limit: 200 });
      allPlayersCache = res.players || [];
      displayManageList(allPlayersCache);
    } catch (err) {
      document.getElementById('managePlayersTableWrap').innerHTML = `<div style="color: var(--color-danger);">${err.message}</div>`;
    }
  }

  function filterManageList() {
    const q = document.getElementById('adminPlayerSearchInput')?.value.toLowerCase().trim() || '';
    const filtered = allPlayersCache.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.team_name && p.team_name.toLowerCase().includes(q)) ||
      (p.country && p.country.toLowerCase().includes(q))
    );
    displayManageList(filtered);
  }

  function displayManageList(list) {
    const wrap = document.getElementById('managePlayersTableWrap');
    const countText = document.getElementById('managePlayerCountText');
    if (countText) countText.textContent = `Showing ${list.length} total players`;
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="cx-table-wrap">
        <table class="cx-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Player</th>
              <th>Role</th>
              <th>Team</th>
              <th>Status</th>
              <th class="text-right">Performance Score</th>
              <th>Category</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(p => `
              <tr>
                <td style="color: var(--text-muted); font-size: 0.8rem;">#${p.id}</td>
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
                <td>
                  <span class="cx-badge ${p.category === 'Excellent' ? 'badge-excellent' : p.category === 'Good' ? 'badge-good' : 'badge-average'}">
                    ${p.category}
                  </span>
                </td>
                <td class="text-right">
                  <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                    <button class="cx-btn cx-btn-sm cx-btn-secondary" onclick="AdminView.openEditModal(${p.id})">
                      ✏️ Edit
                    </button>
                    <button class="cx-btn cx-btn-sm cx-btn-danger" onclick="AdminView.deletePlayer(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. Direct Add Verified Player Tab
  function renderDirectAddTab(content) {
    content.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2rem; max-width: 900px; margin: 0 auto;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">Direct Add Verified Player</h3>
        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 1.75rem;">
          Player records created here are instantly marked as <strong>Verified</strong> and published directly to all leaderboards.
        </p>

        <form id="adminDirectAddForm" onsubmit="AdminView.handleDirectAdd(event)">
          <div class="cx-form-grid" style="margin-bottom: 1.5rem;">
            <div class="cx-form-group">
              <label class="cx-label">Player Full Name *</label>
              <input type="text" id="directName" class="cx-input" required placeholder="e.g. Yashasvi Jaiswal" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Country *</label>
              <input type="text" id="directCountry" class="cx-input" required value="India" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Playing Role *</label>
              <select id="directRole" class="cx-select" required>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Franchise / Team</label>
              <select id="directTeam" class="cx-select">
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
              <input type="number" id="directJersey" class="cx-input" placeholder="e.g. 64" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Photo Image URL</label>
              <input type="url" id="directPhoto" class="cx-input" placeholder="https://example.com/photo.jpg" />
            </div>
          </div>

          <div style="font-weight: 800; color: var(--accent-gold); font-size: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
            Performance Factor Scores (0 - 100)
          </div>

          <div class="cx-form-grid" style="margin-bottom: 1.5rem;">
            <div class="cx-form-group">
              <label class="cx-label">Batting Score (40% weight) *</label>
              <input type="number" id="directBat" class="cx-input" min="0" max="100" required value="85" oninput="AdminView.updateLiveScorePreview('direct')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Bowling Score (25% weight) *</label>
              <input type="number" id="directBowl" class="cx-input" min="0" max="100" required value="30" oninput="AdminView.updateLiveScorePreview('direct')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Fielding Score (20% weight) *</label>
              <input type="number" id="directField" class="cx-input" min="0" max="100" required value="88" oninput="AdminView.updateLiveScorePreview('direct')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Fitness Score (15% weight) *</label>
              <input type="number" id="directFit" class="cx-input" min="0" max="100" required value="90" oninput="AdminView.updateLiveScorePreview('direct')" />
            </div>
          </div>

          <!-- Formula Score Preview Banner -->
          <div style="background: rgba(0, 208, 132, 0.1); border: 1px solid var(--accent-green); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.75rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Calculated Performance Score</div>
              <div id="directScoreResult" style="font-size: 1.75rem; font-weight: 900; color: var(--accent-green);">82.60 / 100</div>
            </div>
            <div id="directCategoryBadge" class="cx-badge badge-good">Good</div>
          </div>

          <button type="submit" class="cx-btn cx-btn-primary cx-btn-lg" style="width: 100%;">
            Publish Verified Player Record &rarr;
          </button>
        </form>
      </div>
    `;

    updateLiveScorePreview('direct');
  }

  function updateLiveScorePreview(prefix) {
    const b = Number(document.getElementById(`${prefix}Bat`)?.value) || 0;
    const bo = Number(document.getElementById(`${prefix}Bowl`)?.value) || 0;
    const f = Number(document.getElementById(`${prefix}Field`)?.value) || 0;
    const fit = Number(document.getElementById(`${prefix}Fit`)?.value) || 0;

    const score = (b * 0.40) + (bo * 0.25) + (f * 0.20) + (fit * 0.15);
    const rounded = score.toFixed(2);

    let cat = 'Needs Improvement';
    let catClass = 'badge-needs-improvement';
    if (score >= 85) { cat = 'Excellent'; catClass = 'badge-excellent'; }
    else if (score >= 70) { cat = 'Good'; catClass = 'badge-good'; }
    else if (score >= 50) { cat = 'Average'; catClass = 'badge-average'; }

    const resEl = document.getElementById(`${prefix}ScoreResult`);
    const badgeEl = document.getElementById(`${prefix}CategoryBadge`);

    if (resEl) resEl.textContent = `${rounded} / 100`;
    if (badgeEl) {
      badgeEl.textContent = cat;
      badgeEl.className = `cx-badge ${catClass}`;
    }
  }

  async function handleDirectAdd(e) {
    e.preventDefault();
    try {
      const payload = {
        name: document.getElementById('directName').value,
        country: document.getElementById('directCountry').value,
        role: document.getElementById('directRole').value,
        team_id: document.getElementById('directTeam').value,
        jersey_number: document.getElementById('directJersey').value,
        photo_url: document.getElementById('directPhoto').value,
        batting_score: document.getElementById('directBat').value,
        bowling_score: document.getElementById('directBowl').value,
        fielding_score: document.getElementById('directField').value,
        fitness_score: document.getElementById('directFit').value,
        batting: {
          matches: 15,
          innings: 15,
          runs: 450,
          highest_score: '88',
          batting_average: 34.6,
          strike_rate: 138.5,
          hundreds: 0,
          fifties: 3
        },
        bowling: {
          matches: 15,
          wickets: 2,
          economy_rate: 8.2
        },
        fielding: { catches: 8, run_outs: 1, stumpings: 0 }
      };

      const res = await API.createPlayer(payload);
      App.showToast(`Verified player created! Performance score: ${res.performance_score}`, 'success');
      switchTab('manage');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function approvePlayer(id) {
    try {
      await API.updatePlayerStatus(id, 'verified');
      App.showToast('Player record verified successfully!', 'success');
      loadTabContent();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function rejectPlayer(id) {
    if (!confirm('Are you sure you want to reject this player submission?')) return;
    try {
      await API.updatePlayerStatus(id, 'rejected');
      App.showToast('Player record rejected.', 'warning');
      loadTabContent();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function deletePlayer(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await API.deletePlayer(id);
      App.showToast(`Deleted player #${id}`, 'success');
      allPlayersCache = allPlayersCache.filter(p => p.id !== id);
      displayManageList(allPlayersCache);
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function openEditModal(id) {
    try {
      const data = await API.getPlayer(id);
      if (!data.success || !data.player) return;

      const p = data.player;
      const b = data.batting || {};
      const bo = data.bowling || {};
      const f = data.fielding || {};

      const modalBody = document.getElementById('editModalBody');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <form id="editPlayerForm" onsubmit="AdminView.submitPlayerEdit(event, ${p.id})">
          <div class="cx-form-grid" style="margin-bottom: 1.25rem;">
            <div class="cx-form-group">
              <label class="cx-label">Name</label>
              <input type="text" id="editName" class="cx-input" required value="${p.name}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Role</label>
              <select id="editRole" class="cx-select" required>
                <option value="Batsman" ${p.role === 'Batsman' ? 'selected' : ''}>Batsman</option>
                <option value="Bowler" ${p.role === 'Bowler' ? 'selected' : ''}>Bowler</option>
                <option value="All-Rounder" ${p.role === 'All-Rounder' ? 'selected' : ''}>All-Rounder</option>
                <option value="Wicketkeeper" ${p.role === 'Wicketkeeper' ? 'selected' : ''}>Wicketkeeper</option>
              </select>
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Country</label>
              <input type="text" id="editCountry" class="cx-input" required value="${p.country}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Team ID (1-8)</label>
              <input type="number" id="editTeamId" class="cx-input" value="${p.team_id || 1}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Jersey Number</label>
              <input type="number" id="editJersey" class="cx-input" value="${p.jersey_number || ''}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Verification Status</label>
              <select id="editStatus" class="cx-select">
                <option value="verified" ${p.verification_status === 'verified' ? 'selected' : ''}>verified</option>
                <option value="pending" ${p.verification_status === 'pending' ? 'selected' : ''}>pending</option>
                <option value="rejected" ${p.verification_status === 'rejected' ? 'selected' : ''}>rejected</option>
              </select>
            </div>
          </div>

          <div style="font-weight: 700; color: var(--accent-gold); margin-bottom: 0.75rem;">
            Performance Scores (0 - 100)
          </div>

          <div class="cx-form-grid" style="margin-bottom: 1.25rem;">
            <div class="cx-form-group">
              <label class="cx-label">Batting Score (40%)</label>
              <input type="number" id="editBat" class="cx-input" min="0" max="100" required value="${p.batting_score}" oninput="AdminView.updateLiveScorePreview('edit')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Bowling Score (25%)</label>
              <input type="number" id="editBowl" class="cx-input" min="0" max="100" required value="${p.bowling_score}" oninput="AdminView.updateLiveScorePreview('edit')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Fielding Score (20%)</label>
              <input type="number" id="editField" class="cx-input" min="0" max="100" required value="${p.fielding_score}" oninput="AdminView.updateLiveScorePreview('edit')" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Fitness Score (15%)</label>
              <input type="number" id="editFit" class="cx-input" min="0" max="100" required value="${p.fitness_score}" oninput="AdminView.updateLiveScorePreview('edit')" />
            </div>
          </div>

          <!-- Formula Score Preview Banner -->
          <div style="background: rgba(0, 208, 132, 0.1); border: 1px solid var(--accent-green); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Score Preview</div>
              <div id="editScoreResult" style="font-size: 1.4rem; font-weight: 900; color: var(--accent-green);">${p.performance_score} / 100</div>
            </div>
            <div id="editCategoryBadge" class="cx-badge badge-good">${p.category}</div>
          </div>

          <div style="font-weight: 700; color: var(--accent-gold); margin-bottom: 0.75rem;">
            Batting & Bowling Metrics
          </div>

          <div class="cx-form-grid" style="margin-bottom: 1.5rem;">
            <div class="cx-form-group">
              <label class="cx-label">Career Runs</label>
              <input type="number" id="editRuns" class="cx-input" value="${b.runs || 0}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Batting Avg</label>
              <input type="number" step="0.01" id="editAvg" class="cx-input" value="${b.batting_average || 0}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Strike Rate</label>
              <input type="number" step="0.01" id="editSR" class="cx-input" value="${b.strike_rate || 0}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Career Wickets</label>
              <input type="number" id="editWkts" class="cx-input" value="${bo.wickets || 0}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Bowling Economy</label>
              <input type="number" step="0.01" id="editEcon" class="cx-input" value="${bo.economy_rate || 0}" />
            </div>

            <div class="cx-form-group">
              <label class="cx-label">Catches</label>
              <input type="number" id="editCatches" class="cx-input" value="${f.catches || 0}" />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="cx-btn cx-btn-secondary" onclick="App.closeModal('editModal')">Cancel</button>
            <button type="submit" class="cx-btn cx-btn-primary">Save Changes</button>
          </div>
        </form>
      `;

      updateLiveScorePreview('edit');
      App.openModal('editModal');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function submitPlayerEdit(e, id) {
    e.preventDefault();
    try {
      const payload = {
        name: document.getElementById('editName').value,
        role: document.getElementById('editRole').value,
        country: document.getElementById('editCountry').value,
        team_id: document.getElementById('editTeamId').value,
        jersey_number: document.getElementById('editJersey').value,
        verification_status: document.getElementById('editStatus').value,
        batting_score: document.getElementById('editBat').value,
        bowling_score: document.getElementById('editBowl').value,
        fielding_score: document.getElementById('editField').value,
        fitness_score: document.getElementById('editFit').value,
        batting: {
          runs: document.getElementById('editRuns').value,
          batting_average: document.getElementById('editAvg').value,
          strike_rate: document.getElementById('editSR').value
        },
        bowling: {
          wickets: document.getElementById('editWkts').value,
          economy_rate: document.getElementById('editEcon').value
        },
        fielding: {
          catches: document.getElementById('editCatches').value
        }
      };

      await API.updatePlayer(id, payload);
      App.showToast('Player updated successfully!', 'success');
      App.closeModal('editModal');
      loadTabContent();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  async function promptResetDb() {
    if (!confirm('Are you sure you want to reset the database? This will reload the official default teams, players, and pending verification requests.')) return;
    try {
      await API.resetDatabase();
      App.showToast('Database reset and re-seeded successfully!', 'success');
      load();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  }

  function handleLogout() {
    API.logout();
    App.showToast('Signed out of Admin operations.', 'info');
    load();
  }

  return {
    load,
    handleLogin,
    fillDemoCredentials,
    switchTab,
    filterManageList,
    updateLiveScorePreview,
    handleDirectAdd,
    approvePlayer,
    rejectPlayer,
    deletePlayer,
    openEditModal,
    submitPlayerEdit,
    promptResetDb,
    handleLogout
  };
})();
