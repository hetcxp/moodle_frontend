export function createTabs(tabsData) {
  const container = document.createElement('div');
  container.className = 'tabs-container';

  const tabList = document.createElement('div');
  tabList.className = 'tab-list';
  
  const contentContainer = document.createElement('div');
  contentContainer.className = 'tab-content';

  let activeIndex = 0;

  function render() {
    tabList.innerHTML = '';
    contentContainer.innerHTML = '';

    tabsData.forEach((tab, index) => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${index === activeIndex ? 'active' : ''}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeIndex = index;
        render();
      });
      tabList.appendChild(btn);

      if (index === activeIndex) {
        contentContainer.appendChild(tab.content);
      }
    });
  }

  container.appendChild(tabList);
  container.appendChild(contentContainer);
  
  render();

  return container;
}
