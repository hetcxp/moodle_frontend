import { QuizService } from '../services/quiz.js';
import { createLoader } from './loader.js';

export function createQuizRunner(courseId, mod, onCompletionUpdate) {
  const container = document.createElement('div');
  container.className = 'quiz-runner-container';

  let currentAttemptId = null;
  let timerInterval = null;

  // Initial loading
  renderLoading();
  initQuiz();

  async function initQuiz() {
    window.scrollTo(0, 0);
    const mainArea = document.querySelector('.course-main');
    if (mainArea) mainArea.scrollTo(0, 0);

    try {
      const quiz = await QuizService.getQuizByCmId(courseId, mod.id);
      if (!quiz) {
        renderError('No se pudo cargar la información del examen.');
        return;
      }

      const attempts = await QuizService.getUserAttempts(quiz.id);
      const inProgressAttempt = attempts.find(a => a.state === 'inprogress' || a.state === 'overdue');

      if (inProgressAttempt) {
        // Resume active attempt directly
        currentAttemptId = inProgressAttempt.id;
        loadAttemptPage(inProgressAttempt.id, inProgressAttempt.currentpage || 0);
      } else {
        // Show Cover Screen
        renderCoverScreen(quiz, attempts);
      }
    } catch (err) {
      console.error('Error initializing quiz runner:', err);
      renderError('Ocurrió un error al conectar con el servidor de exámenes.');
    }
  }

  function renderLoading(message = 'Cargando examen...') {
    stopTimer();
    container.innerHTML = '';
    const loaderWrap = document.createElement('div');
    loaderWrap.style.padding = '3rem';
    loaderWrap.style.textAlign = 'center';
    loaderWrap.appendChild(createLoader());
    if (message) {
      const p = document.createElement('p');
      p.style.marginTop = '1rem';
      p.style.color = 'var(--text-muted)';
      p.textContent = message;
      loaderWrap.appendChild(p);
    }
    container.appendChild(loaderWrap);
  }

  function renderError(msg) {
    stopTimer();
    container.innerHTML = `
      <div class="quiz-cover-card" style="text-align: center;">
        <h3 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Error</h3>
        <p>${msg}</p>
        <button type="button" class="btn-primary" style="margin-top: 1.5rem;" id="quiz-retry-btn">Reintentar</button>
      </div>
    `;
    const btn = container.querySelector('#quiz-retry-btn');
    if (btn) btn.onclick = () => initQuiz();
  }

  /* --- 1. COVER SCREEN --- */
  function renderCoverScreen(quiz, attempts) {
    stopTimer();
    container.innerHTML = '';

    const coverCard = document.createElement('div');
    coverCard.className = 'quiz-cover-card';

    const title = document.createElement('h2');
    title.textContent = quiz.name;
    coverCard.appendChild(title);

    if (quiz.intro) {
      const introDiv = document.createElement('div');
      introDiv.className = 'quiz-intro-text';
      introDiv.innerHTML = quiz.intro;
      coverCard.appendChild(introDiv);
    }

    // Rules / Info Badges
    const rulesDiv = document.createElement('div');
    rulesDiv.style.cssText = 'display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-muted);';
    
    if (quiz.timelimit > 0) {
      const mins = Math.floor(quiz.timelimit / 60);
      rulesDiv.innerHTML += `<div>⏱️ <strong>Límite de tiempo:</strong> ${mins} min</div>`;
    }
    if (quiz.attempts > 0) {
      rulesDiv.innerHTML += `<div>🔄 <strong>Intentos permitidos:</strong> ${quiz.attempts}</div>`;
    } else {
      rulesDiv.innerHTML += `<div>🔄 <strong>Intentos permitidos:</strong> Sin límite</div>`;
    }
    coverCard.appendChild(rulesDiv);

    // History Table
    if (attempts.length > 0) {
      const historyTitle = document.createElement('h4');
      historyTitle.textContent = 'Historial de Intentos';
      historyTitle.style.marginTop = '1.5rem';
      coverCard.appendChild(historyTitle);

      const table = document.createElement('table');
      table.className = 'quiz-attempts-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Intento</th>
            <th>Estado</th>
            <th>Calificación</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${attempts.map(a => {
            const isFinished = a.state === 'finished';
            return `
            <tr>
              <td>#${a.attempt}</td>
              <td>${isFinished ? 'Finalizado' : 'En progreso'}</td>
              <td><strong>${a.sumgrades !== undefined && a.sumgrades !== null ? parseFloat(a.sumgrades).toFixed(2) : '-'}</strong></td>
              <td>
                ${isFinished ? `<button type="button" class="btn-secondary review-btn" data-aid="${a.id}">Ver revisión</button>` : `<button type="button" class="btn-primary resume-btn" data-aid="${a.id}" data-page="${a.currentpage || 0}">Continuar intento</button>`}
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      `;
      coverCard.appendChild(table);

      // Event listeners for attempt action buttons
      table.querySelectorAll('.review-btn').forEach(btn => {
        btn.onclick = () => loadReviewScreen(btn.dataset.aid);
      });
      table.querySelectorAll('.resume-btn').forEach(btn => {
        btn.onclick = () => loadAttemptPage(btn.dataset.aid, parseInt(btn.dataset.page || '0', 10));
      });
    }

    // Actions (Start / Resume)
    const inProgress = attempts.find(a => a.state === 'inprogress' || a.state === 'overdue');
    const canStartNew = !inProgress && (quiz.attempts === 0 || attempts.length < quiz.attempts);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.marginTop = '2rem';

    if (inProgress) {
      const resumeBtn = document.createElement('button');
      resumeBtn.type = 'button';
      resumeBtn.className = 'btn-primary';
      resumeBtn.textContent = 'Continuar intento activo';
      resumeBtn.onclick = () => loadAttemptPage(inProgress.id, inProgress.currentpage || 0);
      actionsDiv.appendChild(resumeBtn);
    } else if (canStartNew) {
      const startBtn = document.createElement('button');
      startBtn.type = 'button';
      startBtn.className = 'btn-primary';
      startBtn.textContent = attempts.length > 0 ? 'Iniciar un nuevo intento' : 'Iniciar examen';
      startBtn.onclick = async () => {
        startBtn.disabled = true;
        startBtn.textContent = 'Iniciando...';
        try {
          const attempt = await QuizService.startAttempt(quiz.id);
          currentAttemptId = attempt.id;
          loadAttemptPage(attempt.id, 0);
        } catch (e) {
          alert('No se pudo iniciar el examen. ' + (e.message || ''));
          startBtn.disabled = false;
          startBtn.textContent = 'Iniciar examen';
        }
      };
      actionsDiv.appendChild(startBtn);
    }
    coverCard.appendChild(actionsDiv);

    container.appendChild(coverCard);
  }

  /* --- 2. ATTEMPT EXECUTION & PAGINATION SCREEN --- */
  async function loadAttemptPage(attemptId, page) {
    window.scrollTo(0, 0);
    const mainArea = document.querySelector('.course-main');
    if (mainArea) mainArea.scrollTo(0, 0);

    renderLoading('Cargando preguntas...');
    try {
      const data = await QuizService.getAttemptData(attemptId, page);
      renderAttemptPage(attemptId, page, data);
    } catch (e) {
      console.error('Error loading attempt page:', e);
      renderError('No se pudieron cargar las preguntas del intento.');
    }
  }

  function renderAttemptPage(attemptId, page, data) {
    stopTimer();
    container.innerHTML = '';
    currentAttemptId = attemptId;

    window.scrollTo(0, 0);
    const mainArea = document.querySelector('.course-main');
    if (mainArea) mainArea.scrollTo(0, 0);

    const { attempt, questions, nextpage } = data;

    // Top Header & Timer Bar
    const headerBar = document.createElement('div');
    headerBar.className = 'quiz-header-bar';

    const titleInfo = document.createElement('div');
    titleInfo.innerHTML = `<h3 style="margin: 0;">Página ${page + 1}</h3>`;
    headerBar.appendChild(titleInfo);

    // Countdown Timer (if time remaining)
    const timerBadge = document.createElement('div');
    timerBadge.className = 'quiz-timer-badge';
    timerBadge.style.display = 'none';
    headerBar.appendChild(timerBadge);
    container.appendChild(headerBar);

    if (attempt && attempt.timefinish) {
      startCountdownTimer(attempt.timefinish, timerBadge, async () => {
        alert('El tiempo del examen ha expirado. Tus respuestas serán enviadas automáticamente.');
        const inputs = extractCurrentPageInputs(questionsForm);
        await QuizService.processAttempt(attemptId, inputs, true);
        if (onCompletionUpdate) onCompletionUpdate();
        loadReviewScreen(attemptId);
      });
    }

    // Questions Form
    const questionsForm = document.createElement('form');
    questionsForm.id = 'quiz-questions-form';
    questionsForm.onsubmit = (e) => e.preventDefault();

    if (!questions || questions.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'quiz-question-box';
      emptyMsg.textContent = 'No hay preguntas disponibles en esta página.';
      questionsForm.appendChild(emptyMsg);
    } else {
      questions.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.className = 'quiz-question-box';
        qBox.id = `question-${q.slot}`;

        const qBody = document.createElement('div');
        qBody.className = 'quiz-question-body';
        qBody.innerHTML = q.html;

        // Custom styling & translation for "Clear my choice"
        qBody.querySelectorAll('.clearchoice, [class*="clearchoice"]').forEach(el => {
          const label = el.querySelector('label') || el;
          if (label && (label.textContent.includes('Clear my choice') || label.textContent.includes('Borrar mi elección'))) {
            label.textContent = '🧹 Borrar selección';
          }
        });

        qBox.appendChild(qBody);

        questionsForm.appendChild(qBox);
      });
    }

    container.appendChild(questionsForm);

    // Bottom Navigation Bar
    const navBar = document.createElement('div');
    navBar.className = 'quiz-pagination-bar';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn-secondary';
    prevBtn.textContent = '← Página anterior';
    prevBtn.disabled = (page <= 0);
    prevBtn.onclick = async () => {
      prevBtn.disabled = true;
      const inputs = extractCurrentPageInputs(questionsForm);
      await QuizService.saveAttempt(attemptId, inputs);
      loadAttemptPage(attemptId, page - 1);
    };

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';

    if (nextpage === -1) {
      // Last page: Enviar y terminar button
      nextBtn.className = 'btn-primary';
      nextBtn.textContent = 'Enviar y terminar';
      nextBtn.onclick = (e) => {
        e.preventDefault();
        openConfirmationModal(attemptId, questionsForm);
      };
    } else {
      nextBtn.className = 'btn-primary';
      nextBtn.textContent = 'Siguiente página →';
      nextBtn.onclick = async (e) => {
        e.preventDefault();
        nextBtn.disabled = true;
        const inputs = extractCurrentPageInputs(questionsForm);
        await QuizService.saveAttempt(attemptId, inputs);
        loadAttemptPage(attemptId, nextpage);
      };
    }

    navBar.appendChild(prevBtn);
    navBar.appendChild(nextBtn);
    container.appendChild(navBar);
  }

  /* --- Helper: Extract form input key-values --- */
  function extractCurrentPageInputs(formElement) {
    const inputs = [];
    if (!formElement) return inputs;

    const elements = formElement.querySelectorAll('input, select, textarea');
    elements.forEach(el => {
      if (!el.name) return;

      if (el.type === 'radio' || el.type === 'checkbox') {
        if (el.checked) {
          inputs.push({ name: el.name, value: el.value });
        }
      } else {
        inputs.push({ name: el.name, value: el.value });
      }
    });

    return inputs;
  }

  /* --- Helper: Countdown Timer --- */
  function startCountdownTimer(timeFinishSec, badgeElement, onExpire) {
    stopTimer();
    badgeElement.style.display = 'inline-flex';

    function update() {
      const nowSec = Math.floor(Date.now() / 1000);
      const remainingSec = timeFinishSec - nowSec;

      if (remainingSec <= 0) {
        stopTimer();
        badgeElement.textContent = '⏱️ 00:00:00';
        if (onExpire) onExpire();
        return;
      }

      const hrs = Math.floor(remainingSec / 3600);
      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;

      const pad = n => String(n).padStart(2, '0');
      badgeElement.textContent = `⏱️ ${hrs > 0 ? pad(hrs) + ':' : ''}${pad(mins)}:${pad(secs)}`;

      if (remainingSec < 120) {
        badgeElement.classList.add('warning');
      } else {
        badgeElement.classList.remove('warning');
      }
    }

    update();
    timerInterval = setInterval(update, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /* --- Confirmation Modal --- */
  function openConfirmationModal(attemptId, questionsForm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'quiz-modal-overlay';

    const modalCard = document.createElement('div');
    modalCard.className = 'quiz-modal-card';
    modalCard.innerHTML = `
      <h3 style="margin-top: 0; color: var(--color-text-primary, #111827); font-size: 1.35rem; font-weight: 700;">¿Confirmar envío del examen?</h3>
      <p style="margin-top: 1rem; color: var(--color-text-secondary, #4b5563); line-height: 1.6; font-size: 0.98rem;">
        Una vez que envíes tus respuestas, no podrás modificar ninguna opción de este intento.
      </p>
    `;

    const actions = document.createElement('div');
    actions.className = 'quiz-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => {
      if (document.body.contains(modalOverlay)) {
        document.body.removeChild(modalOverlay);
      }
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn-primary';
    confirmBtn.textContent = 'Sí, entregar examen';
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Entregando...';
      try {
        const inputs = extractCurrentPageInputs(questionsForm);
        await QuizService.processAttempt(attemptId, inputs, true);
        if (document.body.contains(modalOverlay)) {
          document.body.removeChild(modalOverlay);
        }
        if (onCompletionUpdate) onCompletionUpdate();
        loadReviewScreen(attemptId);
      } catch (e) {
        alert('Error al enviar el intento. Intenta nuevamente.');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Sí, entregar examen';
      }
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    modalCard.appendChild(actions);
    modalOverlay.appendChild(modalCard);

    document.body.appendChild(modalOverlay);
  }

  /* --- 3. REVIEW SCREEN --- */
  async function loadReviewScreen(attemptId) {
    window.scrollTo(0, 0);
    const mainArea = document.querySelector('.course-main');
    if (mainArea) mainArea.scrollTo(0, 0);

    renderLoading('Cargando revisión del examen...');
    try {
      const review = await QuizService.getAttemptReview(attemptId);
      if (!review) {
        renderError('No se pudo cargar la revisión.');
        return;
      }
      renderReviewScreen(review);
    } catch (e) {
      console.error('Error loading review:', e);
      renderError('Ocurrió un error al cargar la revisión del examen.');
    }
  }

  function renderReviewScreen(review) {
    stopTimer();
    container.innerHTML = '';

    window.scrollTo(0, 0);
    const mainArea = document.querySelector('.course-main');
    if (mainArea) mainArea.scrollTo(0, 0);

    const reviewCard = document.createElement('div');
    reviewCard.className = 'quiz-review-card';

    const title = document.createElement('h2');
    title.textContent = 'Revisión del Examen';
    reviewCard.appendChild(title);

    // Score Banner
    if (review.grade !== undefined && review.grade !== null) {
      const banner = document.createElement('div');
      banner.className = 'quiz-grade-banner';
      banner.innerHTML = `
        <div>
          <div style="font-weight: 600; color: var(--text-h); font-size: 1.1rem;">Calificación Final</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Obtenida en este intento</div>
        </div>
        <div class="quiz-grade-score">${parseFloat(review.grade).toFixed(2)}</div>
      `;
      reviewCard.appendChild(banner);
    }

    // Questions Breakdown
    if (review.questions && review.questions.length > 0) {
      review.questions.forEach((q) => {
        const qBox = document.createElement('div');
        qBox.className = 'quiz-question-box';
        qBox.style.marginBottom = '1.5rem';

        const qHeader = document.createElement('div');
        qHeader.className = 'quiz-question-header';
        qHeader.innerHTML = `
          <span class="quiz-question-number">Pregunta ${q.slot}</span>
          <span class="quiz-question-state">${q.status || q.state || ''}</span>
        `;
        qBox.appendChild(qHeader);

        const qBody = document.createElement('div');
        qBody.className = 'quiz-question-body';
        qBody.innerHTML = q.html;
        qBox.appendChild(qBody);

        reviewCard.appendChild(qBox);
      });
    }

    // Back to Cover Button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'btn-primary';
    backBtn.style.marginTop = '1.5rem';
    backBtn.textContent = 'Volver al resumen del examen';
    backBtn.onclick = () => initQuiz();
    reviewCard.appendChild(backBtn);

    container.appendChild(reviewCard);
  }

  return container;
}
