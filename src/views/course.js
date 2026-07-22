import { CourseService } from '../services/courses.js';
import { createHeader } from '../components/header.js';
import { createLoader } from '../components/loader.js';
import { createQuizRunner } from '../components/quiz-runner.js';
import { replacePluginfileUrls, replaceRelativeImages } from '../utils/image.js';
import { API_CONFIG } from '../config/api.js';
import { AuthService } from '../services/auth.js';

export async function renderCourse(container, courseId) {
  if (window.h5pMessageListener) {
    window.removeEventListener('message', window.h5pMessageListener);
    window.h5pMessageListener = null;
  }

  container.innerHTML = '';
  container.appendChild(createHeader());

  const content = document.createElement('main');
  content.className = 'course-layout';
  content.appendChild(createLoader());
  container.appendChild(content);

  try {
    const contents = await CourseService.getCourseContents(courseId);
    let completionMap = {};
    content.innerHTML = '';

    if (!contents || contents.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Este curso no tiene contenido estructurado disponible.';
      content.appendChild(empty);
      return;
    }

    // Flatten all modules for next/prev navigation
    const allModules = [];
    contents.forEach(topic => {
      if (topic.modules) {
        topic.modules.forEach(mod => {
          allModules.push({ ...mod, topicName: topic.name });
        });
      }
    });

    let currentModuleIndex = -1;
    let currentUpdateCompletionCard = null;

    // Listen to H5P xAPI messages from the iframe and auto-refresh completion state
    if (window.h5pMessageListener) {
      window.removeEventListener('message', window.h5pMessageListener);
    }
    window.h5pMessageListener = async (event) => {
      // 1. Handle H5P xAPI Tracking
      if (event.data && event.data.type === 'h5p_xapi') {
        const verb = event.data.verb;

        
        // Only refresh when the activity is finished/completed/passed/failed to prevent excessive reloading
        const isFinishVerb = verb === 'completed' || 
                             verb === 'http://adlnet.gov/expapi/verbs/completed' ||
                             verb === 'passed' ||
                             verb === 'http://adlnet.gov/expapi/verbs/passed' ||
                             verb === 'failed' ||
                             verb === 'http://adlnet.gov/expapi/verbs/failed';

        if (isFinishVerb) {
          // Refresh the completion mapping
          completionMap = await CourseService.getActivitiesCompletionStatus(courseId);
          refreshSidebarBadges();
          
          // Update the completion status card DOM directly without disrupting/reloading the iframe
          if (currentUpdateCompletionCard) {
            currentUpdateCompletionCard();
          }
        }
      }

      // 2. Handle H5P Dynamic Iframe Resizing (Moodle Core embed handshake)
      let payload = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          // Fallback regex if parse fails or it's wrapped
          const match = payload.match(/(?:scrollHeight|height)"?\s*:\s*(\d+)/);
          if (match) {
            const height = parseInt(match[1]);
            const iframe = document.querySelector('iframe.resource-content.h5p-iframe');
            if (iframe) iframe.style.height = `${height + 30}px`;
          }
        }
      }

      if (payload && typeof payload === 'object' && payload.context === 'h5p') {
        const iframe = document.querySelector('iframe.resource-content.h5p-iframe');
        if (!iframe) return;

        // Moodle handshake: respond to 'hello' so Moodle sets parentIsFriendly = true
        if (payload.action === 'hello') {
          iframe.contentWindow.postMessage({ context: 'h5p', action: 'hello' }, '*');
        } 
        // Moodle sends 'prepareResize' or 'resize' with heights once handshake is complete
        else if (payload.action === 'prepareResize' || payload.action === 'resize') {
          const height = payload.scrollHeight || payload.clientHeight || payload.height;
          if (height) {
            // Provide exact height required by H5P content
            iframe.style.height = `${height}px`;
            
            // Confirm resize to Moodle so it redraws internal elements (optional but good practice)
            iframe.contentWindow.postMessage({ context: 'h5p', action: 'resizePrepared' }, '*');
          }
        }
      }
    };
    window.addEventListener('message', window.h5pMessageListener);

    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'course-sidebar';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-secondary';
    backBtn.textContent = '← Volver al curso';
    backBtn.onclick = () => renderMainContent(-1);
    backBtn.style.marginBottom = '1.5rem';
    sidebar.appendChild(backBtn);

    const sidebarList = document.createElement('div');
    sidebar.appendChild(sidebarList);

    // Main Area
    const mainArea = document.createElement('section');
    mainArea.className = 'course-main';

    const renderMainContent = async (modIndex) => {
      mainArea.innerHTML = '';
      mainArea.appendChild(createLoader());
      currentModuleIndex = modIndex;
      currentUpdateCompletionCard = null;
      
      // Asegurar que la vista vuelve al inicio del contenido nuevo
      mainArea.scrollTo(0, 0);
      window.scrollTo(0, 0);

      try {
        completionMap = await CourseService.getActivitiesCompletionStatus(courseId);
      } catch (err) {
        console.error('Error refreshing completion status:', err);
      }

      mainArea.innerHTML = '';

      // Update active state in sidebar
      const allItems = sidebarList.querySelectorAll('.module-item');
      allItems.forEach(item => item.classList.remove('active'));
      if (modIndex >= 0 && modIndex < allItems.length) {
        allItems[modIndex].classList.add('active');
        sidebar.style.display = 'block';
      } else {
        sidebar.style.display = 'none';
      }
      
      // Remove mobile-open class when navigating
      sidebar.classList.remove('mobile-open');
      const existingBackdrop = mainArea.querySelector('.sidebar-backdrop');
      if (existingBackdrop) {
        existingBackdrop.remove();
      }

      refreshSidebarBadges();

      if (modIndex === -1) {
        // Show course outline / summary
        const title = document.createElement('h2');
        title.textContent = 'Contenido del Curso';
        mainArea.appendChild(title);
        
        contents.forEach(topic => {
          const topicDiv = document.createElement('div');
          topicDiv.className = 'course-topic';
          topicDiv.innerHTML = `<h3>${topic.name}</h3>`;
          if (topic.summary) {
            topicDiv.innerHTML += `<div class="topic-summary">${replacePluginfileUrls(topic.summary)}</div>`;
          }
          
          if (topic.modules && topic.modules.length > 0) {
            const modsList = document.createElement('ul');
            modsList.className = 'topic-modules';
            topic.modules.forEach(mod => {
              const gmodIndex = allModules.findIndex(m => m.id === mod.id);
              const comp = completionMap[mod.id];
              const isDone = comp && comp.isoverallcomplete;
              const li = document.createElement('li');
              li.className = 'module-item';
              li.innerHTML = `
                <span class="module-icon-wrap">
                  <img src="${mod.modicon}" alt="${mod.modname}" class="module-icon">
                  ${isDone ? '<span class="completion-overlay" title="Completado">✓</span>' : ''}
                </span>
                <span>${mod.name}</span>
              `;
              li.onclick = () => renderMainContent(gmodIndex);
              modsList.appendChild(li);
            });
            topicDiv.appendChild(modsList);
          }
          
          mainArea.appendChild(topicDiv);
        });
        return;
      }

      const mod = allModules[modIndex];
      mainArea.appendChild(createLoader());

      const contentContainer = document.createElement('div');
      contentContainer.style.flex = '1';
      contentContainer.style.display = 'flex';
      contentContainer.style.flexDirection = 'column';

      // Mobile Sidebar Toggle Button (Inside Detail View)
      const mobileToggleBtn = document.createElement('button');
      mobileToggleBtn.className = 'mobile-sidebar-toggle btn-secondary';
      mobileToggleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> <span>Temario del curso</span>';
      mobileToggleBtn.onclick = () => {
        sidebar.classList.toggle('mobile-open');
        if (sidebar.classList.contains('mobile-open')) {
          const backdrop = document.createElement('div');
          backdrop.className = 'sidebar-backdrop';
          backdrop.onclick = () => {
            sidebar.classList.remove('mobile-open');
            backdrop.remove();
          };
          mainArea.appendChild(backdrop);
        } else {
          const backdrop = mainArea.querySelector('.sidebar-backdrop');
          if (backdrop) backdrop.remove();
        }
      };
      contentContainer.appendChild(mobileToggleBtn);

      if (mod.modname !== 'quiz') {
        const modTitle = document.createElement('h2');
        modTitle.textContent = mod.name;
        modTitle.style.marginBottom = '1rem';
        contentContainer.appendChild(modTitle);
      }

      const contentWrapper = document.createElement('div');

      if (mod.modname === 'page') {
        const pageContent = await CourseService.getPageContent(courseId, mod.id);
        if (pageContent) {
          contentWrapper.className = 'resource-content page-content';
          contentWrapper.innerHTML = replacePluginfileUrls(pageContent.content || pageContent.intro);
        } else {
          contentWrapper.innerHTML = '<p class="empty-state">No se pudo cargar el contenido.</p>';
        }
      } else if (mod.modname === 'scorm') {
        contentWrapper.className = 'resource-content scorm-content';
        let scormHtml = '<div class="scorm-container" style="padding: 2rem; background: var(--bg-card); border-radius: 8px; margin-bottom: 2rem; text-align: center;">';
        
        if (mod.description) {
          scormHtml += `
            <div class="scorm-description" style="margin-bottom: 2rem; text-align: left;">
              ${replacePluginfileUrls(mod.description)}
            </div>
          `;
        }
        
        contentWrapper.innerHTML = scormHtml + 'Cargando datos del SCORM...</div>';
        
        // Construct player URL directly
        const baseUrl = mod.url.split('/view.php')[0];
        const basePlayerUrl = `${baseUrl}/player.php?a=${mod.instance}&scoid=0&display=popup&mode=normal`;

        // Fetch attempt count and autologin URL asynchronously
        Promise.all([
          CourseService.getScormAttemptCount(mod.instance),
          CourseService.getAutoLoginUrl(basePlayerUrl)
        ]).then(([attempts, playerUrl]) => {
          let attemptsHtml = '';
          if (attempts !== null) {
            attemptsHtml = `
              <div class="scorm-attempts" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-body); border-radius: 6px; display: inline-block;">
                <strong>Intentos realizados:</strong> ${attempts}
              </div>
            `;
          }
          
          const finalHtml = scormHtml + attemptsHtml + `
            <div class="scorm-actions">
              <button id="scorm-open-btn" class="btn-primary" style="display: inline-block; cursor: pointer;">
                Abrir actividad SCORM
              </button>
              <p style="margin-top: 1rem; font-size: 0.9em; color: var(--text-muted);">
                La actividad se abrirá en una nueva pestaña autenticada.
              </p>
            </div>
          </div>`;
          
          contentWrapper.innerHTML = finalHtml;

          document.getElementById('scorm-open-btn').addEventListener('click', async () => {
            // Refresh the autologin URL each click (key expires in 60s)
            const freshUrl = await CourseService.getAutoLoginUrl(basePlayerUrl);
            const popup = window.open(freshUrl, '_blank');
            if (!popup) return; // blocked by browser
            const timer = setInterval(async () => {
              if (popup.closed) {
                clearInterval(timer);
                completionMap = await CourseService.getActivitiesCompletionStatus(courseId);
                refreshSidebarBadges();
                renderMainContent(modIndex);
              }
            }, 1000);
          });
        }); // end Promise.all

      } else if (mod.modname === 'quiz') {
        contentWrapper.className = 'resource-content quiz-content';
        const quizRunner = createQuizRunner(courseId, mod, async () => {
          completionMap = await CourseService.getActivitiesCompletionStatus(courseId);
          refreshSidebarBadges();
          if (currentUpdateCompletionCard) currentUpdateCompletionCard();
        });
        contentWrapper.appendChild(quizRunner);
      } else if (mod.modname === 'book') {
        contentWrapper.className = 'resource-content book-layout';
        contentWrapper.style.cssText = 'display: flex; gap: 2rem; align-items: flex-start;';

        const bookSidebar = document.createElement('div');
        bookSidebar.className = 'book-sidebar';
        bookSidebar.style.cssText = 'width: 250px; flex-shrink: 0; background: var(--color-surface); border-radius: 8px; border: 1px solid var(--color-border); padding: 1rem;';
        
        const bookContent = document.createElement('div');
        bookContent.className = 'book-content-area';
        bookContent.style.cssText = 'flex: 1; background: var(--color-surface); border-radius: 8px; border: 1px solid var(--color-border); padding: 2rem; min-height: 400px;';

        if (!mod.contents || mod.contents.length === 0) {
          bookContent.innerHTML = '<p class="empty-state">Este libro no tiene capítulos.</p>';
        } else {
          // Filtrar los html que son los capitulos
          const chapters = mod.contents.filter(c => c.type === 'file' && c.filename.endsWith('.html') && c.filename !== 'index.html');
          
          // A veces Moodle exporta un index.html genérico, pero los capitulos son los demás. Si está vacío, usar todos.
          const validChapters = chapters.length > 0 ? chapters : mod.contents.filter(c => c.type === 'file' && c.filename.endsWith('.html'));

          let currentChapterIndex = 0;
          const chapterTitles = validChapters.map((_, i) => `Cargando capítulo...`);
          const htmlCache = {};

          const renderBookSidebar = () => {
            bookSidebar.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Tabla de Contenidos</h3>';
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
            bookContent.innerHTML = '<div style="text-align:center; padding: 2rem;">Cargando capítulo...</div>';
            
            const chap = validChapters[idx];
            let html = htmlCache[idx];
            
            if (!html) {
              html = await CourseService.fetchFileContent(chap.fileurl);
              if (html) htmlCache[idx] = html;
            }
            
            if (html) {
              let finalHtml = replacePluginfileUrls(html);
              finalHtml = replaceRelativeImages(finalHtml, mod.contents);
              bookContent.innerHTML = finalHtml;
            } else {
              bookContent.innerHTML = '<p class="empty-state">No se pudo cargar el capítulo.</p>';
            }

            // Navegacion dentro del libro
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
                
                // Encontrar el primer elemento de contenido real
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
                  // Priorizar el heading más profundo (ej: H3 sobre H2 si ambos están al principio)
                  let bestHeading = validHeadings[0];
                  for (let i = 1; i < validHeadings.length; i++) {
                    const currentTag = parseInt(bestHeading.tagName.replace('H', ''));
                    const nextTag = parseInt(validHeadings[i].tagName.replace('H', ''));
                    if (nextTag > currentTag) {
                      bestHeading = validHeadings[i];
                    }
                  }
                  title = bestHeading.textContent.trim();
                } else {
                  const strong = doc.querySelector('strong, b');
                  if (strong) {
                    // Check if it's before firstContent
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
                
                // Si la extracción falla y aún dice "Cargando", ponerle "Capítulo X"
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
        }

        contentWrapper.appendChild(bookSidebar);
        contentWrapper.appendChild(bookContent);

      } else if (mod.modname === 'assign') {
        contentWrapper.className = 'resource-content assign-content';

        // Fetch assign data con admin token (introfiles, intro, etc.)
        const assignData = await CourseService.getAssignmentData(courseId, mod.id);

        // --- Description ---
        const description = (assignData && assignData.intro) || mod.description || mod.intro || '';
        if (description) {
          const descDiv = document.createElement('div');
          descDiv.className = 'assign-description';
          descDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: var(--color-surface); border-radius: 8px; border: 1px solid var(--color-border); line-height: 1.7;';
          descDiv.innerHTML = replacePluginfileUrls(description);
          contentWrapper.appendChild(descDiv);
        }

        // --- Archivos adjuntos: introfiles (WS) + mod.contents (fallback) ---
        const wsFiles = (assignData && (assignData.introfiles || assignData.introattachments)) || [];
        const contentsFiles = (mod.contents || []).filter(c => c.type === 'file');
        // Merge sin duplicados por filename
        const seenNames = new Set();
        const allFiles = [...wsFiles, ...contentsFiles].filter(f => {
          if (seenNames.has(f.filename)) return false;
          seenNames.add(f.filename);
          return true;
        });

        if (allFiles.length > 0) {
          const attachTitle = document.createElement('h3');
          attachTitle.textContent = 'Archivos adjuntos';
          attachTitle.style.cssText = 'font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;';
          contentWrapper.appendChild(attachTitle);

          const fileList = document.createElement('ul');
          fileList.style.cssText = 'list-style: none; padding: 0; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;';
          allFiles.forEach(f => {
            const li = document.createElement('li');
            const token = AuthService.getToken();
            const fileUrl = f.fileurl + (f.fileurl.includes('?') ? '&' : '?') + `token=${token}`;
            li.innerHTML = `<a href="${fileUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;text-decoration:none;color:var(--color-primary);font-size:0.875rem;font-weight:500;">📎 ${f.filename}</a>`;
            fileList.appendChild(li);
          });
          contentWrapper.appendChild(fileList);
        }

        // --- Botón de envío con autologin ---
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = 'margin-top: 0.5rem;';
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-primary';
        submitBtn.textContent = 'Ir a enviar tarea →';
        submitBtn.onclick = async () => {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Abriendo...';
          const url = await CourseService.getAutoLoginUrl(mod.url);
          window.open(url, '_blank');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ir a enviar tarea →';
        };
        statusDiv.appendChild(submitBtn);
        contentWrapper.appendChild(statusDiv);

      } else if (mod.url) {

        const iframe = document.createElement('iframe');
        let embedUrl = mod.url;
        
        if (mod.modname === 'h5pactivity') {
          // Use our custom local_headless h5p.php player redirection
          // which forces the core H5P player in embedded layout WITH xAPI tracking enabled
          const moodleBase = mod.url.split('/mod/')[0];
          embedUrl = `${moodleBase}/local/headless/h5p.php?id=${mod.id}&token=${AuthService.getToken()}`;

          // Fetch the H5P introduction (description) asynchronously and render it
          CourseService.getH5pActivityIntro(courseId, mod.id).then(intro => {
            if (intro) {
              const descDiv = document.createElement('div');
              descDiv.className = 'h5p-description';
              descDiv.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: var(--color-surface); border-radius: 8px; border: 1px solid var(--color-border); line-height: 1.6;';
              descDiv.innerHTML = replacePluginfileUrls(intro);
              contentWrapper.insertBefore(descDiv, iframe);
            }
          });
          
          iframe.className = 'resource-content h5p-iframe';
          contentWrapper.appendChild(iframe);
          iframe.src = embedUrl; // bypass autologin wrapper
        } else {
          // Para otros recursos, intentamos ocultar la interfaz con embed=1
          embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'embed=1';
          iframe.className = 'resource-content';
          contentWrapper.appendChild(iframe);
          
          CourseService.getAutoLoginUrl(embedUrl).then(autologinUrl => {
            iframe.src = autologinUrl;
          });
        }
      } else {
        contentWrapper.innerHTML = '<p class="empty-state">Este recurso no se puede visualizar directamente.</p>';
      }

      contentContainer.appendChild(contentWrapper);

      // --- Completion Status Card Wrapper ---
      const compCardContainer = document.createElement('div');
      compCardContainer.id = 'completion-card-container';
      contentContainer.appendChild(compCardContainer);

      const updateCompletionCard = () => {
        compCardContainer.innerHTML = '';
        const comp = completionMap[mod.id];
        if (comp && comp.hascompletion) {
          const compCard = document.createElement('div');
          compCard.className = 'completion-card';
          compCard.style.cssText = 'margin-top: 1.5rem; padding: 1rem 1.25rem; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem;';

          const ruleLabels = {
            completionview: 'Ver la actividad',
            completionusegrade: 'Obtener una calificación',
            completionpassgrade: 'Obtener una calificación aprobatoria',
            completionstatusrequired: 'Completar la actividad',
            completionscorerequired: 'Obtener un puntaje mínimo',
          };

          const stateColor = comp.isoverallcomplete ? '#22c55e' : '#94a3b8';
          const stateIcon  = comp.isoverallcomplete ? '✓' : '○';
          const stateText  = comp.isoverallcomplete ? 'Completado' : 'Pendiente';

          let criteriaHtml = comp.details.map(d => {
            const label = ruleLabels[d.rulename] || d.rulename;
            const ok = d.rulevalue.status === 1;
            return `<li style="color: ${ok ? '#22c55e' : 'var(--text-muted)'}; font-size: 0.875rem;">${ok ? '✓' : '○'} ${label}</li>`;
          }).join('');

          compCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.25rem; color: ${stateColor};">${stateIcon}</span>
              <span style="font-weight: 600; color: ${stateColor};">${stateText}</span>
              ${comp.isautomatic ? '<span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">Completación automática</span>' : '<span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">Completación manual</span>'}
            </div>
            ${criteriaHtml ? `<ul style="margin: 0.25rem 0 0 2rem; padding: 0; list-style: none;">${criteriaHtml}</ul>` : ''}
          `;

          // Manual completion toggle button
          if (!comp.isautomatic && comp.istrackeduser) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = comp.isoverallcomplete ? 'btn-secondary' : 'btn-primary';
            toggleBtn.style.cssText = 'margin-top: 0.5rem; align-self: flex-start;';
            toggleBtn.textContent = comp.isoverallcomplete ? 'Marcar como no completado' : 'Marcar como completado';
            toggleBtn.onclick = async () => {
              toggleBtn.disabled = true;
              toggleBtn.textContent = 'Guardando...';
              const ok = await CourseService.markActivityComplete(mod.id, !comp.isoverallcomplete);
              if (ok) {
                completionMap = await CourseService.getActivitiesCompletionStatus(courseId);
                refreshSidebarBadges();
                updateCompletionCard();
              }
            };
            compCard.appendChild(toggleBtn);
          }

          compCardContainer.appendChild(compCard);
        }
      };

      currentUpdateCompletionCard = updateCompletionCard;
      updateCompletionCard();
      // --- End Completion Card ---

      // Navigation Buttons
      const navDiv = document.createElement('div');
      navDiv.className = 'course-nav-buttons';

      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn-secondary';
      prevBtn.textContent = 'Anterior';
      prevBtn.disabled = modIndex === 0;
      prevBtn.onclick = () => renderMainContent(modIndex - 1);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn-primary';
      nextBtn.textContent = 'Siguiente';
      nextBtn.disabled = modIndex === allModules.length - 1;
      nextBtn.onclick = () => renderMainContent(modIndex + 1);

      navDiv.appendChild(prevBtn);
      navDiv.appendChild(nextBtn);
      contentContainer.appendChild(navDiv);

      mainArea.innerHTML = '';
      mainArea.appendChild(contentContainer);
    };

    // Populate Sidebar
    contents.forEach(topic => {
      const topicTitle = document.createElement('h3');
      topicTitle.textContent = topic.name;
      sidebarList.appendChild(topicTitle);

      if (topic.modules && topic.modules.length > 0) {
        topic.modules.forEach(mod => {
          const modIndex = allModules.findIndex(m => m.id === mod.id);
          
          const modItem = document.createElement('div');
          modItem.className = 'module-item';
          modItem.dataset.modid = mod.id;
          
          const icon = document.createElement('img');
          icon.src = mod.modicon;
          icon.alt = mod.modname;
          icon.className = 'module-icon';
          
          const text = document.createElement('span');
          text.textContent = mod.name;
          
          const comp2 = completionMap[mod.id];
          const isDone2 = comp2 && comp2.isoverallcomplete;

          const iconWrap = document.createElement('span');
          iconWrap.className = 'module-icon-wrap';
          iconWrap.appendChild(icon);
          if (isDone2) {
            const overlay = document.createElement('span');
            overlay.className = 'completion-overlay';
            overlay.title = 'Completado';
            overlay.textContent = '✓';
            iconWrap.appendChild(overlay);
          }

          modItem.appendChild(iconWrap);
          modItem.appendChild(text);
          modItem.onclick = () => renderMainContent(modIndex);
          
          sidebarList.appendChild(modItem);
        });
      }
    });

    const refreshSidebarBadges = () => {
      sidebarList.querySelectorAll('.module-item[data-modid]').forEach(item => {
        const mid = parseInt(item.dataset.modid);
        const c = completionMap[mid];
        const done = c && c.isoverallcomplete;
        const wrap = item.querySelector('.module-icon-wrap');
        if (!wrap) return;
        const existing = wrap.querySelector('.completion-overlay');
        if (done && !existing) {
          const ov = document.createElement('span');
          ov.className = 'completion-overlay';
          ov.title = 'Completado';
          ov.textContent = '✓';
          wrap.appendChild(ov);
        } else if (!done && existing) {
          existing.remove();
        }
      });
    };

    content.appendChild(sidebar);
    content.appendChild(mainArea);

    // Initial render: show course outline or first module if preferred
    renderMainContent(-1);

  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <p>Hubo un error cargando el contenido del curso.</p>
        <button class="btn-primary" onclick="window.location.hash = '#/dashboard'" style="margin-top: 1rem; width: auto;">Volver</button>
      </div>
    `;
  }
}
