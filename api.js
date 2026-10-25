/* ==========================================================================
   CRICKETX — API CLIENT
   Unified Fetch Layer with Token Management & Error Handling
   ========================================================================== */

const API = (() => {
  const TOKEN_KEY = 'cricketx_auth_token';
  const USER_KEY = 'cricketx_auth_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setAuth(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getCurrentUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function isAdminLoggedIn() {
    return !!getToken();
  }

  async function request(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && token) {
          // Token expired or invalid
          clearAuth();
          window.dispatchEvent(new CustomEvent('auth-changed'));
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
      throw err;
    }
  }

  return {
    // Auth
    async login(username, password) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res.token) {
        setAuth(res.token, res.user);
        window.dispatchEvent(new CustomEvent('auth-changed'));
      }
      return res;
    },

    async verifyAuth() {
      if (!getToken()) return false;
      try {
        const res = await request('/auth/verify');
        return res.authenticated;
      } catch (e) {
        clearAuth();
        return false;
      }
    },

    logout() {
      clearAuth();
      window.dispatchEvent(new CustomEvent('auth-changed'));
    },

    isAdminLoggedIn,
    getCurrentUser,

    // Analytics & Dashboard
    async getDashboard() {
      return request('/analytics/dashboard');
    },

    async comparePlayers(playerIds) {
      return request('/analytics/compare', {
        method: 'POST',
        body: JSON.stringify({ playerIds })
      });
    },

    async getPlayingXI(options = {}) {
      return request('/analytics/playing-xi', {
        method: 'POST',
        body: JSON.stringify(options)
      });
    },

    // Players
    async getPlayers(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const qStr = query.toString();
      return request(`/players${qStr ? `?${qStr}` : ''}`);
    },

    async getPlayer(id) {
      return request(`/players/${id}`);
    },

    async createPlayer(playerData) {
      return request('/players', {
        method: 'POST',
        body: JSON.stringify(playerData)
      });
    },

    async updatePlayer(id, playerData) {
      return request(`/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(playerData)
      });
    },

    async updatePlayerStatus(id, status) {
      return request(`/players/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async deletePlayer(id) {
      return request(`/players/${id}`, {
        method: 'DELETE'
      });
    },

    async resetDatabase() {
      return request('/players/reset-db', {
        method: 'POST'
      });
    },

    // Teams
    async getTeams() {
      return request('/teams');
    },

    async getTeam(id) {
      return request(`/teams/${id}`);
    },

    // Rankings
    async getRankings() {
      return request('/rankings');
    }
  };
})();
