declare global {
  interface Window {
    __closePrint__?: () => void;
  }
}

// ── PRINT ─────────────────────────────────────────────────────────────
export function openPrint(html: string) {
  // Inject portal directly into body (outside React root) so @media print can isolate it
  let portal = document.getElementById('__print_portal__') as HTMLDivElement | null;
  if (!portal) {
    portal = document.createElement('div');
    portal.id = '__print_portal__';
    document.body.appendChild(portal);
  }

  window.__closePrint__ = () => {
    portal.innerHTML = '';
    portal.style.display = 'none';
  };

  portal.style.display = 'block';
  portal.innerHTML = `
    <style>
      @media print {
        body > *:not(#__print_portal__) { display: none !important; }
        #__print_portal__ { position: static !important; overflow: visible !important;
          height: auto !important; padding: 0 !important; background: white !important; }
        #__print_portal__ .__pbar__ { display: none !important; }
        .pgbrk { page-break-after: always; break-after: page; height: 0; overflow: hidden; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        svg { overflow: visible; }
      }
      @media screen {
        #__print_portal__ {
          position: fixed; inset: 0; background: white; z-index: 9999;
          overflow-y: auto; padding: 32px 40px;
          font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
        }
      }
      #__print_portal__ *, #__print_portal__ *::before, #__print_portal__ *::after { box-sizing: border-box; }
      #__print_portal__ { color: #1A1A1A; }
      #__print_portal__ [style*="color:#888"],
      #__print_portal__ [style*="color: #888"],
      #__print_portal__ [style*="color:#999"],
      #__print_portal__ [style*="color: #999"],
      #__print_portal__ [style*="color:#AAA"],
      #__print_portal__ [style*="color: #AAA"],
      #__print_portal__ [style*="color:#aaa"],
      #__print_portal__ [style*="color: #aaa"],
      #__print_portal__ [style*="color: rgb(136, 136, 136)"],
      #__print_portal__ [style*="color: rgb(153, 153, 153)"],
      #__print_portal__ [style*="color: rgb(170, 170, 170)"] {
        color: #3F3F3F !important;
      }
    </style>
    <div class="__pbar__" style="position:sticky;top:0;background:#fff;padding:10px 0 12px;
      margin-bottom:28px;border-bottom:2px solid #f0ebe0;display:flex;gap:8px;
      justify-content:flex-end;z-index:10;">
      <button onclick="window.print()"
        style="background:#1A1A1A;color:#fff;border:none;padding:8px 22px;border-radius:4px;
        font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
        🖨 Imprimir / Guardar PDF
      </button>
      <button onclick="window.__closePrint__()"
        style="background:transparent;color:#888;border:1px solid #ddd;padding:8px 16px;
        border-radius:4px;font-size:12px;cursor:pointer;">
        ✕ Cerrar
      </button>
    </div>
    <div style="max-width:820px;margin:0 auto;">${html}</div>
  `;
}
