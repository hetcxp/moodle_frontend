import{CertService as e}from"./cert-rZRRyXJT.js";function t({mod:t,certData:n,issuances:r,courseId:i}){let a=Array.isArray(r)&&r.length>0,o=document.createElement(`div`);o.className=`cert-viewer`,o.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    background: var(--color-surface, #1e1e2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    max-width: 640px;
    margin: 0 auto;
  `;let s=document.createElement(`div`);s.style.cssText=`display:flex; align-items:center; gap:1rem;`;let c=document.createElement(`div`);c.style.cssText=`
    width: 56px; height: 56px;
    background: var(--color-primary-alpha, rgba(99,102,241,0.15));
    border-radius: 12px;
    display: flex; align-items:center; justify-content:center;
    font-size: 1.75rem; flex-shrink:0;
  `,c.textContent=`🎓`;let l=document.createElement(`div`),u=document.createElement(`h3`);u.textContent=t.name,u.style.cssText=`margin:0; font-size:1.2rem; font-weight:600; color: var(--color-text, #fff);`;let d=document.createElement(`p`);if(d.textContent=`Certificado de finalización`,d.style.cssText=`margin:0.25rem 0 0; font-size:0.85rem; color: var(--color-text-muted, #888);`,l.appendChild(u),l.appendChild(d),s.appendChild(c),s.appendChild(l),o.appendChild(s),n?.intro){let e=document.createElement(`div`);e.className=`cert-intro`,e.style.cssText=`
      font-size: 0.9rem;
      color: var(--color-text-muted, #aaa);
      line-height: 1.6;
      padding: 1rem;
      background: var(--color-surface-2, rgba(255,255,255,0.04));
      border-radius: 8px;
      border: 1px solid var(--color-border, #333);
    `,e.innerHTML=n.intro,o.appendChild(e)}let f=document.createElement(`div`);if(f.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
    ${a?`background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);`:`background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.2);`}
  `,f.innerHTML=a?`<span>✅</span><span>Certificado emitido</span>`:`<span>⏳</span><span>Aún no emitido</span>`,o.appendChild(f),!a){let e=document.createElement(`div`);e.style.cssText=`
      padding: 1rem 1.25rem;
      background: rgba(251,191,36,0.08);
      border: 1px solid rgba(251,191,36,0.25);
      border-radius: 8px;
      font-size: 0.875rem;
      color: #fbbf24;
      line-height: 1.5;
    `;let t=null;if(n?.requiredtime&&n.requiredtime>0){let e=Math.round(n.requiredtime/60);t=`Debes pasar al menos ${e} minuto${e===1?``:`s`} en el curso.`}e.innerHTML=`
      <strong>⚠️ Requisito pendiente</strong><br>
      ${t||`Aún no cumples las condiciones para obtener tu certificado. Completa las actividades requeridas del curso.`}
    `,o.appendChild(e)}let p=document.createElement(`div`);p.style.cssText=`display:flex; gap:0.75rem; flex-wrap:wrap;`;let m=document.createElement(`button`);return m.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: ${a?`pointer`:`not-allowed`};
    border: none;
    transition: opacity 0.2s, transform 0.15s;
    ${a?`background: var(--color-primary, #6366f1); color: #fff; opacity: 1;`:`background: var(--color-border, #333); color: var(--color-text-muted, #666); opacity: 0.6;`}
  `,m.innerHTML=`<span>⬇</span><span>Descargar PDF</span>`,m.disabled=!a,m.title=a?`Descargar tu certificado en PDF`:`Completa los requisitos del curso para descargar tu certificado`,a&&(m.addEventListener(`mouseenter`,()=>{m.style.transform=`translateY(-1px)`,m.style.opacity=`0.9`}),m.addEventListener(`mouseleave`,()=>{m.style.transform=``,m.style.opacity=`1`}),m.addEventListener(`click`,async()=>{m.disabled=!0,m.innerHTML=`<span>⏳</span><span>Descargando…</span>`,await e.downloadPdf(t),m.disabled=!1,m.innerHTML=`<span>⬇</span><span>Descargar PDF</span>`})),p.appendChild(m),o.appendChild(p),o}export{t as createCertViewer};