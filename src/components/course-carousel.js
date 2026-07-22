import { createCourseCard } from './course-card.js';

export function createCourseCarousel(courses, onClick) {
  if (!courses || courses.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No hay cursos disponibles.';
    return emptyState;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  const track = document.createElement('div');
  track.className = 'carousel-track';

  courses.forEach(course => {
    const card = createCourseCard(course, onClick);
    track.appendChild(card);
  });

  container.appendChild(track);
  wrapper.appendChild(container);

  // Botones de navegación
  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-btn prev hidden';
  prevBtn.setAttribute('aria-label', 'Anterior');
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-btn next';
  nextBtn.setAttribute('aria-label', 'Siguiente');
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  wrapper.appendChild(prevBtn);
  wrapper.appendChild(nextBtn);

  // Lógica de scroll y visibilidad de botones
  const updateButtons = () => {
    const scrollLeft = track.scrollLeft;
    const scrollWidth = track.scrollWidth;
    const clientWidth = track.clientWidth;

    // Botón izquierdo
    if (scrollLeft <= 5) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    // Botón derecho (con tolerancia)
    if (scrollLeft + clientWidth >= scrollWidth - 10) {
      nextBtn.classList.add('hidden');
    } else {
      nextBtn.classList.remove('hidden');
    }
  };

  // Desplazamiento
  const scroll = (direction) => {
    const scrollAmount = track.clientWidth * 0.75;
    track.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  };

  prevBtn.addEventListener('click', () => scroll(-1));
  nextBtn.addEventListener('click', () => scroll(1));

  // Escuchar evento scroll
  let isScrolling;
  track.addEventListener('scroll', () => {
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(updateButtons, 50);
  });

  // Observador para actualizar cuando las dimensiones cambien
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      updateButtons();
    });
    resizeObserver.observe(track);
  }

  // Ejecución inicial después de un breve delay
  setTimeout(updateButtons, 100);

  return wrapper;
}
