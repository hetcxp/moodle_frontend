import { getCourseImageUrl } from '../utils/image.js';

export function createCourseCard(course, onClick) {
  const card = document.createElement('article');
  card.className = 'card course-card';
  if (onClick) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => onClick(course));
  }
  
  const imageUrl = getCourseImageUrl(course);
  
  // Create an off-DOM image to test load, fallback if error
  const img = new Image();
  img.src = imageUrl;
  img.className = 'course-image';
  img.alt = course.fullname || course.displayname;
  img.onerror = () => {
    img.src = '/generic-course.svg';
  };

  const content = document.createElement('div');
  content.className = 'course-content';

  const category = document.createElement('div');
  category.className = 'course-category';
  // Use course category if available, else standard text
  category.textContent = course.categoryname || 'Curso';

  const title = document.createElement('h3');
  title.className = 'course-title';
  title.textContent = course.fullname || course.displayname;

  content.appendChild(category);
  content.appendChild(title);
  
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
