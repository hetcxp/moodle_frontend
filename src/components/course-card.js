import { getCourseImageUrl, getDirectCourseImageUrl } from '../utils/image.js';
import { decodeHtml } from '../utils/sanitize.js';

export function createCourseCard(course, onClick) {
  const card = document.createElement('article');
  card.className = 'card course-card';
  if (onClick) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => onClick(course));
  }
  
  const primaryImageUrl = getCourseImageUrl(course);
  const directImageUrl = getDirectCourseImageUrl(course);
  const genericFallbackUrl = `${import.meta.env.BASE_URL}generic-course.svg`;

  const img = new Image();
  img.src = primaryImageUrl;
  img.className = 'course-image';
  img.alt = decodeHtml(course.fullname || course.displayname || '');
  
  img.onerror = () => {
    if (img.src !== directImageUrl && directImageUrl !== genericFallbackUrl) {
      img.src = directImageUrl;
    } else if (img.src !== genericFallbackUrl) {
      img.onerror = null;
      img.src = genericFallbackUrl;
    } else {
      img.onerror = null;
    }
  };

  const content = document.createElement('div');
  content.className = 'course-content';

  const category = document.createElement('div');
  category.className = 'course-category';
  // Use course category if available, else standard text
  category.textContent = decodeHtml(course.categoryname || 'Curso');

  const title = document.createElement('h3');
  title.className = 'course-title';
  title.textContent = decodeHtml(course.fullname || course.displayname || '');

  content.appendChild(category);
  content.appendChild(title);
  
  // Render expiration date if available
  const rawExpiration = course.timeend || course.enrolenddate || course.enrolmentend || course.enddate || course.expirationdate;
  const expirationTimestamp = Number(rawExpiration);
  if (expirationTimestamp && !isNaN(expirationTimestamp) && expirationTimestamp > 0) {
    const expMs = expirationTimestamp < 10000000000 ? expirationTimestamp * 1000 : expirationTimestamp;
    const expDate = new Date(expMs);
    if (!isNaN(expDate.getTime())) {
      const expirationElem = document.createElement('div');
      expirationElem.className = 'course-expiration';
      
      const now = Date.now();
      const isExpired = expDate.getTime() < now;
      const isNearExpiry = !isExpired && (expDate.getTime() - now) < (7 * 24 * 60 * 60 * 1000);
      
      if (isExpired) {
        expirationElem.classList.add('is-expired');
      } else if (isNearExpiry) {
        expirationElem.classList.add('is-near-expiry');
      }
      
      const formattedDate = new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(expDate);

      expirationElem.innerHTML = `
        <svg class="course-expiration-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="course-expiration-label">${isExpired ? 'Expiró:' : 'Expira:'}</span>
        <span class="course-expiration-date">${formattedDate}</span>
      `;
      content.appendChild(expirationElem);
    }
  }

  if (course.progress !== undefined && course.progress !== null) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'course-progress-container';
    progressContainer.style.width = '100%';
    progressContainer.style.height = '6px';
    progressContainer.style.backgroundColor = '#e0e0e0';
    progressContainer.style.borderRadius = '3px';
    progressContainer.style.marginTop = '0.75rem';
    progressContainer.style.overflow = 'hidden';

    const progressBar = document.createElement('div');
    progressBar.className = 'course-progress-bar';
    progressBar.style.width = `${course.progress}%`;
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = course.progress === 100 ? '#4caf50' : '#2196f3';
    if (course.progress === 100) {
      progressBar.classList.add('is-completed');
    }
    
    const progressText = document.createElement('div');
    progressText.className = 'course-progress-text';
    progressText.style.fontSize = '0.75rem';
    progressText.style.color = '#666';
    progressText.style.marginTop = '0.25rem';
    progressText.style.textAlign = 'right';
    progressText.textContent = `${Math.round(course.progress)}% completado`;

    progressContainer.appendChild(progressBar);
    content.appendChild(progressContainer);
    content.appendChild(progressText);
  }
  
  card.appendChild(img);
  card.appendChild(content);
  
  return card;
}
