import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderDashboard } from '../src/views/dashboard.js';
import { renderCourse } from '../src/views/course.js';
import { CourseService } from '../src/services/courses.js';
import { AuthService } from '../src/services/auth.js';

describe('Automated Verification of Views & Security', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(AuthService, 'getToken').mockReturnValue('mock-token-xyz');
    vi.spyOn(AuthService, 'getUser').mockReturnValue({ userid: 1, fullname: 'Test User' });
  });

  afterEach(() => {
    container.remove();
    // Clear any modal dialogs
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    vi.restoreAllMocks();
  });

  it('Dashboard renders enriched content and neutralizes malicious XSS in course summary', async () => {
    const mockDashboardData = {
      active: [
        {
          id: 101,
          fullname: 'Curso Seguro de Programación',
          summary: '<p>Resumen <strong>enriquecido</strong> con formato seguro.</p><img src="x" onerror="window.__hacked=true">',
          progress: 50,
          category: 'Programación'
        }
      ],
      completed: [],
      availableByCategory: {
        'Desarrollo': [
          {
            id: 202,
            fullname: 'Curso Disponible con XSS',
            summary: '<p>Descripción con script malicioso.<script>window.__xss=true;</script></p>'
          }
        ]
      }
    };

    vi.spyOn(CourseService, 'getDashboardCourses').mockResolvedValue(mockDashboardData);
    vi.spyOn(CourseService, 'getCourseContents').mockResolvedValue([]);

    const cleanup = await renderDashboard(container);

    // Verify header and titles render
    expect(container.querySelector('header')).toBeTruthy();
    expect(container.textContent).toContain('Mis Cursos Activos');
    expect(container.textContent).toContain('Cursos Disponibles');

    // No script elements should exist anywhere in the rendered container
    expect(container.querySelectorAll('script').length).toBe(0);

    // Simulate clicking an available course to open modal structure
    const availableCard = container.querySelectorAll('.course-card')[1];
    expect(availableCard).toBeTruthy();
    availableCard.click();

    // Wait for microtasks (modal open & course contents fetch)
    await new Promise(resolve => setTimeout(resolve, 50));

    const modal = document.querySelector('.modal-overlay');
    expect(modal).toBeTruthy();
    expect(modal.querySelectorAll('script').length).toBe(0);
    expect(modal.innerHTML).not.toContain('<script');
    expect(modal.innerHTML).toContain('Descripción con script malicioso.');

    if (typeof cleanup === 'function') cleanup();
  });

  it('Course view renders topics, page content and book without executing injected scripts', async () => {
    const mockCourseContents = [
      {
        id: 1,
        name: 'Tema 1: Fundamentos <script>alert(1)</script>',
        summary: '<p>Resumen del tema con <em>estilos válidos</em>.<script>document.cookie="stolen";</script></p>',
        modules: [
          {
            id: 201,
            name: 'Página de Introducción',
            modname: 'page',
            modicon: 'https://moodle.example.com/mod/page/icon.svg'
          }
        ]
      }
    ];

    vi.spyOn(CourseService, 'getCourseContents').mockResolvedValue(mockCourseContents);
    vi.spyOn(CourseService, 'getActivitiesCompletionStatus').mockResolvedValue({});

    const cleanup = await renderCourse(container, 42);

    expect(container.querySelector('.course-layout')).toBeTruthy();
    expect(container.querySelectorAll('script').length).toBe(0);
    expect(container.innerHTML).not.toContain('<script>document.cookie');
    expect(container.innerHTML).toContain('Resumen del tema con <em>estilos válidos</em>.');

    if (typeof cleanup === 'function') cleanup();
  });
});
