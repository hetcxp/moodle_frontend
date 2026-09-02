import { CourseService } from '../../../services/courses.js';
import { replacePluginfileUrls, replaceRelativeImages } from '../../../utils/image.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';

/**
 * Renders an interactive Moodle Book activity with chapter navigation sidebar and title extraction.
 *
 * @param {object} options
 * @param {object} options.mod - Module data from core_course_get_contents
 * @param {HTMLElement} [options.mainArea] - Main course content container to scroll
 * @returns {HTMLElement}
 */
export function createBookRenderer({ mod, mainArea }) {
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'resource-content book-layout';
  contentWrapper.style.cssText = 'display: flex; gap: 2rem; align-items: flex-start;';

  const bookSidebar = document.createElement('div');
  bookSidebar.className = 'book-sidebar';
  bookSidebar.style.cssText = 'width: 250px; flex-shrink: 0; background: var(--color-surface); border-radius: var(--radius-card, 8px); border: 1px solid var(--color-border); padding: 1rem;';
  
  const bookContent = document.createElement('div');
  bookContent.className = 'book-content-area';
  bookContent.style.cssText = 'flex: 1; background: var(--color-surface); border-radius: var(--radius-card, 8px); border: 1px solid var(--color-border); padding: 2rem; min-height: 400px;';

  if (!mod.contents || mod.contents.length === 0) {
    bookContent.innerHTML = '<p class="empty-state">Este libro no tiene capítulos.</p>';
    contentWrapper.appendChild(bookSidebar);
    contentWrapper.appendChild(bookContent);
    return contentWrapper;
  }

  // Filter HTML files that are chapters
  const chapters = mod.contents.filter(c => c.type === 'file' && c.filename.endsWith('.html') && c.filename !== 'index.html');
  const validChapters = chapters.length > 0 ? chapters : mod.contents.filter(c => c.type === 'file' && c.filename.endsWith('.html'));

  let currentChapterIndex = 0;
  const chapterTitles = validChapters.map(() => 'Cargando capítulo...');
  const htmlCache = {};

  const renderBookSidebar = () => {
    bookSidebar.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--color-text-primary);">Tabla de Contenidos</h3>';
    const ul = document.createElement('ul');
    ul.style.cssText = 'list-style: none; padding: 0; margin: 0;';
    validChapters.forEach((chap, idx) => {
      const li = document.createElement('li');
      li.id = `book-chap-${idx}`;
      li.style.cssText = `padding: 0.75rem 1rem; margin-bottom: 0.25rem; border-radius: 4px; cursor: pointer; color: ${idx === currentChapterIndex ? 'var(--color-primary)' : 'var(--color-text-primary)'}; background: ${idx === currentChapterIndex ? 'var(--color-bg-hover)' : 'transparent'}; font-weight: ${idx === currentChapterIndex ? '600' : '400'}; transition: all 0.2s;`;
      
      li.textContent = chapterTitles[idx];
      li.onclick = () => renderChapter(idx);
      ul.appendChild(li);
    });
    bookSidebar.appendChild(ul);
  };

  const renderChapter = async (idx) => {
    currentChapterIndex = idx;
    renderBookSidebar();
    bookContent.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--color-text-secondary);">Cargando capítulo...</div>';
    
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
    if (mainArea && typeof mainArea.scrollTo === 'function') mainArea.scrollTo(0, 0);
    
    const chap = validChapters[idx];
    let html = htmlCache[idx];
    
    if (!html) {
      html = await CourseService.fetchFileContent(chap.fileurl);
      if (html) htmlCache[idx] = html;
    }
    
    if (html) {
      let finalHtml = replacePluginfileUrls(html);
      finalHtml = replaceRelativeImages(finalHtml, mod.contents);
      bookContent.innerHTML = sanitizeHtml(finalHtml);
    } else {
      bookContent.innerHTML = '<p class="empty-state">No se pudo cargar el capítulo.</p>';
    }

    // Navigation buttons inside book
    const bookNav = document.createElement('div');
    bookNav.style.cssText = 'display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border);';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-secondary';
    prevBtn.textContent = 'Capítulo anterior';
    prevBtn.disabled = idx === 0;
    prevBtn.onclick = () => renderChapter(idx - 1);
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    nextBtn.textContent = 'Siguiente capítulo';
    nextBtn.disabled = idx === validChapters.length - 1;
    nextBtn.onclick = () => renderChapter(idx + 1);
    
    bookNav.appendChild(prevBtn);
    bookNav.appendChild(nextBtn);
    bookContent.appendChild(bookNav);
  };

  const loadAllTitles = async () => {
    await Promise.all(validChapters.map(async (chap, idx) => {
      const html = await CourseService.fetchFileContent(chap.fileurl);
      if (html) {
        htmlCache[idx] = html;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const firstContent = doc.querySelector('p, ul, ol, table, img');
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        
        let validHeadings = headings;
        if (firstContent) {
          validHeadings = headings.filter(h => {
            return (h.compareDocumentPosition(firstContent) & Node.DOCUMENT_POSITION_FOLLOWING);
          });
        }
        if (validHeadings.length === 0 && headings.length > 0) {
          validHeadings = [headings[0]];
        }
        
        let title = '';
        if (validHeadings.length > 0) {
          let bestHeading = validHeadings[0];
          for (let i = 1; i < validHeadings.length; i++) {
            const currentTag = parseInt(bestHeading.tagName.replace('H', ''), 10);
            const nextTag = parseInt(validHeadings[i].tagName.replace('H', ''), 10);
            if (nextTag > currentTag) {
              bestHeading = validHeadings[i];
            }
          }
          title = bestHeading.textContent.trim();
        } else {
          const strong = doc.querySelector('strong, b');
          if (strong) {
            if (!firstContent || (strong.compareDocumentPosition(firstContent) & Node.DOCUMENT_POSITION_FOLLOWING)) {
              title = strong.textContent.trim();
            }
          }
        }
        
        if (title.length > 0) {
          chapterTitles[idx] = title;
          const li = bookSidebar.querySelector(`#book-chap-${idx}`);
          if (li) li.textContent = title;
        }
        
        if (chapterTitles[idx] === 'Cargando capítulo...') {
          chapterTitles[idx] = `Capítulo ${idx + 1}`;
          const li = bookSidebar.querySelector(`#book-chap-${idx}`);
          if (li) li.textContent = chapterTitles[idx];
        }
      }
    }));
  };

  renderChapter(0);
  loadAllTitles();

  contentWrapper.appendChild(bookSidebar);
  contentWrapper.appendChild(bookContent);

  return contentWrapper;
}
