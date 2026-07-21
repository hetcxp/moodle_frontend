export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentRoute = null;
    
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('load', () => this.handleHashChange());
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
      this.currentRoute = matchRoute;
      matchRoute.action(matchParams);
    }
  }

  navigate(path) {
    window.location.hash = path;
  }
}
