import { API_CONFIG } from '../config/api.js';
import { AuthService } from '../services/auth.js';

export function getCourseImageUrl(course) {
  const replaceBaseUrl = (url) => url;

  // 1. If course has direct courseimage field (Moodle 4.0+ enrol endpoint)
  if (course.courseimage) {
    const url = replaceBaseUrl(course.courseimage);
    // Use webservice/pluginfile.php instead of pluginfile.php to allow token authentication
    const wsUrl = url.replace(/\/pluginfile\.php/, '/webservice/pluginfile.php');
    if (wsUrl.includes('?')) {
      return `${wsUrl}&token=${AuthService.getToken()}`;
    }
    return `${wsUrl}?token=${AuthService.getToken()}`;
  }

  // 2. If course has overviewfiles array (Moodle search endpoint)
  if (course.overviewfiles && course.overviewfiles.length > 0) {
    const file = course.overviewfiles[0];
    if (file.fileurl) {
      const url = replaceBaseUrl(file.fileurl);
      const wsUrl = url.replace(/\/pluginfile\.php/, '/webservice/pluginfile.php');
      if (wsUrl.includes('?')) {
        return `${wsUrl}&token=${AuthService.getToken()}`;
      }
      return `${wsUrl}?token=${AuthService.getToken()}`;
    }
  }

  // 3. Fallback generic image
  return '/generic-course.svg';
}

export function replacePluginfileUrls(html) {
  if (!html) return html;
  const token = AuthService.getToken();
  if (!token) return html;

  // Busca cualquier pluginfile.php (con o sin webservice/ previo)
  return html.replace(/src="([^"]*?pluginfile\.php[^"]*)"/g, (match, url) => {
    // 1. Asegurar que tenga /webservice/pluginfile.php
    let cleanUrl = url.replace(/\/webservice\/pluginfile\.php/, '/pluginfile.php');
    cleanUrl = cleanUrl.replace(/\/pluginfile\.php/, '/webservice/pluginfile.php');
    
    // 2. Asegurar que tenga el token (si no lo tiene ya)
    if (!cleanUrl.includes('token=')) {
      const joiner = cleanUrl.includes('?') ? '&' : '?';
      cleanUrl = `${cleanUrl}${joiner}token=${token}`;
    }
    
    return `src="${cleanUrl}"`;
  });
}

export function replaceRelativeImages(html, contents) {
  if (!html || !contents) return html;
  const token = AuthService.getToken();
  if (!token) return html;

  let processedHtml = html;

  contents.forEach(file => {
    if (file.type === 'file' && file.filename.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
      const joiner = file.fileurl.includes('?') ? '&' : '?';
      const authUrl = `${file.fileurl}${joiner}token=${token}`;
      
      // Reemplaza src="algo/archivo.png" o src="archivo.png" por la URL autenticada de Web Services
      const regex = new RegExp(`src=["'][^"']*?${file.filename}["']`, 'gi');
      processedHtml = processedHtml.replace(regex, `src="${authUrl}"`);
    }
  });

  return processedHtml;
}
