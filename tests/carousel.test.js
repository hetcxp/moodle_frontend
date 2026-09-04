import { describe, it, expect, vi } from 'vitest';
import { createCourseCarousel } from '../src/components/course-carousel.js';

describe('CourseCarousel Component', () => {
  it('returns empty-state element when courses array is empty', () => {
    const el = createCourseCarousel([]);
    expect(el.classList.contains('empty-state')).toBe(true);
    expect(el.textContent).toContain('No hay cursos disponibles');
  });

  it('returns empty-state element when courses is null or undefined', () => {
    const elNull = createCourseCarousel(null);
    expect(elNull.classList.contains('empty-state')).toBe(true);

    const elUndef = createCourseCarousel(undefined);
    expect(elUndef.classList.contains('empty-state')).toBe(true);
  });

  it('renders carousel wrapper with track and navigation buttons when courses exist', () => {
    const courses = [
      { id: 1, fullname: 'Curso Alfa', category: 'General' },
      { id: 2, fullname: 'Curso Beta', category: 'General' }
    ];
    const onClick = vi.fn();
    const el = createCourseCarousel(courses, onClick);

    expect(el.classList.contains('carousel-wrapper')).toBe(true);
    const track = el.querySelector('.carousel-track');
    expect(track).not.toBeNull();
    expect(track.children.length).toBe(2);

    const prevBtn = el.querySelector('.carousel-btn.prev');
    const nextBtn = el.querySelector('.carousel-btn.next');
    expect(prevBtn).not.toBeNull();
    expect(nextBtn).not.toBeNull();
    expect(prevBtn.classList.contains('hidden')).toBe(true);
  });

  it('attaches click handler to course cards inside carousel', () => {
    const courses = [{ id: 10, fullname: 'Interactive Design' }];
    const onClick = vi.fn();
    const el = createCourseCarousel(courses, onClick);

    const card = el.querySelector('.course-card');
    expect(card).not.toBeNull();
    card.click();
    expect(onClick).toHaveBeenCalledWith(courses[0]);
  });

  it('triggers scrollBy on navigation button clicks', () => {
    const courses = [
      { id: 1, fullname: 'Curso 1' },
      { id: 2, fullname: 'Curso 2' }
    ];
    const el = createCourseCarousel(courses);
    const track = el.querySelector('.carousel-track');
    track.scrollBy = vi.fn();

    const nextBtn = el.querySelector('.carousel-btn.next');
    nextBtn.click();
    expect(track.scrollBy).toHaveBeenCalled();

    const prevBtn = el.querySelector('.carousel-btn.prev');
    prevBtn.click();
    expect(track.scrollBy).toHaveBeenCalledTimes(2);
  });
});
