export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = null;
    this.currentCleanup = null;
    
    this._onHashChange = () => this.handleHashChange();
    window.addEventListener('hashchange', this._onHashChange);
    window.addEventListener('load', this._onHashChange);
    
    // Process initial route immediately since module scripts might load after 'load' event
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0];
    
    let matchRoute = null;
    let matchParams = {};

    for (const r of this.routes) {
      if (r.path === '*') continue;
      // Convert /path/:id to regex
      const paramNames = [];
      const regexPath = r.path.replace(/:([^\/]+)/g, (_, key) => {
        paramNames.push(key);
        return '([^/]+)';
      });
      const regex = new RegExp(`^${regexPath}$`);
      const match = path.match(regex);
      if (match) {
        matchRoute = r;
        paramNames.forEach((name, i) => {
          matchParams[name] = match[i + 1];
        });
        break;
      }
    }

    if (!matchRoute) {
      matchRoute = this.routes.find(r => r.path === '*');
    }

    if (matchRoute) {
      if (matchRoute.guard && !matchRoute.guard()) {
        return; // Guard handled the navigation
      }

      this._navEpoch = (this._navEpoch || 0) + 1;
      const currentEpoch = this._navEpoch;

      // Cleanup previous view if destructor was registered
      if (typeof this.currentCleanup === 'function') {
        try {
          this.currentCleanup();
        } catch (err) {
          console.warn('Error during route cleanup:', err);
        }
        this.currentCleanup = null;
      } else if (this.currentCleanup && typeof this.currentCleanup.destroy === 'function') {
        try {
          this.currentCleanup.destroy();
        } catch (err) {
          console.warn('Error during route cleanup:', err);
        }
        this.currentCleanup = null;
      }

      this.currentRoute = matchRoute;
      const result = matchRoute.action(matchParams);
      if (result instanceof Promise) {
        result.then(cleanup => {
          if (this._navEpoch !== currentEpoch) {
            // Stale route action resolved after another navigation started
            if (typeof cleanup === 'function') cleanup();
            else if (cleanup && typeof cleanup.destroy === 'function') cleanup.destroy();
            return;
          }
          if (typeof cleanup === 'function' || (cleanup && typeof cleanup.destroy === 'function')) {
            this.currentCleanup = cleanup;
          }
        }).catch(err => {
          if (this._navEpoch === currentEpoch) {
            console.error('Route action error:', err);
          }
        });
      } else if (typeof result === 'function' || (result && typeof result.destroy === 'function')) {
        this.currentCleanup = result;
      }
    }
  }

  navigate(path) {
    window.location.hash = path;
  }

  destroy() {
    window.removeEventListener('hashchange', this._onHashChange);
    window.removeEventListener('load', this._onHashChange);
    if (typeof this.currentCleanup === 'function') {
      this.currentCleanup();
    } else if (this.currentCleanup && typeof this.currentCleanup.destroy === 'function') {
      this.currentCleanup.destroy();
    }
    this.currentCleanup = null;
  }
}
