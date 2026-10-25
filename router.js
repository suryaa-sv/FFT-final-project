/* ==========================================================================
   CRICKETX — CLIENT-SIDE HASH ROUTER
   Handles seamless navigation, active link highlights, view switching
   ========================================================================== */

const Router = (() => {
  const routes = {};

  function register(pattern, handler) {
    routes[pattern] = handler;
  }

  function navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }

  function handleRoute() {
    const fullHash = window.location.hash.slice(1) || '/dashboard';
    const [pathPart, queryPart] = fullHash.split('?');
    const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;

    // Highlight navigation links
    document.querySelectorAll('.cx-nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const targetRoute = href.replace(/^#/, '');
      if (cleanPath.startsWith(targetRoute) && targetRoute !== '' && targetRoute !== '/') {
        link.classList.add('active');
      } else if ((cleanPath === '/' || cleanPath === '/dashboard') && (targetRoute === '/' || targetRoute === '/dashboard')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile nav menu if open
    document.querySelector('.cx-nav')?.classList.remove('mobile-open');

    // Parse parameters
    // Check direct match
    if (routes[cleanPath]) {
      routes[cleanPath]({ query: parseQuery(queryPart) });
      window.scrollTo(0, 0);
      return;
    }

    // Check parameterized routes (e.g. /player/:id, /team/:id)
    for (const [pattern, handler] of Object.entries(routes)) {
      const patternParts = pattern.split('/');
      const pathParts = cleanPath.split('/');

      if (patternParts.length === pathParts.length) {
        let isMatch = true;
        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].slice(1);
            params[paramName] = pathParts[i];
          } else if (patternParts[i] !== pathParts[i]) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          handler({ params, query: parseQuery(queryPart) });
          window.scrollTo(0, 0);
          return;
        }
      }
    }

    // Default route fallback
    if (routes['/dashboard']) {
      routes['/dashboard']({});
    }
  }

  function parseQuery(queryString) {
    const query = {};
    if (!queryString) return query;
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, val] = pair.split('=');
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(val || '');
    }
    return query;
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);
  }

  return {
    register,
    navigate,
    init,
    handleRoute
  };
})();
