import { createCourseCard } from './course-card.js';

export function createCourseGrid(courses, onClick) {
  if (!courses || courses.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No hay cursos disponibles.';
    return emptyState;
  }

  const grid = document.createElement('div');
  grid.className = 'course-grid';
  
  courses.forEach(course => {
    const card = createCourseCard(course, onClick);
    grid.appendChild(card);
  });
  
  return grid;
}
