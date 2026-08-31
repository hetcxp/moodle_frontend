import { describe, it, expect, vi } from 'vitest';
import { createCourseCard } from '../src/components/course-card.js';

describe('createCourseCard', () => {
  it('renders course image, category, and title properly', () => {
    const course = {
      id: 1,
      fullname: 'Curso de JavaScript Avanzado',
      categoryname: 'Programación',
      courseimage: 'https://example.com/course.jpg'
    };

    const card = createCourseCard(course);

    expect(card.classList.contains('course-card')).toBe(true);
    expect(card.querySelector('.course-title').textContent).toBe('Curso de JavaScript Avanzado');
    expect(card.querySelector('.course-category').textContent).toBe('Programación');
    expect(card.querySelector('.course-image').src).toContain('https://example.com/course.jpg');
  });

  it('triggers onClick handler when card is clicked', () => {
    const course = { id: 2, fullname: 'Curso Interactivo' };
    const onClick = vi.fn();

    const card = createCourseCard(course, onClick);
    card.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(course);
  });

  it('does NOT render expiration date when no expiration fields are set', () => {
    const course = {
      id: 3,
      fullname: 'Curso Sin Expiración',
      timeend: 0,
      enddate: 0
    };

    const card = createCourseCard(course);
    expect(card.querySelector('.course-expiration')).toBeNull();
  });

  it('renders expiration date when timeend or enddate is set (Unix timestamp in seconds)', () => {
    // Timestamp: 2026-10-15T12:00:00Z
    const timestamp = Math.floor(new Date('2026-10-15T12:00:00Z').getTime() / 1000);
    const course = {
      id: 4,
      fullname: 'Curso con Vencimiento',
      timeend: timestamp
    };

    const card = createCourseCard(course);
    const expElem = card.querySelector('.course-expiration');
    expect(expElem).not.toBeNull();
    expect(expElem.querySelector('.course-expiration-icon')).not.toBeNull();
    expect(expElem.querySelector('.course-expiration-label')).not.toBeNull();
    expect(expElem.textContent).toContain('2026');
  });

  it('marks card as is-expired when expiration date is in the past', () => {
    const pastTimestamp = Math.floor((Date.now() - 100000000) / 1000);
    const course = {
      id: 5,
      fullname: 'Curso Vencido',
      enddate: pastTimestamp
    };

    const card = createCourseCard(course);
    const expElem = card.querySelector('.course-expiration');
    expect(expElem).not.toBeNull();
    expect(expElem.classList.contains('is-expired')).toBe(true);
    expect(expElem.querySelector('.course-expiration-label').textContent).toBe('Expiró:');
  });

  it('marks card as is-near-expiry when expiration is within 7 days', () => {
    const nearTimestamp = Math.floor((Date.now() + 3 * 24 * 60 * 60 * 1000) / 1000);
    const course = {
      id: 6,
      fullname: 'Curso por Vencer',
      enrolenddate: nearTimestamp
    };

    const card = createCourseCard(course);
    const expElem = card.querySelector('.course-expiration');
    expect(expElem).not.toBeNull();
    expect(expElem.classList.contains('is-near-expiry')).toBe(true);
    expect(expElem.querySelector('.course-expiration-label').textContent).toBe('Expira:');
  });

  it('renders progress bar and expiration date simultaneously for active courses', () => {
    const futureTimestamp = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
    const course = {
      id: 7,
      fullname: 'Curso en Progreso',
      progress: 65,
      timeend: futureTimestamp
    };

    const card = createCourseCard(course);
    const expElem = card.querySelector('.course-expiration');
    const progressContainer = card.querySelector('.course-progress-container');
    const progressBar = card.querySelector('.course-progress-bar');
    const progressText = card.querySelector('.course-progress-text');

    expect(expElem).not.toBeNull();
    expect(progressContainer).not.toBeNull();
    expect(progressBar.style.width).toBe('65%');
    expect(progressText.textContent).toBe('65% completado');
  });

  it('adds is-completed class when progress is 100%', () => {
    const course = {
      id: 8,
      fullname: 'Curso Completo',
      progress: 100
    };

    const card = createCourseCard(course);
    const progressBar = card.querySelector('.course-progress-bar');
    expect(progressBar.classList.contains('is-completed')).toBe(true);
  });
});
