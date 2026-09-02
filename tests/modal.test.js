import { describe, it, expect, beforeEach } from 'vitest';
import { createModal } from '../src/components/modal.js';

describe('Modal Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders title, content and ARIA attributes', () => {
    const bodyContent = document.createElement('p');
    bodyContent.textContent = 'Modal body text';

    const modal = createModal('Detalles del Curso', bodyContent);
    document.body.appendChild(modal);

    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.querySelector('h3').textContent).toBe('Detalles del Curso');
    expect(modal.querySelector('.modal-body').textContent).toContain('Modal body text');
  });

  it('closes safely when close button is clicked', () => {
    const content = document.createElement('div');
    const modal = createModal('Test Modal', content);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.click();

    expect(document.body.contains(modal)).toBe(false);
  });

  it('closes when clicking the backdrop overlay', () => {
    const content = document.createElement('div');
    const modal = createModal('Backdrop Test', content);
    document.body.appendChild(modal);

    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.body.contains(modal)).toBe(false);
  });

  it('closes when Escape key is pressed', () => {
    const content = document.createElement('div');
    const modal = createModal('Escape Test', content);
    document.body.appendChild(modal);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(document.body.contains(modal)).toBe(false);
  });

  it('close() method can be called repeatedly without throwing exceptions', () => {
    const content = document.createElement('div');
    const modal = createModal('Safe Close Test', content);
    document.body.appendChild(modal);

    expect(() => {
      modal.close();
      modal.close();
      modal.close();
    }).not.toThrow();

    expect(document.body.contains(modal)).toBe(false);
  });
});
