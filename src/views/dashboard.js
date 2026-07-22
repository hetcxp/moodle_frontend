import { CourseService } from '../services/courses.js';
import { createHeader } from '../components/header.js';
import { createCourseGrid } from '../components/course-grid.js';
import { createCourseCarousel } from '../components/course-carousel.js';
import { createLoader } from '../components/loader.js';
import { createTabs } from '../components/tabs.js';
import { createModal } from '../components/modal.js';

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
      const modalBody = document.createElement('div');
      modalBody.innerHTML = `<p>${course.summary || 'Sin descripción disponible.'}</p><div class="loader-small">Cargando estructura...</div>`;
      const modal = createModal(course.fullname, modalBody);
      document.body.appendChild(modal);

      try {
        const contents = await CourseService.getCourseContents(course.id, true);
        
        let structureHtml = '';
        if (contents.length > 0) {
          structureHtml += '<ul class="modal-structure-list">';
          contents.forEach(topic => {
            structureHtml += `<li><strong>${topic.name}</strong>`;
            if (topic.modules && topic.modules.length > 0) {
              structureHtml += '<ul>';
              topic.modules.forEach(mod => {
                structureHtml += `<li>${mod.name}</li>`;
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
          <div class="modal-description">${course.summary || 'Sin descripción disponible.'}</div>
          <h4 class="modal-section-title">Estructura del curso</h4>
          ${structureHtml}
        `;
      } catch (e) {
        modalBody.innerHTML = `
          <div class="modal-description">${course.summary || 'Sin descripción disponible.'}</div>
          <p class="error">Error al cargar la estructura del curso.</p>
        `;
      }
    };
    
    // Mis Cursos
    const enrolledTitle = document.createElement('h2');
    enrolledTitle.className = 'section-title';
    enrolledTitle.textContent = 'Mis Cursos';
    content.appendChild(enrolledTitle);
    
    const tabsData = [
      { id: 'activos', label: 'Cursos Activos', content: createCourseGrid(data.active, handleEnrolledClick) },
      { id: 'terminados', label: 'Cursos Terminados', content: createCourseGrid(data.completed, handleEnrolledClick) }
    ];
    
    const tabsComponent = createTabs(tabsData);
    content.appendChild(tabsComponent);
    
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
        catTitle.textContent = category;
        content.appendChild(catTitle);
        content.appendChild(createCourseCarousel(courses, handleAvailableClick));
      }
    }
    
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <p>Hubo un error cargando los cursos. Por favor, intenta nuevamente.</p>
        <button class="btn-primary" onclick="window.location.reload()" style="margin-top: 1rem; width: auto;">Reintentar</button>
      </div>
    `;
  }
}
