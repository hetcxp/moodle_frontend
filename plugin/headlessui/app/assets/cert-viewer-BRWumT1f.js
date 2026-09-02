import{a as e}from"./index-BnGkhJyK.js";import{CertService as t}from"./cert-UKemq3KJ.js";function n({mod:n,certData:r,issuances:i,courseId:a}){let o=Array.isArray(i)&&i.length>0,s=document.createElement(`div`);s.className=`cert-viewer`,s.style.cssText=`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card, 12px);
    max-width: 640px;
    margin: 0 auto;
  `;let c=document.createElement(`div`);c.style.cssText=`display:flex; align-items:center; gap:1rem;`;let l=document.createElement(`div`);l.style.cssText=`
    width: 56px; height: 56px;
    background: var(--color-primary-alpha, rgba(99,102,241,0.15));
    border-radius: var(--radius-card, 12px);
    display: flex; align-items:center; justify-content:center;
    font-size: 1.75rem; flex-shrink:0;
  `,l.textContent=`🎓`;let u=document.createElement(`div`),d=document.createElement(`h3`);d.textContent=n.name,d.style.cssText=`margin:0; font-size:1.2rem; font-weight:600; color: var(--color-text-primary);`;let f=document.createElement(`p`);if(f.textContent=`Certificado de finalización`,f.style.cssText=`margin:0.25rem 0 0; font-size:0.85rem; color: var(--color-text-secondary);`,u.appendChild(d),u.appendChild(f),c.appendChild(l),c.appendChild(u),s.appendChild(c),r?.intro){let t=document.createElement(`div`);t.className=`cert-intro`,t.style.cssText=`
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      padding: 1rem;
      background: var(--color-bg-hover, rgba(0,0,0,0.03));
      border-radius: 8px;
      border: 1px solid var(--color-border);
    `,t.innerHTML=e(r.intro),s.appendChild(t)}let p=document.createElement(`div`);if(p.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
    ${o?`background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3);`:`background: rgba(148,163,184,0.15); color: var(--color-text-secondary); border: 1px solid var(--color-border);`}
  `,p.innerHTML=o?`<span>✅</span><span>Certificado emitido</span>`:`<span>⏳</span><span>Aún no emitido</span>`,s.appendChild(p),!o){let e=document.createElement(`div`);e.style.cssText=`
      padding: 1rem 1.25rem;
      background: rgba(251,191,36,0.08);
      border: 1px solid rgba(251,191,36,0.25);
      border-radius: 8px;
      font-size: 0.875rem;
      color: #d97706;
      line-height: 1.5;
    `;let t=null;if(r?.requiredtime&&r.requiredtime>0){let e=Math.round(r.requiredtime/60);t=`Debes pasar al menos ${e} minuto${e===1?``:`s`} en el curso.`}e.innerHTML=`
      <strong>⚠️ Requisito pendiente</strong><br>
      ${t||`Aún no cumples las condiciones para obtener tu certificado. Completa las actividades requeridas del curso.`}
    `,s.appendChild(e)}let m=document.createElement(`div`);m.style.cssText=`display:flex; gap:0.75rem; flex-wrap:wrap;`;let h=document.createElement(`button`);return h.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: ${o?`pointer`:`not-allowed`};
    border: none;
    transition: opacity 0.2s, transform 0.15s;
    ${o?`background: var(--color-primary); color: #ffffff; opacity: 1;`:`background: var(--color-border); color: var(--color-text-secondary); opacity: 0.6;`}
  `,h.innerHTML=`<span>⬇</span><span>Descargar PDF</span>`,h.disabled=!o,h.title=o?`Descargar tu certificado en PDF`:`Completa los requisitos del curso para descargar tu certificado`,o&&(h.addEventListener(`mouseenter`,()=>{h.style.transform=`translateY(-1px)`,h.style.opacity=`0.9`}),h.addEventListener(`mouseleave`,()=>{h.style.transform=``,h.style.opacity=`1`}),h.addEventListener(`click`,async()=>{h.disabled=!0,h.innerHTML=`<span>⏳</span><span>Descargando…</span>`,await t.downloadPdf(n),h.disabled=!1,h.innerHTML=`<span>⬇</span><span>Descargar PDF</span>`})),m.appendChild(h),s.appendChild(m),s}export{n as createCertViewer};