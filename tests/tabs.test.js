import { describe, it, expect } from 'vitest';
import { createTabs } from '../src/components/tabs.js';

describe('Tabs Component', () => {
  it('renders tab buttons and displays first tab content by default', () => {
    const content1 = document.createElement('div');
    content1.textContent = 'Contenido Uno';
    const content2 = document.createElement('div');
    content2.textContent = 'Contenido Dos';

    const tabsData = [
      { label: 'Tab 1', content: content1 },
      { label: 'Tab 2', content: content2 }
    ];

    const container = createTabs(tabsData);
    expect(container.className).toBe('tabs-container');

    const buttons = container.querySelectorAll('.tab-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);

    const activeContent = container.querySelector('.tab-content');
    expect(activeContent.textContent).toBe('Contenido Uno');
  });

  it('switches active tab and content on button click', () => {
    const contentA = document.createElement('p');
    contentA.textContent = 'Página A';
    const contentB = document.createElement('p');
    contentB.textContent = 'Página B';

    const tabsData = [
      { label: 'A', content: contentA },
      { label: 'B', content: contentB }
    ];

    const container = createTabs(tabsData);
    const buttons = container.querySelectorAll('.tab-btn');

    // Click on Tab B
    buttons[1].click();

    const updatedButtons = container.querySelectorAll('.tab-btn');
    expect(updatedButtons[0].classList.contains('active')).toBe(false);
    expect(updatedButtons[1].classList.contains('active')).toBe(true);

    const activeContent = container.querySelector('.tab-content');
    expect(activeContent.textContent).toBe('Página B');
  });
});
