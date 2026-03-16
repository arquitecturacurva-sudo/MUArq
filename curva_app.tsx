import React, { useState, useMemo, useRef } from "react";

const G="#C9A96E", DK="#1A1A1A", BG="#F5F3EF";
const fmt = n => "S/ " + Math.round(n).toLocaleString("es-PE");
const rnd = (n,s) => s>0 ? Math.round(n/s)*s : Math.round(n);
const fDate = d => {
  if(!d) return "—";
  const [y,m,day] = d.split("-");
  const ms=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${+day} de ${ms[m-1]} de ${y}`;
};
const fDateShort = d => {
  if(!d) return "";
  const [,m,day] = d.split("-");
  const ms=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${+day} ${ms[+m-1]}`;
};
const addWeeks = (dateStr, weeks) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
};

const si = {width:"100%",padding:"8px 10px",border:"1px solid #DDD8CC",borderRadius:4,background:"#FDFCF9",color:DK,fontSize:12,boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const lb = {fontSize:9,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4,display:"block"};
const cardS = {background:"#fff",borderRadius:8,padding:22,boxShadow:"0 1px 4px rgba(0,0,0,0.07)",marginBottom:16};

const Fld = ({label,children}) => <div style={{marginBottom:12}}><label style={lb}>{label}</label>{children}</div>;
const Inp = ({value,onChange,type="text",placeholder,min}) => <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} style={si}/>;
const Sel = ({value,onChange,options}) => <select value={value} onChange={e=>onChange(e.target.value)} style={si}>{options.map(o=><option key={o}>{o}</option>)}</select>;
const Btn = ({children,onClick,v="dk",sm}) => {
  const styles={dk:{background:DK,color:"#fff",border:"none"},ol:{background:"transparent",color:DK,border:"1px solid "+DK},gd:{background:G,color:"#fff",border:"none"}};
  return <button onClick={onClick} style={{...styles[v],padding:sm?"5px 12px":"9px 20px",borderRadius:4,fontSize:sm?10:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.5px"}}>{children}</button>;
};

// ── PRINT ─────────────────────────────────────────────────────────────
const PRINT_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #1A1A1A; background: #fff; }
  svg { display: inline-block; vertical-align: middle; overflow: visible; }
  .page-break { page-break-after: always; break-after: page; height: 0; overflow: hidden; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media screen {
    body { padding: 24px 32px; max-width: 860px; margin: 0 auto; }
  }
`;
function openPrintWin(html) {
  const w = window.open('','_blank','width=980,height=820,scrollbars=yes,resizable=yes');
  if(!w){ alert('Permite ventanas emergentes para imprimir.'); return; }
  const bar = `<div class="no-print" style="position:sticky;top:0;z-index:99;background:#fff;border-bottom:1px solid #eee;padding:10px 0;margin-bottom:28px;display:flex;gap:8px;justify-content:flex-end;">
    <button onclick="window.print()" style="background:#1A1A1A;color:#fff;border:none;padding:8px 22px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">🖨 Imprimir / Guardar PDF</button>
    <button onclick="window.close()" style="background:transparent;color:#888;border:1px solid #ddd;padding:8px 16px;border-radius:4px;font-size:12px;cursor:pointer;">Cerrar</button>
  </div>`;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CURVA Arquitectos</title><style>${PRINT_CSS}</style></head><body>${bar}${html}</body></html>`);
  w.document.close();
}

// ── INFO BUBBLE ───────────────────────────────────────────────────────
const README={
  calc:{title:"Calculadora de Honorarios",steps:[{n:1,t:"Datos del proyecto",d:"Ingresa cliente, proyecto, área, tipo, etapa y modelo de contratación."},{n:2,t:"Factores y extras",d:"Ajusta complejidad, urgencia y tipo de cliente. Agrega margen, descuento y adicionales."},{n:3,t:"Resultado",d:"Revisa el desglose, el rango ±8% y los hitos de cobro. Usa 🖨 para exportar."}],nota:"Los honorarios son referenciales. Valida siempre con alcance, exclusiones y entregables."},
  matrix:{title:"Matriz de Entregables",steps:[{n:1,t:"Selecciona el paquete",d:"Elige el tipo de servicio. Los ítems se filtran automáticamente."},{n:2,t:"Activa o desactiva ítems",d:"Clic en ✓/○ para incluir o excluir cada entregable."},{n:3,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para sumar entregables de otros paquetes."},{n:4,t:"Exporta",d:"Usa 🖨 para imprimir o guarda como PDF desde el panel de vista."}],nota:"Los entregables específicos deben confirmarse en el contrato de servicios."},
  excl:{title:"Exclusiones y Supuestos",steps:[{n:1,t:"Datos del encargo",d:"Ingresa cliente, proyecto, código y responsable."},{n:2,t:"Activa 'Mostrar'",d:"Solo los ítems con ✓ en Mostrar aparecen en la presentación al cliente."},{n:3,t:"Edita el texto",d:"Clic en cualquier texto de 'Texto para cliente' para editarlo."},{n:4,t:"Cambia el estado",d:"Cada ítem puede ser Excluido, Supuesto o Revisión."},{n:5,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para agregar de la biblioteca o crear uno personalizado."}],nota:"Este documento no reemplaza el contrato. Sirve para delimitar el alcance."},
  cron:{title:"Cronograma por Etapas",steps:[{n:1,t:"Fecha de inicio",d:"Define la fecha de inicio estimada. Las fechas se calculan automáticamente."},{n:2,t:"Activa las etapas",d:"Marca las etapas que aplican al encargo."},{n:3,t:"Ajusta las duraciones",d:"Cambia el número de semanas o arrastra los bloques del Gantt."},{n:4,t:"Honorario opcional",d:"Si ingresas el honorario total, se muestran los hitos de cobro con montos."}],nota:"Los plazos están condicionados a aprobaciones oportunas del cliente."},
  oc:{title:"Orden de Cambio",steps:[{n:1,t:"Datos generales",d:"Asigna un código correlativo e indica quién solicita el cambio."},{n:2,t:"Resumen del cambio",d:"Describe qué cambia, el motivo y el tipo de impacto."},{n:3,t:"Detalle comparativo",d:"Completa la tabla Antes / Después para alcance, entregables y plazo."},{n:4,t:"Impacto económico",d:"Indica el honorario adicional, la extensión de plazo y el nuevo total."},{n:5,t:"Aprobación",d:"Completa los datos de firma de ambas partes."}],nota:"La ejecución del cambio queda sujeta a aprobación expresa del cliente."},
};
function InfoBubble({toolId}) {
  const [open,setOpen]=useState(false);
  const info=README[toolId];
  if(!info) return null;
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.25)"}}/>}
      <div style={{position:"fixed",bottom:24,right:28,zIndex:100}}>
        {open&&(
          <div style={{position:"absolute",bottom:52,right:0,width:340,background:"#fff",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",overflow:"hidden",border:"1px solid #E5DDD0"}}>
            <div style={{background:DK,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:G,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px"}}>Cómo usar</span>
              <span style={{color:"#fff",fontWeight:700,fontSize:12}}>{info.title}</span>
            </div>
            <div style={{padding:"14px 16px",maxHeight:360,overflowY:"auto"}}>
              {info.steps.map(s=>(
                <div key={s.n} style={{display:"flex",gap:10,marginBottom:12}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:G,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{s.n}</div>
                  <div><div style={{fontSize:11,fontWeight:700,color:DK,marginBottom:2}}>{s.t}</div><div style={{fontSize:10,color:"#666",lineHeight:1.5}}>{s.d}</div></div>
                </div>
              ))}
              {info.nota&&<div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"8px 10px",display:"flex",gap:8,marginTop:4}}><span style={{color:G,fontWeight:700,fontSize:11,flexShrink:0}}>!</span><span style={{fontSize:9,color:"#888",lineHeight:1.5}}>{info.nota}</span></div>}
            </div>
          </div>
        )}
        <button onClick={()=>setOpen(o=>!o)} style={{width:40,height:40,borderRadius:"50%",background:open?G:DK,color:"#fff",border:"none",cursor:"pointer",fontSize:16,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.25)",transition:"background 0.15s"}}>
          {open?"×":"?"}
        </button>
      </div>
    </>
  );
}

// ── LOGO ──────────────────────────────────────────────────────────────
const CIcon = ({size=26,c="#fff"}) => (
  <svg width={size} height={size} viewBox="0 0 810 810" style={{flexShrink:0}} xmlns="http://www.w3.org/2000/svg">
    <path fill={c} fillRule="evenodd" clipRule="evenodd" d="M423.539,132.601c-0.102,2.083 -0.257,2.065 -2.643,4.444c-4.497,4.427 -12.817,12.818 -13.927,13.937c-0.31,0.31 -3.812,3.821 -3.872,3.88c-4.328,4.315 -4.278,4.267 -4.65,4.637c-1.12,1.109 -7.63,7.559 -13.932,13.931c-0.371,0.372 -0.359,0.358 -4.638,4.649c-0.31,0.31 -3.177,3.184 -3.878,3.875c-1.119,1.11 -10.287,10.213 -13.939,13.923c-2.351,2.355 -2.318,2.321 -4.636,4.652c-0.54,0.549 -3.564,3.568 -3.875,3.878c-3.433,3.42 -3.416,3.403 -4.652,4.635c-4.769,4.701 -12.816,12.818 -13.926,13.937c-3.592,3.596 -3.562,3.571 -3.874,3.879c-0.372,0.371 -2.893,2.89 -4.649,4.638c-1.122,1.108 -6.905,6.819 -13.933,13.93c-1.043,1.047 -4.266,4.279 -4.637,4.65c-0.31,0.31 -3.167,3.172 -3.878,3.875c-1.119,1.11 -10.389,10.313 -13.94,13.923c-2.323,2.326 -2.286,2.291 -4.635,4.652c-0.562,0.57 -3.565,3.568 -3.876,3.878c-2.337,2.326 -2.304,2.292 -4.651,4.636c-4.869,4.801 -12.816,12.817 -13.926,13.936c-3.594,3.598 -3.562,3.571 -3.874,3.879c-0.372,0.371 -3.147,3.144 -4.649,4.637c-1.121,1.108 -7.254,7.175 -13.933,13.931c-0.371,0.372 -0.365,0.364 -4.639,4.65c-0.309,0.311 -2.579,2.595 -3.876,3.874c-0.312,0.31 -0.679,0.675 -3.687,4.07c-2.337,1.705 -18.167,18.154 -30.402,35.5c-13.362,18.944 -15.902,26.641 -18.216,30.389c-0.67,1.085 -8.835,20.802 -9.665,27.75c-0.488,1.533 -0.57,1.456 -0.826,3.081c-1.095,5.973 -1.223,5.883 -1.827,10.98c-0.492,3.903 -0.583,3.856 -0.437,7.816c-0.971,2.913 -0.677,5.7 -0.483,11.494c0.086,0.78 0.171,1.559 0.257,2.339c0.034,0.554 0.217,3.571 0.662,6.907c0.266,2.527 0.031,4.078 3.377,17.171c0.191,0.61 5.681,24.712 29.327,53.823c0.238,0.293 0.237,0.257 2.004,1.8c0.948,1.698 0.997,1.63 4.573,5.49c1.235,1.84 15.029,16.491 18.702,18.454c3.341,3.192 3.179,3.278 3.511,3.495c25.336,22.574 51.031,30.857 55.956,32.445c8.635,2.224 8.58,2.18 9.319,2.396l0.85,0.282l2.23,0.404c2.91,0.596 2.889,0.455 6.169,0.769c1.517,0.434 1.505,0.437 1.638,0.469c0.802,0.196 0.753,0.078 1.512,0.263l1.505,0.076c9.893,1.008 12.616,0.669 20.184,0.325c0.508,-0.163 1.015,-0.326 1.523,-0.489c1.057,0.032 2.113,0.064 3.17,0.096l0.752,-0.094c14.814,-1.435 32.206,-8.152 34.9,-9.193c1.503,-0.644 10.374,-4.447 18.438,-8.832c1.948,-1.059 8.587,-5.093 8.678,-5.163c0.365,-0.257 2.553,-1.793 4.627,-3.119c14.895,-9.522 29.325,-22.393 31.191,-24.543c2.217,-1.295 5.861,-5.556 8.48,-7.806l0.458,-0.334c0.375,-0.368 4.27,-4.186 4.724,-4.566c4.308,-4.233 4.309,-4.164 8.506,-8.526c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.387,-2.313 2.283,-2.309 4.635,-4.655c1.995,-1.917 1.941,-1.864 3.872,-3.87c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.383,-2.292 2.304,-2.279 4.657,-4.633c3.939,-3.81 3.9,-3.783 7.746,-7.739c2.365,-2.363 2.352,-2.287 4.631,-4.659c0.258,-0.258 0.515,-0.517 0.773,-0.775c1.999,-1.927 1.944,-1.874 3.868,-3.874c2.33,-2.33 2.338,-2.24 4.654,-4.636c0.258,-0.258 0.516,-0.516 0.774,-0.774c4.446,-4.273 8.025,-7.847 12.384,-12.39c0.258,-0.258 0.516,-0.516 0.774,-0.774c2.363,-2.281 2.276,-2.289 4.639,-4.652c2.011,-1.935 1.958,-1.878 3.874,-3.868c0.258,-0.258 0.516,-0.516 0.775,-0.773c1.988,-1.908 1.944,-1.866 3.889,-3.853c4.318,-4.25 4.314,-4.172 8.504,-8.528c0.258,-0.258 0.516,-0.516 0.774,-0.773c2.383,-2.309 2.281,-2.306 4.634,-4.656c2.005,-1.925 1.952,-1.873 3.872,-3.87c0.433,-0.434 0.425,-0.41 5.431,-5.407c3.949,-3.813 3.907,-3.786 7.746,-7.738c0.808,-0.807 0.782,-0.722 1.559,-1.537c1.026,-1.076 3.537,-3.586 3.847,-3.895c2.416,-2.328 2.305,-2.315 4.64,-4.65c2.032,-1.953 1.973,-1.888 3.88,-3.862c0.258,-0.258 0.516,-0.516 0.774,-0.774c4.918,-4.724 8.351,-8.192 12.385,-12.388c0.258,-0.258 0.516,-0.516 0.774,-0.774c1.994,-1.925 1.934,-1.869 3.864,-3.878c0.434,-0.433 0.406,-0.4 5.423,-5.415c1.992,-1.908 1.953,-1.873 3.888,-3.854c4.304,-4.235 4.306,-4.147 8.506,-8.526c0.258,-0.258 0.516,-0.516 0.774,-0.773c2.404,-2.323 2.311,-2.331 4.634,-4.656c2.024,-1.943 1.973,-1.888 3.873,-3.869c0.434,-0.433 0.416,-0.4 5.43,-5.408c3.946,-3.796 3.879,-3.749 7.747,-7.737c4.996,-5.01 4.97,-5.001 5.403,-5.435c2.371,-2.282 2.286,-2.294 4.642,-4.648c2.013,-1.926 1.96,-1.871 3.878,-3.864c0.258,-0.258 0.516,-0.516 0.774,-0.774c0.808,-0.773 0.784,-0.72 1.57,-1.527c2.543,-2.613 0.56,-3.173 -6.883,-10.983c-0.252,-0.262 -0.504,-0.524 -0.756,-0.786c-1.516,-1.603 -1.529,-1.517 -3.069,-3.133c-7.378,-7.448 -18.565,-19.814 -21.732,-21.573c-1.573,-0.873 -0.394,-2.029 -15.316,-16.464c-3.597,-3.48 -3.127,-3.935 -7.274,-6.676c-0.875,-0.705 -0.671,-0.823 -1.575,-1.508c-2.474,-3.551 -1.842,-3.909 -1.51,-3.985c0.183,-0.042 0.174,0.002 2.343,0.023c70.146,0.065 134.613,-0.065 146.318,-0.089c71.278,-0.003 71.2,-0.161 74.329,0.087c1.193,0.987 1.02,1.29 1.018,34.862c-0.007,188.966 0.022,188.966 0.054,189.716c0.03,0.704 -0.245,0.576 -0.508,1.193c-0.337,-0.009 -0.673,-0.017 -1.01,-0.026c-0.09,-0.121 -57.54,-57.872 -58.474,-58.345c-0.497,-0.252 -1.036,-0.524 -5.281,4.546c-1.846,1.26 -1.715,1.31 -3.149,3.054c-2.286,1.671 -2.304,1.606 -3.825,3.92c-0.698,0.843 -0.814,0.642 -1.533,1.552c-1.844,1.308 -1.809,1.302 -3.073,3.136c-0.729,0.844 -0.818,0.662 -1.535,1.543c-1.846,1.318 -1.806,1.299 -3.099,3.115c-0.818,0.82 -0.767,0.768 -1.539,1.536c-1.854,1.317 -1.828,1.283 -3.122,3.092c-0.718,0.827 -0.828,0.652 -1.544,1.535c-1.849,1.251 -1.85,1.219 -3.145,3.062c-0.71,0.851 -0.842,0.633 -1.559,1.531c-1.877,1.193 -1.858,1.177 -3.12,3.076c-0.249,0.266 -0.498,0.531 -0.747,0.797c-1.852,1.292 -1.826,1.295 -3.059,3.146c-0.712,0.834 -0.831,0.661 -1.538,1.543c-1.822,1.3 -1.788,1.276 -3.091,3.121c-0.74,0.839 -0.841,0.669 -1.563,1.511c-1.98,1.097 -1.929,1.104 -3.136,3.073c-1.765,1.098 -1.675,1.202 -1.836,1.281c-1.85,2.073 -1.939,1.917 -3.753,3.981c-2.068,1.416 -1.871,1.546 -3.716,3.236c-0.123,0.124 -0.771,0.777 -1.551,1.546c-1.763,1.921 -19.239,19.222 -20.92,20.886c-1.829,1.849 -4.99,4.982 -5.425,5.413c-0.258,0.258 -0.516,0.517 -0.773,0.775c-0.818,0.826 -8.243,8.098 -13.94,13.93c-0.428,0.439 -0.438,0.407 -5.414,5.424c-0.258,0.258 -0.516,0.516 -0.775,0.774c-0.125,0.123 -0.781,0.767 -1.563,1.533c-10.511,10.416 -10.452,10.354 -20.927,20.878c-0.259,0.257 -0.517,0.514 -0.776,0.772c-0.26,0.256 -0.52,0.513 -0.781,0.769c-17.518,17.446 -17.525,17.401 -24.794,24.753c-13.623,13.778 -63.857,63.361 -65.725,65.884c-0.547,0.523 -1.184,0.958 -1.293,1.033c-3.54,2.419 -8.293,7.485 -12.702,11.281c-2.486,2.106 -20.877,17.687 -31.978,25.224c-50.194,34.078 -75.803,38.088 -92.639,42.872c-2.907,0.64 -2.872,0.651 -3.124,0.696c-0.37,0.065 -3.324,0.587 -4.613,0.855c-0.786,0.187 -1.572,0.375 -2.358,0.562c-8.914,1.403 -8.887,1.245 -17.829,2.27c-2.304,0.219 -2.258,0.16 -4.566,0.373c-1.031,0.007 -2.063,0.013 -3.094,0.02c-3.753,0.76 -13.508,0.772 -17.793,0.143c-2.76,-0.145 -2.702,-0.262 -5.439,-0.141c-1.544,-0.103 -3.088,-0.206 -4.631,-0.308c-1.815,-0.071 -1.808,-0.395 -4.686,0.179c-2.923,-1.266 -2.975,-0.671 -7.72,-0.715c-0.519,-0.191 -1.038,-0.382 -1.557,-0.573c-9.291,-0.825 -9.254,-0.852 -11.601,-0.991l-0.743,-0.223c-0.532,-0.107 -1.064,-0.213 -1.597,-0.32c-4.333,-0.542 -4.305,-0.543 -4.68,-0.585c-0.432,-0.048 -0.36,0.027 -0.808,-0.023c-3.747,-0.424 -7.724,-1.177 -8.391,-1.303l-0.723,-0.114c-1.847,-0.353 -3.693,-0.705 -5.54,-1.058c-3.948,-0.661 -3.895,-0.652 -7.774,-1.418l-2.977,-0.552c-11.31,-2.53 -11.24,-2.601 -22.477,-5.336c-44.549,-13.523 -63.646,-23.026 -96.651,-45.736c-2.586,-1.472 -3.726,-3.155 -6.921,-4.798c-1.525,-1.654 -3.577,-3.312 -7.614,-6.212c-4.289,-3.838 -4.396,-3.62 -8.63,-7.609c-10.761,-10.136 -10.519,-10.27 -21.198,-20.573c-0.071,-0.116 -0.889,-1.451 -0.889,-1.451c-7.302,-9.394 -9.591,-7.633 -32.755,-43.71c-0.318,-0.318 -0.269,-0.3 -1.075,-1.4c-1.878,-4.139 -2.157,-3.937 -4.4,-7.872c-31.923,-55.935 -38.986,-121.21 -39.03,-121.389c-0.04,-2.386 -0.041,-2.331 -0.45,-4.689c-0.323,-3.102 -0.249,-3.06 -0.854,-6.125l-0.07,-1.614c-0.101,-1.922 -0.025,-1.863 -0.321,-3.83c-0.173,-3.582 -0.166,-3.559 -0.187,-3.869c-0.161,-2.373 -0.28,-2.311 -0.438,-4.651l-0.937,-0.878c1.603,-5.743 0.078,-9.559 -0.051,-10.743c0.31,-2.33 0.242,-2.295 0.195,-4.635c-0.049,-6.999 -0.039,-6.944 0.003,-13.944c-0.064,-1.029 -0.128,-2.058 -0.191,-3.086c0.194,-1.283 0.389,-2.565 0.583,-3.848c-0.008,-4.347 0.078,-4.283 0.068,-4.655c0.166,-0.605 0.453,-1.656 1.217,-7.751c1.345,-11.388 1.773,-11.277 1.855,-12.267c0.592,-2.232 0.599,-2.216 0.64,-2.411c5.152,-24.46 8.729,-30.656 16.998,-51.077c1.263,-2.078 2.624,-5.161 4.737,-9.219c1.295,-2.494 5.41,-11.093 17.816,-30.109c2.173,-2.738 5.331,-7.493 5.471,-7.699c9.306,-13.681 22.103,-27.611 23.705,-30.37c5.229,-5.219 5.579,-5.855 5.918,-6.469c1.569,-2.843 6.4,-5.144 9.486,-10.655c6.084,-4.865 215.356,-215.496 216.741,-216.062c0.462,-0.189 1.223,-0.5 5.172,3.486c3.02,3.048 28.649,28.919 37.782,38.07c4.796,4.805 58.259,58.372 60.119,59.895Z"/>
  </svg>
);

const Wordmark = ({color="#fff", height=36}) => (
  <svg height={height} viewBox="0 0 2383.94 1683.78" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
    <g fill={color}>
      <path d="M978.95,539.28v270.7c0,59.04-15.55,103.11-46.65,132.23c-31.1,29.12-77.95,43.68-140.55,43.68c-63.59,0-110.94-14.56-142.03-43.68c-31.11-29.12-46.65-73.2-46.65-132.23v-270.7h92.41v256.14c0,35.85,7.92,62.85,23.77,80.97c15.85,18.13,39.52,27.19,71.02,27.19c31.69,0,55.66-9.11,71.91-27.34c16.24-18.22,24.36-45.17,24.36-80.82V539.28H978.95z"/>
      <path d="M520.89,985.89H320.91c-59.04,0-97.3-26.25-126.42-58.28S145,821.15,145,756.69c0-65.48,24.39-128.41,53.51-160.43c29.12-32.03,63.36-56.98,122.4-56.98h199.98v95.16H335.47c-35.85,0-61.21,14.28-75.29,31.54c-15.49,18.98-26.53,55.32-28.82,87.67c-2.23,31.52,14.08,86.98,28.82,107c14.75,20.02,41.39,25.21,75.29,30.07h185.42V985.89z"/>
      <path d="M1389.9,974.3h-107.27l-114.4-203.25V974.3h-93V539.28h133.13c52.89,0,92.51,10.26,118.85,30.76s39.52,51.36,39.52,92.56c0,29.92-9.01,55.47-27.03,76.67c-18.03,21.2-41.3,33.58-69.83,37.14L1389.9,974.3z M1168.23,724.7h13.97c37.64,0,62.5-4.11,74.58-12.33s18.13-22.53,18.13-42.94c0-21.39-6.49-36.59-19.47-45.61c-12.97-9.01-37.39-13.52-73.25-13.52h-13.97V724.7z"/>
      <path d="M1554.23,974.3l-160.76-435.03h102.81l84.69,271.3c1.58,5.55,4.06,15.85,7.43,30.91c3.36,15.06,6.93,32.19,10.7,51.4c2.57-18.61,5.39-35.16,8.47-49.62c3.07-14.46,6.09-26.34,9.07-35.65l85.87-268.33h101.62L1642.19,974.3H1554.23z"/>
      <path d="M1788.68,974.3l165.51-435.03h106.38l167.89,435.03h-105.78l-35.36-92.41h-168.48l-30.31,92.41H1788.68z M2065.62,808.79l-48.73-140.55c-1.39-4.16-3.17-11.29-5.35-21.39c-2.18-10.1-4.46-22.48-6.84-37.14c-2.57,14.07-5.05,26.7-7.43,37.88c-2.37,11.19-4.16,18.68-5.35,22.43l-46.95,138.77H2065.62z"/>
      <polygon points="574.73,938.31 489.38,858.02 489.38,1018.59"/>
      <polygon points="932.27,486.16 851.98,571.51 1012.56,571.51"/>
      <text x="144.998" y="1167.84" fontFamily="'Futura BT','Futura','Century Gothic',sans-serif" fontSize="118" letterSpacing="2">REALIDAD Y VISIÓN ARQUITECTONICA</text>
    </g>
  </svg>
);
const Brand = ({dark,sm}) => (
  <div style={{display:"flex",alignItems:"center",gap:sm?6:10}}>
    <CIcon size={sm?22:30} c={dark?DK:"#fff"}/>
    <Wordmark color={dark?DK:"#fff"} height={sm?28:38}/>
  </div>
);

const DocHeader = ({title,cl,pr,fe}) => (
  <div style={{borderBottom:"2px solid "+G,paddingBottom:13,marginBottom:18}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
      <div><Brand dark/><div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>{title}</div></div>
      <div style={{textAlign:"right",fontSize:11,color:"#555",lineHeight:1.6}}><b>{cl||"—"}</b><br/>{pr||"—"}<br/><span style={{color:"#888",fontSize:10}}>{fDate(fe)}</span></div>
    </div>
  </div>
);

// ══ CALCULADORA ═══════════════════════════════════════════════════════
const TAR={"Vivienda":{Levantamiento:8,Anteproyecto:35,"Proyecto arquitectónico":55,"Expediente técnico":78,Supervisión:12},"Comercial":{Levantamiento:10,Anteproyecto:38,"Proyecto arquitectónico":60,"Expediente técnico":85,Supervisión:14},"Oficina":{Levantamiento:9,Anteproyecto:36,"Proyecto arquitectónico":58,"Expediente técnico":82,Supervisión:13},"Remodelación":{Levantamiento:12,Anteproyecto:42,"Proyecto arquitectónico":68,"Expediente técnico":95,Supervisión:16},"Interiorismo":{Levantamiento:11,Anteproyecto:40,"Proyecto arquitectónico":65,"Expediente técnico":90,Supervisión:15},"Industrial pequeño":{Levantamiento:8,Anteproyecto:30,"Proyecto arquitectónico":48,"Expediente técnico":70,Supervisión:12}};
const CF={"Baja":0.9,"Media":1,"Alta":1.15,"Muy alta":1.3};
const UF={"Normal":1,"Rápido":1.1,"Urgente":1.2};
const KF={"Particular":1,"Empresa":1.08,"Institucional":1.15};
const MF={"Suma alzada":1,"Precios unitarios":1.05,"Cost + Fee":0.95,"Gestión de obra":0.9,"Diseño + Build":1.12};

function ToolCalc({toolId, onPrint}) {
  const today=new Date().toISOString().split("T")[0];
  const [step,ss]=useState(1);
  const [cl,scl]=useState(""); const [pr,spr]=useState(""); const [fe,sfe]=useState(today);
  const [ti,sti]=useState("Vivienda"); const [et,set_]=useState("Anteproyecto");
  const [ar,sar]=useState(""); const [mo,smo]=useState("Suma alzada"); const [ig,sig]=useState(true);
  const [co,sco]=useState("Media"); const [ur,sur]=useState("Normal"); const [tc,stc]=useState("Particular");
  const [mg,smg]=useState(0); const [dc,sdc]=useState(0); const [rd,srd]=useState(50);
  const [rx,srx]=useState(0); const [vx,svx]=useState(0); const [nx,snx]=useState(0);

  const c=useMemo(()=>{
    const a=+ar||0,t=(TAR[ti]||{})[et]||0,b=t*a;
    const adj=b*(CF[co]||1)*(UF[ur]||1)*(KF[tc]||1)*(MF[mo]||1)*(1+(+mg||0)/100)*(1-(+dc||0)/100);
    const ext=(+rx||0)*240+(+vx||0)*180+(+nx||0)*250;
    const sub=adj+ext,igv=ig?sub*.18:0,tot=rnd(sub+igv,+rd||0);
    return {t,b,adj,ext,sub,igv,tot,rMin:Math.round(tot*.92),rMax:Math.round(tot*1.08),
      hitos:[{n:"Adelanto",p:.5},{n:"Mitad",p:.25},{n:"Entrega",p:.25}].map(h=>({...h,m:rnd(tot*h.p,10)}))};
  },[ti,et,ar,co,ur,tc,mo,mg,dc,rd,ig,rx,vx,nx]);

  const ST=["Datos del proyecto","Factores y extras","Resultado"];
  return (
    <div>
      <div style={{display:"flex",gap:20,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E2D8"}}>
        {ST.map((s,i)=>{const n=i+1,d=step>n,a=step===n;return(
          <div key={i} onClick={()=>d&&ss(n)} style={{display:"flex",alignItems:"center",gap:5,color:a?DK:d?G:"#CCC",fontSize:11,fontWeight:a||d?700:400,cursor:d?"pointer":"default"}}>
            <span style={{width:16,height:16,borderRadius:"50%",background:d?G:a?DK:"#DDD",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{d?"✓":n}</span>{s}
          </div>
        );})}
      </div>

      {step===1&&(
        <div style={cardS}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
            <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
            <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
            <Fld label="Área (m²)"><Inp type="number" value={ar} onChange={sar} placeholder="Ej. 1600" min="0"/></Fld>
            <Fld label="Tipo de proyecto"><Sel value={ti} onChange={v=>{sti(v);const ks=Object.keys(TAR[v]||{});if(!ks.includes(et))set_(ks[0]||"");}} options={Object.keys(TAR)}/></Fld>
            <Fld label="Etapa / servicio"><Sel value={et} onChange={set_} options={Object.keys(TAR[ti]||{})}/></Fld>
            <Fld label="Modelo de contratación"><Sel value={mo} onChange={smo} options={Object.keys(MF)}/></Fld>
            <Fld label="IGV (18%)">
              <div style={{display:"flex",gap:6}}>
                {["Sí","No"].map(o=><button key={o} onClick={()=>sig(o==="Sí")} style={{...si,width:"auto",padding:"7px 16px",background:(o==="Sí")===ig?DK:"#FDFCF9",color:(o==="Sí")===ig?"#fff":DK,cursor:"pointer",fontWeight:600}}>{o}</button>)}
              </div>
            </Fld>
          </div>
          {+ar>0&&<div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",gap:24,marginTop:4}}>
            <div><div style={lb}>Tarifa base</div><div style={{fontWeight:800,fontSize:17,color:G}}>S/ {c.t}/m²</div></div>
            <div><div style={lb}>Honorario base</div><div style={{fontWeight:700,fontSize:17}}>{fmt(c.b)}</div></div>
          </div>}
          <div style={{textAlign:"right",marginTop:14}}><Btn onClick={()=>ss(2)}>Siguiente →</Btn></div>
        </div>
      )}

      {step===2&&(
        <div style={cardS}>
          <p style={{...lb,color:G,margin:"0 0 10px"}}>Factores de ajuste</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Complejidad"><Sel value={co} onChange={sco} options={Object.keys(CF)}/></Fld>
            <Fld label="Urgencia"><Sel value={ur} onChange={sur} options={Object.keys(UF)}/></Fld>
            <Fld label="Tipo de cliente"><Sel value={tc} onChange={stc} options={Object.keys(KF)}/></Fld>
            <Fld label="Margen adicional (%)"><Inp type="number" value={mg} onChange={smg} min="0"/></Fld>
            <Fld label="Descuento (%)"><Inp type="number" value={dc} onChange={sdc} min="0"/></Fld>
            <Fld label="Redondeo (S/)"><Inp type="number" value={rd} onChange={srd} min="0"/></Fld>
          </div>
          <p style={{...lb,color:G,margin:"10px 0"}}>Adicionales</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
            <Fld label="Reuniones extra (S/ 240 c/u)"><Inp type="number" value={rx} onChange={srx} min="0"/></Fld>
            <Fld label="Visitas extra (S/ 180 c/u)"><Inp type="number" value={vx} onChange={svx} min="0"/></Fld>
            <Fld label="Renders extra (S/ 250 c/u)"><Inp type="number" value={nx} onChange={snx} min="0"/></Fld>
          </div>
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"9px 12px",display:"flex",flexWrap:"wrap",gap:"8px 20px",alignItems:"center"}}>
            <div><div style={lb}>Ajustado</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.adj)}</div></div>
            {c.ext>0&&<div><div style={lb}>Extras</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.ext)}</div></div>}
            {ig&&<div><div style={lb}>IGV</div><div style={{fontWeight:600,fontSize:12}}>{fmt(c.igv)}</div></div>}
            <div style={{marginLeft:"auto"}}><div style={lb}>Total estimado</div><div style={{fontWeight:800,fontSize:20,color:G}}>{fmt(c.tot)}</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <Btn v="ol" onClick={()=>ss(1)}>← Anterior</Btn>
            <Btn onClick={()=>ss(3)}>Ver resultado →</Btn>
          </div>
        </div>
      )}

      {/* Doc section — always in DOM for PDF export, visible only on step 3 */}
      <div style={{display: step===3 ? 'block' : 'none'}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <Btn v="ol" onClick={()=>ss(2)}>← Editar</Btn>
          <Btn v="gd" onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <div data-doc-id={toolId} style={{...cardS,padding:28}}>
          <DocHeader title="Resumen de Honorarios Profesionales" cl={cl} pr={pr} fe={fe}/>
          <div style={{textAlign:"right",marginBottom:14}}>
            <div style={{fontSize:26,fontWeight:800,color:G}}>{fmt(c.tot)}</div>
            <div style={{color:"#888",fontSize:9}}>Total {ig?"con IGV":"sin IGV"}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px",marginBottom:14}}>
            {[["Cliente",cl||"—"],["Total",fmt(c.tot)],["Proyecto",pr||"—"],["Tarifa",`S/ ${c.t}/m²`],["Fecha",fDate(fe)],["Complejidad",co],["Tipo",ti],["Urgencia",ur],["Etapa",et],["Cliente tipo",tc],["Modelo",mo],["Área",`${ar||0} m²`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
                <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{...lb,color:G,marginBottom:8}}>Desglose</p>
          <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
            <tbody>
              {[["Honorario base",c.b,`${ar||0} m² × S/ ${c.t}/m²`],["Ajustes",c.adj-c.b,"Complejidad, urgencia, cliente, modelo"],
                ...(c.ext>0?[["Adicionales",c.ext,"Reuniones, visitas, renders"]]:[]),
                ["Subtotal",c.sub,""],
                ...(ig?[["IGV (18%)",c.igv,""]]:[])
              ].map(([k,v,n],i)=>(
                <tr key={i} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:k==="Subtotal"?700:400}}>{k}</td>
                  <td style={{padding:"7px 8px",fontSize:10,fontWeight:700,textAlign:"right"}}>{fmt(v)}</td>
                  <td style={{padding:"7px 8px",fontSize:9,color:"#AAA"}}>{n}</td>
                </tr>
              ))}
              <tr style={{background:DK,color:"#fff"}}>
                <td style={{padding:"9px 8px",fontWeight:700,fontSize:11}}>TOTAL</td>
                <td style={{padding:"9px 8px",fontWeight:800,fontSize:15,textAlign:"right",color:G}}>{fmt(c.tot)}</td>
                <td style={{padding:"9px 8px",fontSize:9,color:"#666"}}>Redond. a S/ {rd}</td>
              </tr>
            </tbody>
          </table>
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"8px 11px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
            <span style={{...lb,margin:0,whiteSpace:"nowrap"}}>Rango ±8%</span>
            <span style={{fontWeight:700,fontSize:12}}>{fmt(c.rMin)} — {fmt(c.rMax)}</span>
          </div>
          <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {c.hitos.map(h=>(
              <div key={h.n} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:10,textAlign:"center"}}>
                <div style={{...lb,margin:"0 0 4px"}}>{h.n}</div>
                <div style={{fontWeight:800,fontSize:14}}>{fmt(h.m)}</div>
                <div style={{color:G,fontSize:9,marginTop:3,fontWeight:600}}>{(h.p*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7}}>
            Resumen referencial. Validar alcance, entregables, exclusiones, cronograma y condiciones antes de enviarlo al cliente.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ MATRIZ ════════════════════════════════════════════════════════════
const PAQUETES=["Diagnóstico / consultoría","Anteproyecto","Proyecto arquitectónico","Expediente técnico","Supervisión de obra","Diseño + ejecución"];
const ETAPAS_MX=["Levantamiento","Anteproyecto","Desarrollo","Expediente","Obra"];
const ITEMS_BASE=[
  {id:"ITM-001",paquete:"Diagnóstico / consultoría",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-002",paquete:"Proyecto arquitectónico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-003",paquete:"Anteproyecto",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-004",paquete:"Expediente técnico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-005",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Diagnóstico + recomendaciones de intervención y próximos pasos.",formato:"PDF",cantidad:"1",notas:"Análisis del estado actual con conclusiones técnicas y recomendaciones de alcance."},
  {id:"ITM-006",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Propuesta de layout / distribución preliminar.",formato:"PDF",cantidad:"1",notas:"Planteamiento espacial inicial para validar el programa y la organización funcional."},
  {id:"ITM-007",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Moodboard + criterios de materialidad referencial.",formato:"PDF",cantidad:"1",notas:"Referencias visuales de estilo, atmósfera y materialidad para alinear la identidad del proyecto."},
  {id:"ITM-008",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Plantas preliminares + cortes/elevaciones base.",formato:"PDF",cantidad:"1 paquete",notas:"Juego de planos a nivel de anteproyecto para comunicar la propuesta arquitectónica al cliente."},
  {id:"ITM-009",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Vistas 3D / renders base (según alcance).",formato:"JPG/PDF",cantidad:"3–5",notas:"Imágenes de representación para apoyar la comunicación de la propuesta."},
  {id:"ITM-010",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Plantas, cortes y elevaciones desarrolladas.",formato:"PDF",cantidad:"1 paquete",notas:"Documentación gráfica completa que define geometría, cotas y relaciones espaciales."},
  {id:"ITM-011",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Detalles arquitectónicos críticos (según proyecto).",formato:"PDF",cantidad:"8–15",notas:"Soluciones constructivas en escala ampliada para los encuentros, carpinterías y elementos singulares."},
  {id:"ITM-012",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Cuadro de acabados / criterios base (si aplica).",formato:"PDF",cantidad:"1",notas:"Especificación referencial de materiales y acabados por ambiente."},
  {id:"ITM-013",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Acta de decisiones / acuerdos de revisión.",formato:"PDF",cantidad:"1",notas:"Registro formal de los acuerdos tomados en cada revisión."},
  {id:"ITM-014",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Planos arquitectónicos para obra (set).",formato:"PDF",cantidad:"1 set",notas:"Set completo de planos constructivos para la ejecución de obra."},
  {id:"ITM-015",paquete:"Anteproyecto",etapa:"Expediente",entregable:"Memoria descriptiva arquitectónica.",formato:"PDF",cantidad:"1",notas:"Documento técnico que describe el partido, criterios de diseño y características generales."},
  {id:"ITM-016",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Lista de pendientes y criterios para coordinación.",formato:"PDF",cantidad:"1",notas:"Documento de interfaz con especialidades. Instalaciones no incluidas salvo acuerdo expreso."},
  {id:"ITM-017",paquete:"Supervisión de obra",etapa:"Obra",entregable:"Visitas programadas + informe por visita.",formato:"PDF",cantidad:"4–8",notas:"Inspección periódica para verificar fidelidad al proyecto."},
  {id:"ITM-018",paquete:"Anteproyecto",etapa:"Obra",entregable:"Absolución de consultas y revisiones puntuales.",formato:"Email/PDF",cantidad:"Según obra",notas:"Respuesta a consultas del contratista sobre interpretación de planos."},
  {id:"ITM-019",paquete:"Anteproyecto",etapa:"Obra",entregable:"Registro de cambios y adicionales (si aplica).",formato:"PDF",cantidad:"1",notas:"Documento que formaliza las modificaciones aprobadas al proyecto original."},
  {id:"ITM-020",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Cronograma base + control de hitos.",formato:"PDF",cantidad:"1",notas:"Programa de obra con hitos de entrega y pagos vinculados."},
  {id:"ITM-021",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Acta de cierre y entrega final.",formato:"PDF",cantidad:"1",notas:"Documento que formaliza la entrega del proyecto terminado."},
];

const etapaColor={"Levantamiento":"#E8F0FB","Anteproyecto":"#EBF6EE","Desarrollo":"#FEF9E7","Expediente":"#FDF0E8","Obra":"#F5EEF8"};
const etapaTextColor={"Levantamiento":"#2471A3","Anteproyecto":"#1E8449","Desarrollo":"#B7950B","Expediente":"#BA4A00","Obra":"#6C3483"};

function ToolMatrix({toolId, onPrint}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useState(""); const [pr,spr]=useState(""); const [ub,sub]=useState(""); const [fe,sfe]=useState(today);
  const [paq,spaq]=useState("Anteproyecto");
  const [items,setItems]=useState(()=>ITEMS_BASE.map(it=>({...it,on:true})));
  const [newEnt,setNewEnt]=useState("__custom__"); const [newCustom,setNewCustom]=useState("");
  const [newEtapa,setNewEtapa]=useState("Levantamiento"); const [newFmt,setNewFmt]=useState("PDF");
  const [newCant,setNewCant]=useState("1"); const [showAdd,setShowAdd]=useState(false);

  const otherItems=ITEMS_BASE.filter(it=>it.paquete!==paq);
  const uniqueOthers=otherItems.filter((it,i,arr)=>arr.findIndex(x=>x.entregable===it.entregable)===i);
  const filtered=items.filter(it=>it.paquete===paq);
  const byEtapa=ETAPAS_MX.reduce((acc,e)=>{const its=filtered.filter(it=>it.etapa===e);if(its.length)acc[e]=its;return acc;},{});
  const activeItems=filtered.filter(it=>it.on);

  const togItem=id=>setItems(p=>p.map(it=>it.id===id?{...it,on:!it.on}:it));
  const delItem=id=>setItems(p=>p.filter(it=>it.id!==id));
  const handleEntSelect=v=>{setNewEnt(v);if(v!=="__custom__"){const src=ITEMS_BASE.find(it=>it.entregable===v);if(src){setNewEtapa(src.etapa);setNewFmt(src.formato);setNewCant(src.cantidad);}}};
  const addItem=()=>{
    const entregable=newEnt==="__custom__"?newCustom:newEnt;
    if(!entregable.trim()) return;
    const src=ITEMS_BASE.find(it=>it.entregable===entregable);
    const id="ITM-"+String(items.length+1).padStart(3,"0")+"-c";
    setItems(p=>[...p,{id,paquete:paq,etapa:newEtapa,entregable,formato:src?src.formato:newFmt,cantidad:src?src.cantidad:newCant,notas:src?src.notas:"",on:true}]);
    setNewEnt("__custom__"); setNewCustom(""); setShowAdd(false);
  };

  return (
    <div>
      <div style={cardS}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px",marginBottom:12}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Proyecto"/></Fld>
          <Fld label="Ubicación"><Inp value={ub} onChange={sub} placeholder="Ciudad / dirección"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
        </div>
        <label style={lb}>Paquete de servicio</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PAQUETES.map(p=><button key={p} onClick={()=>spaq(p)} style={{padding:"5px 12px",borderRadius:4,border:"1px solid "+(paq===p?G:"#DDD"),background:paq===p?G:"#fff",color:paq===p?"#fff":DK,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{p}</button>)}
        </div>
      </div>

      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Entregables — clic en ✓/○ para incluir o excluir</p>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={()=>setShowAdd(s=>!s)}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
            <Fld label="Entregable">
              <select value={newEnt} onChange={e=>handleEntSelect(e.target.value)} style={si}>
                <option value="__custom__">— Entregable personalizado —</option>
                {uniqueOthers.length>0&&<optgroup label="Entregables de otros paquetes">{uniqueOthers.map(it=><option key={it.id} value={it.entregable}>{it.entregable}</option>)}</optgroup>}
              </select>
              {newEnt==="__custom__"&&<input value={newCustom} onChange={e=>setNewCustom(e.target.value)} placeholder="Escribe el entregable..." style={{...si,marginTop:5}}/>}
            </Fld>
            <Fld label="Etapa"><Sel value={newEtapa} onChange={setNewEtapa} options={ETAPAS_MX}/></Fld>
            <Fld label="Formato"><Inp value={newFmt} onChange={setNewFmt} placeholder="PDF"/></Fld>
            <Fld label="Cantidad"><Inp value={newCant} onChange={setNewCant} placeholder="1"/></Fld>
            <div style={{paddingBottom:12,display:"flex",gap:6}}>
              <Btn v="gd" sm onClick={addItem}>Agregar</Btn>
              <Btn v="ol" sm onClick={()=>setShowAdd(false)}>×</Btn>
            </div>
          </div>
        )}
        {Object.entries(byEtapa).map(([etapa,its])=>(
          <div key={etapa} style={{marginBottom:16}}>
            <div style={{background:etapaColor[etapa]||"#F0EDE8",borderRadius:"4px 4px 0 0",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:"1px",color:etapaTextColor[etapa]||DK}}>{etapa}</span>
              <span style={{fontSize:10,color:"#AAA",marginLeft:"auto"}}>{its.filter(i=>i.on).length} / {its.length} incluidos</span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <thead><tr style={{background:"#F8F6F1"}}>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",width:28}}></th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Entregable</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Formato</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Cantidad</th>
                <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:200}}>Notas</th>
                <th style={{width:24}}></th>
              </tr></thead>
              <tbody>
                {its.map((it,i)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",opacity:it.on?1:0.4}}>
                    <td style={{padding:"7px 8px",textAlign:"center"}}>
                      <button onClick={()=>togItem(it.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(it.on?G:"#CCC"),background:it.on?G:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{it.on?"✓":""}</button>
                    </td>
                    <td style={{padding:"7px 8px",fontSize:11,color:it.on?DK:"#BBB"}}>{it.entregable}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.formato}</td>
                    <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.cantidad}</td>
                    <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{it.notas}</td>
                    <td style={{padding:"7px 4px",textAlign:"center"}}><button onClick={()=>delItem(it.id)} style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {Object.keys(byEtapa).length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#AAA",fontSize:12}}>No hay ítems para este paquete. Agrega uno con el botón de arriba.</div>}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Matriz de Entregables por Etapa" cl={cl} pr={pr} fe={fe}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
          {[["Paquete",paq],["Ubicación",ub||"—"],["Fecha",fDate(fe)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,color:"#AAA",marginBottom:14,fontStyle:"italic"}}>Esta matriz resume qué se entrega por etapa. Solo muestra los ítems activos para el paquete seleccionado.</p>
        {ETAPAS_MX.map(etapa=>{
          const its=activeItems.filter(it=>it.etapa===etapa);
          if(!its.length) return null;
          return (
            <div key={etapa} style={{marginBottom:16}}>
              <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"6px 12px"}}>
                <span style={{fontWeight:800,fontSize:10,textTransform:"uppercase",letterSpacing:"1.5px",color:G}}>{etapa}</span>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
                <thead><tr style={{background:"#F8F6F1"}}>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Entregable (incluye formato)</th>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:70}}>Cantidad</th>
                  <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:200}}>Notas</th>
                </tr></thead>
                <tbody>
                  {its.map((it,i)=>(
                    <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                      <td style={{padding:"7px 8px",fontSize:10}}>{it.entregable} <span style={{color:"#AAA"}}>({it.formato})</span></td>
                      <td style={{padding:"7px 8px",fontSize:10,textAlign:"center",color:"#888"}}>{it.cantidad}</td>
                      <td style={{padding:"7px 8px",fontSize:9,color:"#AAA",fontStyle:"italic"}}>{it.notas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:9,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>Los entregables específicos y sus condiciones se definen en el contrato de servicios de CURVA Arquitectos.</div>
      </div>
    </div>
  );
}

// ══ EXCLUSIONES ═══════════════════════════════════════════════════════
const ESTADOS=["Excluido","Supuesto","Revisión"];
const CATEGORIAS=["Exclusiones generales","Exclusiones específicas","Supuestos técnicos","Supuestos comerciales","Supuestos de plazo","Eventos de recotización"];
const BIBLIOTECA_BASE=[
  {cat:"Exclusiones generales",item:"Trámites y licencias",texto:"No incluye gestión municipal, licencias ni aprobación ante entidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Tasas y derechos",texto:"No incluye pagos por tasas, derechos, impuestos ni costos municipales.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Topografía / estudios previos",texto:"No incluye levantamiento topográfico, mecánica de suelos ni estudios especializados.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Especialidades",texto:"No incluye desarrollo de estructuras, sanitarias, eléctricas, HVAC u otras especialidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Mobiliario y equipamiento",texto:"No incluye mobiliario suelto, equipamiento ni compras directas.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Paisajismo / señalética / branding",texto:"No incluye diseño de paisaje, branding, señalética ni gráfica ambiental.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Renders extra / impresiones",texto:"No incluye visualizaciones adicionales ni impresiones físicas fuera de lo acordado.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Supervisión permanente / ejecución",texto:"No incluye ejecución de obra, administración integral ni presencia permanente en campo.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Intervenciones fuera del área definida",texto:"No incluye áreas no contempladas expresamente en el alcance base.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Requerimientos no informados al inicio",texto:"No incluye exigencias o partidas que no hayan sido informadas al momento de cotizar.",estado:"Excluido"},
  {cat:"Supuestos técnicos",item:"Información base entregada por el cliente",texto:"Se asume que medidas, planos y data base entregada por el cliente son suficientes y confiables.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Condiciones existentes regulares",texto:"Se asume que el inmueble no presenta contingencias ocultas no visibles al momento de la propuesta.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Acceso y levantamiento",texto:"Se asume acceso razonable al inmueble para visitas, levantamiento y validaciones.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de reuniones",texto:"Se asume un número acotado de reuniones según la cotización aprobada.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de revisiones",texto:"Se asume un máximo de rondas de cambios/revisión según lo ofertado.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Aprobaciones por etapa",texto:"Se asume que el cliente valida cada etapa antes de avanzar a la siguiente.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Cambios fuera de alcance",texto:"Todo cambio fuera del alcance aprobado se cotiza aparte.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Inicio sujeto a adelanto o aprobación",texto:"El inicio corre desde la aprobación formal y/o pago inicial.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Retroalimentación oportuna del cliente",texto:"Los plazos suponen respuestas y validaciones del cliente dentro de tiempos razonables.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Terceros y entidades externas",texto:"No se consideran demoras atribuibles a terceros, proveedores, comités o entidades.",estado:"Supuesto"},
  {cat:"Eventos de recotización",item:"Cambio de alcance",texto:"Cualquier cambio de alcance, área o nivel de detalle genera recotización.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Nuevas especialidades o visitas",texto:"Nuevas especialidades, visitas extra o reuniones extraordinarias generan adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Rediseño tras aprobación",texto:"Cambios posteriores a una aprobación de etapa se consideran trabajo adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Información base incorrecta",texto:"Errores u omisiones en la información base que alteren el servicio generan ajuste económico/plazo.",estado:"Revisión"},
];
const MOSTRAR_DEFAULT=["Trámites y licencias","Tasas y derechos","Supervisión permanente / ejecución","Intervenciones fuera del área definida","Requerimientos no informados al inicio","Condiciones existentes regulares","Número de revisiones","Aprobaciones por etapa","Cambios fuera de alcance","Inicio sujeto a adelanto o aprobación","Retroalimentación oportuna del cliente","Terceros y entidades externas","Cambio de alcance"];
const SECCION_LABEL={"Excluido":"EXCLUSIONES","Supuesto":"SUPUESTOS","Revisión":"EVENTOS QUE GENERAN RECOTIZACIÓN"};
const ESTADO_BADGE={"Excluido":{bg:"#FDEBD0",c:"#BA4A00"},"Supuesto":{bg:"#D5F5E3",c:"#1E8449"},"Revisión":{bg:"#D6EAF8",c:"#2471A3"}};

function ToolExcl({toolId, onPrint}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useState(""); const [pr,spr]=useState(""); const [cod,scod]=useState("");
  const [fe,sfe]=useState(today); const [resp,sresp]=useState("");
  const [items,setItems]=useState(()=>BIBLIOTECA_BASE.map((b,i)=>({id:"EX-"+String(i+1).padStart(3,"0"),cat:b.cat,item:b.item,estado:b.estado,mostrar:MOSTRAR_DEFAULT.includes(b.item),texto:b.texto})));
  const [showAdd,setShowAdd]=useState(false);
  const [newCat,setNewCat]=useState("Exclusiones generales");
  const [newItem,setNewItem]=useState("__biblioteca__");
  const [newCustomItem,setNewCustomItem]=useState(""); const [newCustomTexto,setNewCustomTexto]=useState(""); const [newEstado,setNewEstado]=useState("Excluido");
  const [editId,setEditId]=useState(null); const [editTexto,setEditTexto]=useState("");

  const bibFiltered=BIBLIOTECA_BASE.filter(b=>!items.find(it=>it.item===b.item));
  const tog=id=>setItems(p=>p.map(it=>it.id===id?{...it,mostrar:!it.mostrar}:it));
  const setEstado=(id,v)=>setItems(p=>p.map(it=>it.id===id?{...it,estado:v}:it));
  const del=id=>setItems(p=>p.filter(it=>it.id!==id));
  const startEdit=it=>{setEditId(it.id);setEditTexto(it.texto);};
  const saveEdit=()=>{setItems(p=>p.map(it=>it.id===editId?{...it,texto:editTexto}:it));setEditId(null);};
  const handleBibSelect=v=>{setNewItem(v);if(v!=="__biblioteca__"&&v!=="__custom__"){const src=BIBLIOTECA_BASE.find(b=>b.item===v);if(src){setNewCat(src.cat);setNewEstado(src.estado);setNewCustomTexto(src.texto);}}};
  const addItem=()=>{
    const itemName=newItem==="__custom__"?newCustomItem:newItem==="__biblioteca__"?"":newItem;
    if(!itemName.trim()) return;
    const src=BIBLIOTECA_BASE.find(b=>b.item===itemName);
    setItems(p=>[...p,{id:"EX-"+Date.now(),cat:newCat,item:itemName,estado:newEstado,mostrar:true,texto:newCustomTexto||src?.texto||""}]);
    setNewItem("__biblioteca__"); setNewCustomItem(""); setNewCustomTexto(""); setShowAdd(false);
  };

  const visible=items.filter(it=>it.mostrar);
  const byEstado=["Excluido","Supuesto","Revisión"].reduce((acc,e)=>{const its=visible.filter(it=>it.estado===e);if(its.length)acc[e]=its;return acc;},{});

  return (
    <div>
      <div style={cardS}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código"><Inp value={cod} onChange={scod} placeholder="COT-2026-001"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Responsable"><Inp value={resp} onChange={sresp} placeholder="Nombre"/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <p style={{...lb,color:G,margin:0}}>Ítems — activa "Mostrar" para incluir en la presentación</p>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ol" sm onClick={()=>setShowAdd(s=>!s)}>+ Agregar ítem</Btn>
            <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"12px 14px",marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"0 12px",marginBottom:8}}>
              <Fld label="Ítem">
                <select value={newItem} onChange={e=>handleBibSelect(e.target.value)} style={si}>
                  <option value="__biblioteca__">— Selecciona un ítem —</option>
                  {bibFiltered.length>0&&<optgroup label="Biblioteca base">{bibFiltered.map(b=><option key={b.item} value={b.item}>{b.item}</option>)}</optgroup>}
                  <option value="__custom__">✏️ Ítem personalizado...</option>
                </select>
                {newItem==="__custom__"&&<input value={newCustomItem} onChange={e=>setNewCustomItem(e.target.value)} placeholder="Nombre del ítem..." style={{...si,marginTop:5}}/>}
              </Fld>
              <Fld label="Categoría"><Sel value={newCat} onChange={setNewCat} options={CATEGORIAS}/></Fld>
              <Fld label="Estado"><Sel value={newEstado} onChange={setNewEstado} options={ESTADOS}/></Fld>
            </div>
            <Fld label="Texto para el cliente"><input value={newCustomTexto} onChange={e=>setNewCustomTexto(e.target.value)} placeholder="Redacta el texto que verá el cliente..." style={{...si,width:"100%"}}/></Fld>
            <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
              <Btn v="gd" sm onClick={addItem}>Agregar</Btn>
              <Btn v="ol" sm onClick={()=>setShowAdd(false)}>Cancelar</Btn>
            </div>
          </div>
        )}
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#F8F6F1"}}>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:150}}>Categoría</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",width:150}}>Ítem</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left"}}>Texto para cliente</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:90}}>Estado</th>
            <th style={{padding:"5px 8px",fontSize:9,fontWeight:700,color:"#888",textAlign:"center",width:55}}>Mostrar</th>
            <th style={{width:24}}></th>
          </tr></thead>
          <tbody>
            {items.map((it,i)=>(
              <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0",opacity:it.mostrar?1:0.45}}>
                <td style={{padding:"6px 8px",fontSize:9,color:"#888"}}>{it.cat}</td>
                <td style={{padding:"6px 8px",fontSize:10,fontWeight:600}}>{it.item}</td>
                <td style={{padding:"6px 8px",fontSize:10,color:DK}}>
                  {editId===it.id
                    ?<div style={{display:"flex",gap:6}}><input value={editTexto} onChange={e=>setEditTexto(e.target.value)} style={{...si,flex:1,fontSize:10,padding:"4px 6px"}}/><Btn v="gd" sm onClick={saveEdit}>✓</Btn><Btn v="ol" sm onClick={()=>setEditId(null)}>×</Btn></div>
                    :<span onClick={()=>startEdit(it)} title="Clic para editar" style={{cursor:"text",borderBottom:"1px dashed #DDD"}}>{it.texto}</span>}
                </td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>
                  <select value={it.estado} onChange={e=>setEstado(it.id,e.target.value)} style={{...si,padding:"3px 5px",fontSize:9,width:"auto",background:ESTADO_BADGE[it.estado]?.bg,color:ESTADO_BADGE[it.estado]?.c,fontWeight:700,border:"none"}}>
                    {ESTADOS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </td>
                <td style={{padding:"6px 8px",textAlign:"center"}}>
                  <button onClick={()=>tog(it.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(it.mostrar?G:"#CCC"),background:it.mostrar?G:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,margin:"0 auto"}}>{it.mostrar?"✓":""}</button>
                </td>
                <td style={{padding:"6px 4px",textAlign:"center"}}><button onClick={()=>del(it.id)} style={{background:"none",border:"none",color:"#DDD",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Exclusiones y Supuestos del Servicio" cl={cl} pr={pr} fe={fe}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"4px 20px",marginBottom:16}}>
          {[["Cliente",cl||"—"],["Proyecto",pr||"—"],["Código",cod||"—"],["Responsable",resp||"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:600,fontSize:10}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,color:"#555",marginBottom:18,lineHeight:1.6,fontStyle:"italic"}}>Este documento delimita las exclusiones y los supuestos base considerados para la oferta o propuesta económica del encargo.</p>
        {Object.entries(byEstado).map(([estado,its])=>(
          <div key={estado} style={{marginBottom:20}}>
            <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"7px 14px"}}>
              <span style={{fontWeight:800,fontSize:10,textTransform:"uppercase",letterSpacing:"1.5px",color:G}}>{SECCION_LABEL[estado]}</span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #E5DDD0",borderTop:"none"}}>
              <tbody>
                {its.map((it,i)=>(
                  <tr key={it.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                    <td style={{padding:"8px 12px",width:170,verticalAlign:"top"}}>
                      <div style={{fontWeight:700,fontSize:10}}>{it.item}</div>
                      <div style={{fontSize:8,color:"#AAA",marginTop:2}}>{it.cat}</div>
                    </td>
                    <td style={{padding:"8px 12px",fontSize:10,color:"#333",lineHeight:1.6}}>{it.texto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7,marginTop:8}}>
          <b style={{color:"#888"}}>NOTA:</b> Este formato no reemplaza la cotización ni el contrato.
        </div>
      </div>
    </div>
  );
}

// ══ CRONOGRAMA ════════════════════════════════════════════════════════
const ETAPAS_CRON=[
  {id:"lev",label:"Levantamiento",color:"#2471A3",semanas:1,activa:true},
  {id:"ant",label:"Anteproyecto",color:"#1E8449",semanas:3,activa:true},
  {id:"des",label:"Desarrollo",color:"#B7950B",semanas:4,activa:true},
  {id:"exp",label:"Expediente técnico",color:"#BA4A00",semanas:3,activa:true},
  {id:"sup",label:"Supervisión / Obra",color:"#6C3483",semanas:12,activa:false},
];

function ToolCronograma({toolId, onPrint}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useState(""); const [pr,spr]=useState(""); const [fe,sfe]=useState(today);
  const [inicio,sInicio]=useState(today);
  const [etapas,setEtapas]=useState(ETAPAS_CRON);
  const [honorario,setHonorario]=useState(""); const [nota,setNota]=useState("");

  const startResize=(e,etapaId)=>{
    e.preventDefault();
    const bar=e.currentTarget.parentElement;
    const startSem=etapas.find(et=>et.id===etapaId).semanas;
    const pixPerWeek=bar.offsetWidth/startSem;
    const startX=e.clientX;
    const onMove=ev=>{const delta=Math.round((ev.clientX-startX)/pixPerWeek);setSemanas(etapaId,Math.max(1,startSem+delta));};
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };
  const startDrag=(e,etapaId)=>{
    e.preventDefault();
    const gantt=e.currentTarget.parentElement.parentElement;
    const ganttW=gantt.offsetWidth;
    const pixPerWeek=ganttW/totalWeeks;
    const startX=e.clientX;
    const startSem=etapas.find(et=>et.id===etapaId).semanas;
    const idx=active.findIndex(et=>et.id===etapaId);
    let lastDelta=0;
    const onMove=ev=>{
      const rawDelta=Math.round((ev.clientX-startX)/pixPerWeek);
      if(rawDelta===lastDelta) return; lastDelta=rawDelta;
      if(idx===0){const d=new Date(inicio);d.setDate(d.getDate()+rawDelta*7);sInicio(d.toISOString().split("T")[0]);}
      else{const prevId=active[idx-1].id;const prevSem=etapas.find(et=>et.id===prevId).semanas;setSemanas(prevId,Math.max(1,prevSem+rawDelta));}
    };
    const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
    window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
  };

  const togEtapa=id=>setEtapas(p=>p.map(e=>e.id===id?{...e,activa:!e.activa}:e));
  const setSemanas=(id,v)=>setEtapas(p=>p.map(e=>e.id===id?{...e,semanas:Math.max(1,+v||1)}:e));

  const active=etapas.filter(e=>e.activa);
  const totalWeeks=active.reduce((s,e)=>s+e.semanas,0);
  let cursor=inicio;
  const timeline=active.map(e=>{const start=cursor;const end=addWeeks(start,e.semanas);cursor=end;return {...e,start,end,pct:e.semanas/totalWeeks*100};});
  const endDate=cursor;
  const hon=parseFloat(honorario.replace(/[^0-9.]/g,""))||0;
  const hitos=[{label:"Adelanto",pct:50,cuando:"Al inicio / firma"},{label:"Mitad",pct:25,cuando:"A mitad del proyecto"},{label:"Entrega",pct:25,cuando:"Entrega final"}];

  return (
    <div>
      <div style={cardS}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Fecha de propuesta"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Inicio estimado"><input type="date" value={inicio} onChange={e=>sInicio(e.target.value)} style={si}/></Fld>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:"0 14px"}}>
          <Fld label="Honorario total (S/) — opcional"><input value={honorario} onChange={e=>setHonorario(e.target.value)} placeholder="Ej. 99500" style={si}/></Fld>
          <Fld label="Nota / condición de plazo"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Los plazos están condicionados a aprobaciones oportunas del cliente." style={si}/></Fld>
        </div>
      </div>
      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Etapas y duraciones</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {etapas.map(e=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"1px solid #E5DDD0",borderRadius:6,background:e.activa?"#fff":"#F8F8F8",opacity:e.activa?1:0.5}}>
              <button onClick={()=>togEtapa(e.id)} style={{width:16,height:16,borderRadius:3,border:"1px solid "+(e.activa?e.color:"#CCC"),background:e.activa?e.color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,flexShrink:0}}>{e.activa?"✓":""}</button>
              <div style={{width:10,height:10,borderRadius:"50%",background:e.color,flexShrink:0}}></div>
              <span style={{fontSize:12,fontWeight:600,flex:1}}>{e.label}</span>
              <span style={{fontSize:10,color:"#AAA",marginRight:4}}>Semanas</span>
              <input type="number" min="1" max="52" value={e.semanas} onChange={ev=>setSemanas(e.id,ev.target.value)} style={{...si,width:60,textAlign:"center",padding:"5px 6px",fontSize:12,opacity:e.activa?1:0.5}} disabled={!e.activa}/>
            </div>
          ))}
        </div>
        <div style={{background:"#F8F6F1",border:"1px solid #E5DDD0",borderRadius:6,padding:"10px 14px",display:"flex",gap:28,flexWrap:"wrap",marginBottom:20}}>
          <div><div style={lb}>Inicio</div><div style={{fontWeight:700,fontSize:13}}>{fDate(inicio)}</div></div>
          <div><div style={lb}>Duración total</div><div style={{fontWeight:700,fontSize:13}}>{totalWeeks} semanas</div></div>
          <div><div style={lb}>Entrega estimada</div><div style={{fontWeight:700,fontSize:13,color:G}}>{fDate(endDate)}</div></div>
        </div>
        {active.length>0&&(
          <div>
            <p style={{...lb,color:G,margin:"0 0 6px"}}>Línea de tiempo — <span style={{fontWeight:400,color:"#AAA"}}>arrastra para mover · borde derecho para redimensionar</span></p>
            <div style={{display:"flex",marginBottom:4,paddingLeft:140}}>
              {Array.from({length:totalWeeks},(_,i)=>(
                <div key={i} style={{flex:1,fontSize:7,color:"#CCC",textAlign:"center",borderLeft:"1px solid #F0EBE0",paddingTop:1,minWidth:0}}>{(i+1)%2===0?i+1:""}</div>
              ))}
            </div>
            {timeline.map((e,idx)=>{
              const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
              return (
                <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:6}}>
                  <div style={{width:140,flexShrink:0,fontSize:10,fontWeight:600,color:DK,paddingRight:8,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.label}</div>
                  <div style={{flex:1,position:"relative",height:28}}>
                    <div style={{position:"absolute",left:0,right:0,top:6,bottom:6,background:"#F0EDE8",borderRadius:4}}/>
                    <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",top:0,bottom:0,background:e.color,borderRadius:4,cursor:"grab",display:"flex",alignItems:"center",userSelect:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}} onMouseDown={ev=>startDrag(ev,e.id)}>
                      {e.semanas>=2&&<span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 8px",flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{fDateShort(e.start)} → {fDateShort(e.end)}</span>}
                      <div onMouseDown={ev=>{ev.stopPropagation();startResize(ev,e.id);}} style={{width:8,height:"100%",cursor:"ew-resize",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 4px 4px 0"}}>
                        <div style={{width:2,height:12,background:"rgba(255,255,255,0.5)",borderRadius:2}}/>
                      </div>
                    </div>
                  </div>
                  <div style={{width:36,flexShrink:0,fontSize:9,color:"#888",textAlign:"right",paddingLeft:6}}>{e.semanas}sem</div>
                </div>
              );
            })}
            <div style={{paddingLeft:140,marginTop:2,paddingRight:36}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(inicio)}</span>
                <span style={{fontSize:8,color:"#AAA"}}>{fDateShort(endDate)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Cronograma de Proyecto por Etapas" cl={cl} pr={pr} fe={fe}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px 20px",marginBottom:18}}>
          {[["Inicio estimado",fDate(inicio)],["Duración total",totalWeeks+" semanas"],["Entrega estimada",fDate(endDate)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
              <span style={{color:"#888",fontSize:10}}>{k}</span><span style={{fontWeight:700,fontSize:10,color:k==="Entrega estimada"?G:DK}}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{...lb,color:G,marginBottom:10}}>Línea de tiempo</p>
        <div style={{marginBottom:20}}>
          {timeline.map((e,idx)=>{
            const offsetPct=timeline.slice(0,idx).reduce((s,x)=>s+x.semanas,0)/totalWeeks*100;
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",marginBottom:7}}>
                <div style={{width:150,flexShrink:0,fontSize:10,fontWeight:600,paddingRight:10,textAlign:"right"}}>{e.label}</div>
                <div style={{flex:1,background:"#F0EDE8",borderRadius:4,height:22,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:offsetPct+"%",width:e.pct+"%",height:"100%",background:e.color,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:8,color:"#fff",fontWeight:700,whiteSpace:"nowrap",padding:"0 4px"}}>{e.semanas} sem · {fDateShort(e.start)}–{fDateShort(e.end)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{...lb,color:G,marginBottom:8}}>Detalle por etapa</p>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:20}}>
          <thead><tr style={{background:DK}}>
            {["Etapa","Inicio","Entrega","Duración"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:G,textAlign:"left"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {timeline.map((e,i)=>(
              <tr key={e.id} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                <td style={{padding:"7px 10px",fontSize:10,fontWeight:600}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:7}}><span style={{width:8,height:8,borderRadius:"50%",background:e.color,display:"inline-block",flexShrink:0}}></span>{e.label}</span>
                </td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.start)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{fDate(e.end)}</td>
                <td style={{padding:"7px 10px",fontSize:10}}>{e.semanas} semana{e.semanas!==1?"s":""}</td>
              </tr>
            ))}
            <tr style={{background:"#F8F6F1",borderTop:"2px solid #E5DDD0"}}>
              <td colSpan={3} style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>Total</td>
              <td style={{padding:"7px 10px",fontSize:10,fontWeight:700}}>{totalWeeks} semanas</td>
            </tr>
          </tbody>
        </table>
        {hon>0&&(
          <>
            <p style={{...lb,color:G,marginBottom:8}}>Hitos de cobro referenciales</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {hitos.map(h=>(
                <div key={h.label} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12,textAlign:"center"}}>
                  <div style={{...lb,margin:"0 0 4px"}}>{h.label}</div>
                  <div style={{fontWeight:800,fontSize:16,color:G}}>{fmt(hon*h.pct/100)}</div>
                  <div style={{fontSize:9,color:"#AAA",marginTop:4}}>{h.cuando}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{borderTop:"1px solid #E5DDD0",paddingTop:10,color:"#AAA",fontSize:9,lineHeight:1.7}}>
          <b style={{color:"#888"}}>NOTA:</b> {nota||"Los plazos están condicionados a aprobaciones oportunas del cliente."}
        </div>
      </div>
    </div>
  );
}

// ══ ORDEN DE CAMBIO ═══════════════════════════════════════════════════
const MOTIVOS=["Pedido del cliente","Ajuste técnico","Compatibilización","Contingencia en obra","Error u omisión en información base","Ampliación de alcance","Otro"];
const IMPACTOS=["Alcance","Plazo","Honorarios","Entregables","Secuencia","Alcance + Plazo","Alcance + Honorarios","Alcance + Plazo + Honorarios"];
const SOLICITANTES=["Cliente","Arquitecto","Obra","Contratista"];

function ToolOC({toolId, onPrint}) {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useState(""); const [pr,spr]=useState(""); const [cod,scod]=useState("OC-01");
  const [fe,sfe]=useState(today); const [cot,scot]=useState(""); const [sol,ssol]=useState("Cliente");
  const [desc,sdesc]=useState(""); const [motivo,smotivo]=useState("Pedido del cliente"); const [impacto,simpacto]=useState("Alcance + Honorarios");
  const [docsAfect,sdocsAfect]=useState("");
  const [antesAlc,santesAlc]=useState(""); const [despAlc,sdespAlc]=useState("");
  const [antesEnt,santesEnt]=useState(""); const [despEnt,sdespEnt]=useState("");
  const [antesPlazo,santesPlazo]=useState(""); const [despPlazo,sdespPlazo]=useState("");
  const [honorAd,shonorad]=useState(""); const [extPlazo,sextPlazo]=useState(""); const [nuevoTotal,snuevoTotal]=useState("");
  const [hitoPago,shitoPago]=useState(""); const [obsKey,sobsKey]=useState(""); const [ajusteCron,sajusteCron]=useState("No"); const [notaCron,snotaCron]=useState("");
  const [emiteNom,semiteNom]=useState(""); const [emiteCargo,semiteCargo]=useState("Arquitecto a cargo"); const [emiteFe,semiteFe]=useState(today);
  const [apruebaNom,sapruebaNom]=useState(""); const [apruebaCargo,sapruebaCargo]=useState(""); const [apruebeFe,sapruebeFe]=useState("");

  const row=(label,val)=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F0EBE0"}}>
      <span style={{color:"#888",fontSize:10,minWidth:140}}>{label}</span>
      <span style={{fontWeight:600,fontSize:10,textAlign:"right",flex:1}}>{val||"—"}</span>
    </div>
  );
  const Sec=({n,title,children})=>(
    <div style={{marginBottom:18}}>
      <div style={{background:DK,borderRadius:"4px 4px 0 0",padding:"6px 14px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:G,fontWeight:800,fontSize:10}}>{n}.</span>
        <span style={{color:"#fff",fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"1px"}}>{title}</span>
      </div>
      <div style={{border:"1px solid #E5DDD0",borderTop:"none",borderRadius:"0 0 4px 4px",padding:"12px 14px"}}>{children}</div>
    </div>
  );
  const conditions=["Esta orden de cambio modifica exclusivamente los puntos aquí indicados y mantiene vigentes las demás condiciones de la cotización o contrato base.","Cualquier trabajo adicional no descrito en este formato deberá evaluarse y formalizarse mediante una nueva orden de cambio.","Los plazos actualizados se contabilizan desde la aprobación de esta orden y desde la disponibilidad de la información o pagos requeridos.","La ejecución del cambio queda sujeta a la aprobación expresa del cliente."];

  return (
    <div>
      <div style={cardS}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{...lb,color:G,margin:0}}>Datos del formulario</p>
          <Btn v="gd" sm onClick={onPrint}>🖨 Imprimir / PDF</Btn>
        </div>
        <p style={{...lb,color:G,margin:"0 0 8px"}}>1. Datos generales</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Cliente"><Inp value={cl} onChange={scl} placeholder="Nombre del cliente"/></Fld>
          <Fld label="Proyecto"><Inp value={pr} onChange={spr} placeholder="Descripción"/></Fld>
          <Fld label="Código OC"><Inp value={cod} onChange={scod} placeholder="OC-01"/></Fld>
          <Fld label="Fecha"><input type="date" value={fe} onChange={e=>sfe(e.target.value)} style={si}/></Fld>
          <Fld label="Cotización de referencia"><Inp value={cot} onChange={scot} placeholder="COT-2026-001"/></Fld>
          <Fld label="Solicitado por"><Sel value={sol} onChange={ssol} options={SOLICITANTES}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>2. Resumen del cambio</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
          <Fld label="Descripción del cambio"><textarea value={desc} onChange={e=>sdesc(e.target.value)} placeholder="Describe de forma concreta qué cambia." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Documentos afectados"><textarea value={docsAfect} onChange={e=>sdocsAfect(e.target.value)} placeholder="Planos, cronograma, propuesta, matriz de entregables..." style={{...si,height:64,resize:"vertical"}}/></Fld>
          <Fld label="Motivo"><Sel value={motivo} onChange={smotivo} options={MOTIVOS}/></Fld>
          <Fld label="Impacto principal"><Sel value={impacto} onChange={simpacto} options={IMPACTOS}/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>3. Detalle comparativo</p>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
          <thead><tr style={{background:"#F8F6F1"}}>
            {["Ítem","Antes","Después"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",borderBottom:"1px solid #E5DDD0"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[["Alcance",antesAlc,santesAlc,despAlc,sdespAlc],["Entregables",antesEnt,santesEnt,despEnt,sdespEnt],["Plazo",antesPlazo,santesPlazo,despPlazo,sdespPlazo]].map(([lbl,vA,sA,vD,sD])=>(
              <tr key={lbl} style={{borderBottom:"1px solid #F0EBE0"}}>
                <td style={{padding:"6px 10px",fontSize:10,fontWeight:700,width:90,verticalAlign:"middle"}}>{lbl}</td>
                <td style={{padding:"4px 6px",width:"42%"}}><input value={vA} onChange={e=>sA(e.target.value)} placeholder="Estado anterior..." style={{...si,fontSize:10,padding:"5px 8px"}}/></td>
                <td style={{padding:"4px 6px",width:"42%"}}><input value={vD} onChange={e=>sD(e.target.value)} placeholder="Estado nuevo..." style={{...si,fontSize:10,padding:"5px 8px"}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{...lb,color:G,margin:"8px 0"}}>4. Impacto del cambio</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 14px"}}>
          <Fld label="Honorario adicional (S/)"><Inp value={honorAd} onChange={shonorad} placeholder="0.00"/></Fld>
          <Fld label="Extensión de plazo"><Inp value={extPlazo} onChange={sextPlazo} placeholder="0 días / semanas"/></Fld>
          <Fld label="Nuevo total (S/)"><Inp value={nuevoTotal} onChange={snuevoTotal} placeholder="0.00"/></Fld>
          <Fld label="Hito de pago"><Inp value={hitoPago} onChange={shitoPago} placeholder="Cómo y cuándo se cobra"/></Fld>
          <Fld label="Ajuste de cronograma">
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              {["Sí","No"].map(o=><button key={o} onClick={()=>sajusteCron(o)} style={{...si,width:"auto",padding:"6px 16px",background:ajusteCron===o?DK:"#FDFCF9",color:ajusteCron===o?"#fff":DK,cursor:"pointer",fontWeight:600}}>{o}</button>)}
            </div>
            {ajusteCron==="Sí"&&<input value={notaCron} onChange={e=>snotaCron(e.target.value)} placeholder="Nota breve sobre el ajuste..." style={{...si,fontSize:10}}/>}
          </Fld>
          <Fld label="Observación clave"><Inp value={obsKey} onChange={sobsKey} placeholder="Nota importante sobre este cambio"/></Fld>
        </div>
        <p style={{...lb,color:G,margin:"8px 0"}}>5. Aprobación</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
          <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12}}>
            <p style={{...lb,margin:"0 0 8px"}}>Emite — CURVA Arquitectos</p>
            <Fld label="Nombre"><Inp value={emiteNom} onChange={semiteNom} placeholder="Arquitecto responsable"/></Fld>
            <Fld label="Cargo"><Inp value={emiteCargo} onChange={semiteCargo} placeholder="Cargo"/></Fld>
            <Fld label="Fecha"><input type="date" value={emiteFe} onChange={e=>semiteFe(e.target.value)} style={si}/></Fld>
          </div>
          <div style={{border:"1px solid #E5DDD0",borderRadius:6,padding:12}}>
            <p style={{...lb,margin:"0 0 8px"}}>Aprueba — Cliente</p>
            <Fld label="Nombre"><Inp value={apruebaNom} onChange={sapruebaNom} placeholder="Nombre del cliente"/></Fld>
            <Fld label="Cargo"><Inp value={apruebaCargo} onChange={sapruebaCargo} placeholder="Cargo"/></Fld>
            <Fld label="Fecha"><input type="date" value={apruebeFe} onChange={e=>sapruebeFe(e.target.value)} style={si}/></Fld>
          </div>
        </div>
      </div>

      <div data-doc-id={toolId} style={{...cardS,padding:28}}>
        <DocHeader title="Orden de Cambio" cl={cl} pr={pr} fe={fe}/>
        <Sec n="1" title="Datos generales">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Cliente",cl)}{row("Proyecto",pr)}{row("Código OC",cod)}{row("Fecha",fDate(fe))}{row("Cotización ref.",cot)}{row("Solicitado por",sol)}
          </div>
        </Sec>
        <Sec n="2" title="Resumen del cambio">
          <div style={{marginBottom:8}}>
            <div style={lb}>Descripción del cambio</div>
            <div style={{fontSize:10,lineHeight:1.6,color:DK,padding:"6px 0"}}>{desc||"—"}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Motivo",motivo)}{row("Impacto principal",impacto)}{row("Documentos afectados",docsAfect)}
          </div>
        </Sec>
        <Sec n="3" title="Detalle comparativo">
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#F8F6F1"}}>
              {["Ítem","Antes","Después"].map(h=><th key={h} style={{padding:"6px 10px",fontSize:9,fontWeight:700,color:"#888",textAlign:"left",borderBottom:"1px solid #E5DDD0"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[["Alcance",antesAlc,despAlc],["Entregables",antesEnt,despEnt],["Plazo",antesPlazo,despPlazo]].map(([l,a,d],i)=>(
                <tr key={l} style={{background:i%2?"#fff":"#FAFAF7",borderBottom:"1px solid #F0EBE0"}}>
                  <td style={{padding:"7px 10px",fontWeight:700,fontSize:10,width:90}}>{l}</td>
                  <td style={{padding:"7px 10px",fontSize:10,color:"#888"}}>{a||"—"}</td>
                  <td style={{padding:"7px 10px",fontSize:10}}>{d||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sec>
        <Sec n="4" title="Impacto del cambio">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
            {row("Honorario adicional",honorAd?`S/ ${honorAd}`:"S/ 0.00")}{row("Extensión de plazo",extPlazo||"—")}
            {row("Nuevo total",nuevoTotal?`S/ ${nuevoTotal}`:"—")}{row("Hito de pago",hitoPago)}
            {row("Ajuste de cronograma",ajusteCron+(notaCron?" — "+notaCron:""))}{row("Observación clave",obsKey)}
          </div>
        </Sec>
        <Sec n="5" title="Condiciones">
          {conditions.map((c,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:10,lineHeight:1.6,color:"#444"}}>
              <span style={{color:G,fontWeight:700,flexShrink:0}}>•</span><span>{c}</span>
            </div>
          ))}
        </Sec>
        <Sec n="6" title="Aprobación">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {[{titulo:"Emite — CURVA Arquitectos",nom:emiteNom,cargo:emiteCargo,fecha:fDate(emiteFe)},{titulo:"Aprueba — Cliente",nom:apruebaNom,cargo:apruebaCargo,fecha:fDate(apruebeFe)}].map(a=>(
              <div key={a.titulo} style={{border:"1px solid #E5DDD0",borderRadius:6,padding:"14px 16px"}}>
                <div style={{...lb,color:G,marginBottom:10}}>{a.titulo}</div>
                <div style={{borderTop:"1px solid #DDD",paddingTop:8,marginBottom:8,height:28}}/>
                {row("Nombre",a.nom)}{row("Cargo",a.cargo)}{row("Fecha",a.fecha)}
              </div>
            ))}
          </div>
        </Sec>
      </div>
    </div>
  );
}

// ══ ICONS ══════════════════════════════════════════════════════════════
const IconCalc=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="1" width="12" height="14" rx="1.5"/><line x1="5" y1="4.5" x2="11" y2="4.5"/><line x1="5" y1="7.5" x2="7" y2="7.5"/><line x1="9" y1="7.5" x2="11" y2="7.5"/><line x1="5" y1="10.5" x2="7" y2="10.5"/><line x1="9" y1="10.5" x2="11" y2="10.5"/><line x1="5" y1="13.5" x2="7" y2="13.5"/><line x1="9" y1="12" x2="11" y2="14"/><line x1="11" y1="12" x2="9" y2="14"/></svg>);
const IconMatrix=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="13" height="13" rx="1"/><line x1="1.5" y1="5" x2="14.5" y2="5"/><line x1="1.5" y1="8.5" x2="14.5" y2="8.5"/><line x1="1.5" y1="12" x2="14.5" y2="12"/><line x1="5.5" y1="5" x2="5.5" y2="14.5"/><circle cx="10" cy="6.75" r="0.8" fill={c} stroke="none"/><circle cx="10" cy="10.25" r="0.8" fill={c} stroke="none"/><line x1="7" y1="6.75" x2="8.2" y2="6.75"/><line x1="7" y1="10.25" x2="8.2" y2="10.25"/><line x1="7" y1="13.25" x2="13" y2="13.25"/></svg>);
const IconExcl=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/><polyline points="9 1.5 9 6 13.5 6"/><line x1="5" y1="9" x2="7.2" y2="9"/><line x1="5" y1="11.5" x2="11" y2="11.5"/><line x1="9.5" y1="8" x2="11" y2="9.5"/><line x1="11" y1="8" x2="9.5" y2="9.5"/></svg>);
const IconCron=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="2" y2="14"/><line x1="2" y1="14" x2="14" y2="14"/><rect x="3" y="3.5" width="5" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/><rect x="3" y="7" width="8" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/><rect x="3" y="10.5" width="3" height="2" rx="0.5" fill={c} stroke="none" opacity="0.9"/></svg>);
const IconOC=({c="#fff",s=16})=>(<svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5H3.5A1 1 0 0 0 2.5 2.5V13.5A1 1 0 0 0 3.5 14.5H12.5A1 1 0 0 0 13.5 13.5V6L9 1.5Z"/><polyline points="9 1.5 9 6 13.5 6"/><line x1="5" y1="8.5" x2="7.5" y2="8.5"/><line x1="8.5" y1="8.5" x2="11" y2="8.5"/><polyline points="7 7.5 5 8.5 7 9.5" fill="none"/><polyline points="9 7.5 11 8.5 9 9.5" fill="none"/><line x1="5" y1="11" x2="11" y2="11"/></svg>);
const TOOL_ICONS={calc:IconCalc,matrix:IconMatrix,excl:IconExcl,cron:IconCron,oc:IconOC};

const DEFAULT_TOOLS=[
  {id:"calc", label:"Calculadora de Honorarios",  component:ToolCalc,  checked:true},
  {id:"matrix",label:"Matriz de Entregables",      component:ToolMatrix,checked:true},
  {id:"excl", label:"Exclusiones y Supuestos",     component:ToolExcl,  checked:true},
  {id:"cron", label:"Cronograma por Etapas",       component:ToolCronograma,checked:true},
  {id:"oc",   label:"Orden de Cambio",             component:ToolOC,    checked:true},
];

// ══ MAIN APP ══════════════════════════════════════════════════════════
export default function App() {
  const [tools,setTools]=useState(DEFAULT_TOOLS);
  const [active,setActive]=useState("calc");

  const toggleCheck=id=>setTools(p=>p.map(t=>t.id===id?{...t,checked:!t.checked}:t));

  const printTool=id=>{
    const el=document.querySelector(`[data-doc-id="${id}"]`);
    if(!el){
      alert('El documento para esta herramienta aún no está disponible.\nCompleta el formulario hasta ver la vista de documento.');
      return;
    }
    openPrintWin(el.outerHTML);
  };

  const exportProposal=()=>{
    const checked=tools.filter(t=>t.checked);
    if(!checked.length){alert('Selecciona al menos una sección en el checklist del panel izquierdo.');return;}
    const parts=[]; const missing=[];
    checked.forEach(t=>{
      const el=document.querySelector(`[data-doc-id="${t.id}"]`);
      if(el) parts.push(el.outerHTML);
      else missing.push(t.label);
    });
    if(missing.length){
      const go=window.confirm(`Las siguientes secciones aún no tienen documento generado:\n• ${missing.join('\n• ')}\n\n¿Exportar igual con las secciones disponibles?`);
      if(!go) return;
    }
    if(!parts.length){alert('No hay secciones disponibles para exportar.');return;}
    const html=parts.join('<div class="page-break"></div>');
    openPrintWin(html);
  };

  const current=tools.find(t=>t.id===active);
  const nChecked=tools.filter(t=>t.checked).length;

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter','Helvetica Neue',sans-serif",background:BG,color:DK,overflow:"hidden"}}>
      {/* ── SIDEBAR ── */}
      <div style={{width:218,background:DK,display:"flex",flexDirection:"column",flexShrink:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"18px 14px 14px",borderBottom:"1px solid #222"}}>
          <Brand/>
        </div>

        <nav style={{flex:1,padding:"8px 0"}}>
          <div style={{padding:"8px 14px 6px",fontSize:8,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:"1px"}}>
            Incluir en propuesta
          </div>
          {tools.map(t=>{
            const Icon=TOOL_ICONS[t.id]||IconCalc;
            const isActive=active===t.id;
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",background:isActive?"#252525":"transparent",borderLeft:"3px solid "+(isActive?G:"transparent"),transition:"background 0.1s"}}>
                {/* Checkbox zone */}
                <div
                  onClick={e=>{e.stopPropagation();toggleCheck(t.id);}}
                  title={t.checked?"Quitar de propuesta":"Incluir en propuesta"}
                  style={{padding:"10px 8px 10px 12px",cursor:"pointer",display:"flex",alignItems:"center",flexShrink:0}}
                >
                  <div style={{width:14,height:14,border:"1.5px solid "+(t.checked?G:"#3A3A3A"),background:t.checked?G:"transparent",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.1s",flexShrink:0}}>
                    {t.checked&&<span style={{color:"#fff",fontSize:8,fontWeight:800,lineHeight:1}}>✓</span>}
                  </div>
                </div>
                {/* Nav button */}
                <button
                  onClick={()=>setActive(t.id)}
                  style={{flex:1,padding:"10px 12px 10px 4px",background:"transparent",border:"none",color:isActive?"#fff":"#666",fontSize:11,fontWeight:isActive?600:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}
                >
                  <Icon c={isActive?G:"#555"} s={15}/>
                  <span style={{lineHeight:1.3}}>{t.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Export button */}
        <div style={{padding:"12px",borderTop:"1px solid #1E1E1E"}}>
          <button
            onClick={exportProposal}
            style={{width:"100%",padding:"10px 0",background:G,color:"#fff",border:"none",borderRadius:4,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.4px",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
          >
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v9M4 7l4 4 4-4"/><line x1="2" y1="14" x2="14" y2="14"/>
            </svg>
            Exportar Propuesta
          </button>
          <div style={{fontSize:9,color:"#444",textAlign:"center",marginTop:7,lineHeight:1.4}}>
            <span style={{color:nChecked>0?G:"#3A3A3A",fontWeight:700}}>{nChecked}</span>
            <span> de {tools.length} secciones seleccionadas</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        <div style={{maxWidth:820,margin:"0 auto"}}>
          <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <h1 style={{margin:0,fontSize:16,fontWeight:800,display:"flex",alignItems:"center",gap:10}}>
              {(()=>{const Icon=TOOL_ICONS[current?.id]||IconCalc;return <Icon c={DK} s={18}/>;})()}
              {current?.label}
            </h1>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:tools.find(t=>t.id===active)?.checked?G:"#333"}}/>
              <span style={{fontSize:9,color:"#AAA"}}>{tools.find(t=>t.id===active)?.checked?"Incluida en propuesta":"No incluida"}</span>
            </div>
          </div>

          {/* All tools always mounted — hidden when not active */}
          {tools.map(t=>{
            const C=t.component;
            return (
              <div key={t.id} style={{display:active===t.id?"block":"none"}}>
                <C toolId={t.id} onPrint={()=>printTool(t.id)}/>
              </div>
            );
          })}

          <InfoBubble toolId={active}/>
        </div>
      </div>
    </div>
  );
}
