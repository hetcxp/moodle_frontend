import { CourseService } from '../services/courses.js';
import { createHeader } from '../components/header.js';
import { createCourseCarousel } from '../components/course-carousel.js';
import { createLoader } from '../components/loader.js';
import { createModal } from '../components/modal.js';
import { sanitizeHtml, escapeHtml, decodeHtml } from '../utils/sanitize.js';

export async function renderDashboard(container) {
  // Skeleton / Loader initial
  container.innerHTML = '';
  container.appendChild(createHeader());
  
  const content = document.createElement('main');
  content.className = 'dashboard-view';
  content.appendChild(createLoader());
  container.appendChild(content);

  try {
    const data = await CourseService.getDashboardCourses();
    
    content.innerHTML = ''; // Clear loader
    
    const handleEnrolledClick = (course) => {
      window.location.hash = `#/course/${course.id}`;
    };

    const handleAvailableClick = async (course) => {
      const cleanSummary = sanitizeHtml(course.summary || '') || 'Sin descripción disponible.';
      const modalBody = document.createElement('div');
      modalBody.innerHTML = `<div class="modal-description">${cleanSummary}</div><div class="loader-small">Cargando estructura...</div>`;
      const modal = createModal(decodeHtml(course.fullname), modalBody);
      document.body.appendChild(modal);

      try {
        const contents = await CourseService.getCourseContents(course.id, true);
        
        let structureHtml = '';
        if (contents.length > 0) {
          structureHtml += '<ul class="modal-structure-list">';
          contents.forEach(topic => {
            structureHtml += `<li><strong>${escapeHtml(topic.name)}</strong>`;
            if (topic.modules && topic.modules.length > 0) {
              structureHtml += '<ul>';
              topic.modules.forEach(mod => {
                structureHtml += `<li>${escapeHtml(mod.name)}</li>`;
              });
              structureHtml += '</ul>';
            }
            structureHtml += `</li>`;
          });
          structureHtml += '</ul>';
        } else {
          structureHtml = '<p class="modal-empty">No hay temas disponibles o no tienes permiso para verlos.</p>';
        }

        modalBody.innerHTML = `
          <div class="modal-description">${cleanSummary}</div>
          <h4 class="modal-section-title">Estructura del curso</h4>
          ${structureHtml}
        `;
      } catch (e) {
        modalBody.innerHTML = `
          <div class="modal-description">${cleanSummary}</div>
          <p class="error">Error al cargar la estructura del curso.</p>
        `;
      }
    };
    
    const carousels = [];

    // Mis Cursos Activos
    const enrolledTitle = document.createElement('h2');
    enrolledTitle.className = 'section-title';
    enrolledTitle.textContent = 'Mis Cursos Activos';
    content.appendChild(enrolledTitle);
    
    const activeCarousel = createCourseCarousel(data.active, handleEnrolledClick);
    carousels.push(activeCarousel);
    content.appendChild(activeCarousel);

    // Cursos Terminados
    if (data.completed && data.completed.length > 0) {
      const completedTitle = document.createElement('h2');
      completedTitle.className = 'section-title';
      completedTitle.textContent = 'Cursos Terminados';
      completedTitle.style.marginTop = '2rem';
      content.appendChild(completedTitle);
      
      const completedCarousel = createCourseCarousel(data.completed, handleEnrolledClick);
      carousels.push(completedCarousel);
      content.appendChild(completedCarousel);
    }
    
    // Cursos Disponibles
    const availableTitle = document.createElement('h2');
    availableTitle.className = 'section-title';
    availableTitle.textContent = 'Cursos Disponibles';
    availableTitle.style.marginTop = '2rem';
    content.appendChild(availableTitle);
    
    if (Object.keys(data.availableByCategory).length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No hay cursos disponibles.';
      content.appendChild(empty);
    } else {
      for (const [category, courses] of Object.entries(data.availableByCategory)) {
        const catTitle = document.createElement('h3');
        catTitle.className = 'category-title';
        catTitle.textContent = decodeHtml(category);
        content.appendChild(catTitle);
        
        const catCarousel = createCourseCarousel(courses, handleAvailableClick);
        carousels.push(catCarousel);
        content.appendChild(catCarousel);
      }
    }

    return () => {
      carousels.forEach(c => {
        if (typeof c?.destroy === 'function') c.destroy();
      });
    };
    
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <p>Hubo un error cargando los cursos. Por favor, intenta nuevamente.</p>
        <button class="btn-primary" onclick="window.location.reload()" style="margin-top: 1rem; width: auto;">Reintentar</button>
      </div>
    `;
  }
}
