// Utility for robust navigation fallbacks when SPA routing might be unstable
// Usage: navigateWithFallback(navigate, '/login') or hardRedirect('/login')

export function hardRedirect(path = '/login') {
  try {
    if (typeof window !== 'undefined' && window?.location) {
      window.location.replace(path);
    }
  } catch (_) {
    // no-op
  }
}

export function navigateWithFallback(navigate, path = '/login', options = {}) {
  const { forceReloadIfSamePath = true, replace = true } = options || {};
  try {
    // Prefer client-side navigation first
    navigate(path, { replace, ...options });
  } catch (_) {
    // ignore and force hard redirect below
  }
  // In case client-side navigation fails or gets stuck, force a hard redirect shortly after
  setTimeout(() => {
    try {
      if (typeof window !== 'undefined' && window?.location) {
        if (window.location.pathname !== path) {
          window.location.replace(path);
        } else if (forceReloadIfSamePath) {
          // If we're already on the target path and UI is blank/stuck, do a soft reload
          window.location.reload();
        }
      }
    } catch (e) {
      // final fallback
      hardRedirect(path);
    }
  }, 10);
}

// After closing caja or similar critical flows, ensure UI is stable
// strategy:
//  - 'reload-current': reload if already on targetPath, else navigate to targetPath
//  - 'goto-pos' | 'goto-dashboard' | 'goto-home'
// targetPath defaults to '/pos'
export function safeStayOrRedirect(navigate, {
  strategy = 'reload-current',
  targetPath = '/pos',
  dashboardPath = '/dashboard',
  homePath = '/',
} = {}) {
  try {
    const current = (typeof window !== 'undefined' && window.location?.pathname) || '';
    if (strategy === 'goto-dashboard') {
      return navigateWithFallback(navigate, dashboardPath, { forceReloadIfSamePath: true });
    }
    if (strategy === 'goto-home') {
      return navigateWithFallback(navigate, homePath, { forceReloadIfSamePath: true });
    }
    if (strategy === 'goto-pos') {
      return navigateWithFallback(navigate, targetPath, { forceReloadIfSamePath: true });
    }
    // reload-current (default)
    if (current === targetPath) {
      return navigateWithFallback(navigate, targetPath, { forceReloadIfSamePath: true });
    }
    return navigateWithFallback(navigate, targetPath, { forceReloadIfSamePath: true });
  } catch (_) {
    // final guard
    hardRedirect(targetPath || '/');
  }
}

const STRAT_KEY = 'postCloseStrategy';
const allowed = new Set(['reload-current','goto-pos','goto-dashboard','goto-home']);
export function getPostCloseStrategy() {
  try {
    const s = localStorage.getItem(STRAT_KEY) || 'goto-pos';
    return allowed.has(s) ? s : 'goto-pos';
  } catch (_) {
    return 'goto-pos';
  }
}

export function setPostCloseStrategy(strategy) {
  try {
    if (allowed.has(strategy)) localStorage.setItem(STRAT_KEY, strategy);
  } catch (_) { /* ignore */ }
}
