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
  
  card.appendChild(img);
  card.appendChild(content);
  
  return card;
}
