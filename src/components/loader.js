export function createLoader() {
  const container = document.createElement('div');
  container.className = 'loader-container';
  
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  
  container.appendChild(spinner);
  return container;
}
