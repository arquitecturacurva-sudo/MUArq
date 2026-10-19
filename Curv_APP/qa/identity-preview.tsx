// Development-only visual fixture. Uses a dedicated local project, never a Firebase session.
import { useState } from 'react';
import type { ComponentProps } from 'react';
import '../src/index.css';
import '../src/styles/kit.css';
import '../src/features/branding/branding.css';
import '../src/features/branding/brandingFonts';
import { THEME_VARS } from '../src/features/ui/theme';
import { Button } from '../src/features/ui/kit';
import AppHeader from '../src/features/layout/AppHeader';
import HomeView from '../src/features/layout/HomeView';
import WorkspaceSidebar from '../src/features/layout/WorkspaceSidebar';
import WorkspaceMain from '../src/features/layout/WorkspaceMain';
import { WorkspaceBody, WorkspacePage } from '../src/features/layout/WorkspaceLayout';
import { LocalBrandEditor } from './LocalBrandEditor';
import { DEFAULT_TOOLS } from '../src/composition/toolRegistry';
import { DEMO_DEFINITIONS } from '../src/features/demos/demoDefinitions';
import { computeDashboardMetrics, hydrateProjectSnapshot, readProjectBaseMetadata, setActiveStorageProjectId } from '../src/features/runtime/runtime';
import type { TrackId } from '../src/domain/project/project';
import type { SaveStatus } from '../src/features/ui/kit/saveState';

const projectId = 'qa-curv-ui-identity';
const demo = DEMO_DEFINITIONS[0];
const project = {...demo.project, id: projectId, name: 'REMODE MIRAFLORES'};
setActiveStorageProjectId(projectId);
hydrateProjectSnapshot(projectId, {...demo.snapshot, projectId, baseMeta: {...demo.snapshot.baseMeta, projectName: project.name, client: 'Cliente de ejemplo', location: 'Miraflores'}});
Object.entries(THEME_VARS).forEach(([key,value])=>document.documentElement.style.setProperty(key,String(value)));
const noop = () => {};

export function IdentityPreview() {
  const [view,setView] = useState('Dashboard');
  const [active,setActive] = useState('matrix');
  const [track,setTrack] = useState<TrackId>('diseno');
  const [tools,setTools] = useState(DEFAULT_TOOLS);
  const [save,setSave] = useState<SaveStatus>('saved_local');
  const [action,setAction] = useState('');
  const nav = {onOpenDashboard:()=>setView('Dashboard'),onOpenDemos:()=>setView('Componentes'),onOpenTeamAccess:noop,onOpenBranding:()=>setView('Identidad')};
  const trackIds = track==='diseno'?['calc','matrix','excl','cron']:track==='construccion'?['cot','cronobra','brief']:['val','oc'];
  const currentTools = tools.filter(t=>trackIds.includes(t.id));
  const metrics = computeDashboardMetrics(project);
  const states = {diseno:{'No iniciado':0,'En curso':1,Completado:0},construccion:{'No iniciado':0,'En curso':1,Completado:0},seguimiento:{'No iniciado':1,'En curso':0,Completado:0}};
  const homeProps: ComponentProps<typeof HomeView> = {
    themeVars:THEME_VARS,newProjectName:'',setNewProjectName:noop,newProjectClient:'',setNewProjectClient:noop,newProjectCode:'',setNewProjectCode:noop,newProjectType:'',setNewProjectType:noop,newProjectLocation:'',setNewProjectLocation:noop,newProjectCurrency:'PEN',setNewProjectCurrency:noop,newProjectStatus:'Lead',setNewProjectStatus:noop,newProjectTracks:project.tracks,setNewProjectTracks:noop,createProject:()=>setAction('Formulario de ejemplo; no se crea un proyecto en la nube.'),normalizedProjects:[project],totalsByTrack:states,projectsWithMetrics:[{project,baseMeta:readProjectBaseMetadata(projectId),metrics,disenoGantt:[],obraGantt:[]}],demoDefinitions:[],openDemoHub:()=>setView('Componentes'),openDemo:noop,openTeamAccess:noop,openBrandSettings:()=>setView('Identidad'),openProject:()=>setView('Herramientas'),handleEditProject:noop,toggleArchiveProject:noop,handleDeleteProject:noop,
  };
  const labels: Record<SaveStatus,string> = {saving:'Guardando…',saved_local:'Guardado local',saved_cloud:'Guardado en la nube',offline:'Sin conexión',retrying:'Reintentando…',conflict:'Conflicto de versiones',error:'Error al guardar'};
  return <>
    <div style={{...THEME_VARS,padding:'8px 24px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',background:'var(--ui-accent-soft)',color:'var(--ui-text)',fontSize:14}}>
      <span>QA local · datos de ejemplo · sin backend</span>
      {['Dashboard','Herramientas','Identidad','Componentes'].map(name=><Button key={name} size="sm" variant={view===name?'default':'ghost'} onClick={()=>name==='Componentes'?window.location.assign('/qa/ui-kit.html'):setView(name)}>{name}</Button>)}
      <label>Simular guardado <select aria-label="Simular guardado" value={save} onChange={e=>setSave(e.target.value as SaveStatus)}>{Object.entries(labels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>
      <span role="status">{action}</span>
    </div>
    {view==='Dashboard'?<HomeView {...homeProps}/>:view==='Herramientas'?<WorkspacePage themeVars={THEME_VARS}>
      <AppHeader title={project.name} active="workspace" {...nav}/>
      <WorkspaceBody>
        <WorkspaceSidebar activeProject={project} activeProjectId={projectId} enabledTrackOrder={['diseno','construccion','seguimiento']} workspaceTrack={track} setWorkspaceTrack={t=>{setTrack(t);setActive(t==='diseno'?'matrix':t==='construccion'?'cot':'val');}} activeTrackTools={currentTools} active={active} toggleCheck={id=>setTools(previous=>previous.map(t=>t.id===id?{...t,checked:!t.checked}:t))} setActive={setActive} exportProposal={()=>setAction('Exportación seleccionada (simulación local).')} nChecked={tools.filter(t=>t.checked).length} tools={tools} handleResetActiveProject={noop}/>
        <WorkspaceMain openOnboarding={noop} tools={tools} active={active} hasSavedData={false} saveState={{status:save,label:labels[save],detail:'Estado simulado para revisión visual; sin backend.'}} onRetrySave={()=>setSave('saved_local')} onUseCloudCopy={()=>{setSave('saved_cloud');setAction('Usar nube seleccionado (simulación).');}} onKeepBothCopies={()=>{setSave('saved_local');setAction('Conservar ambas seleccionado (simulación).');}} onUseLocalCopy={()=>{setSave('saved_cloud');setAction('Usar mi versión seleccionado (simulación).');}} conflictBusy={false} activeTrackTools={currentTools} activeProjectId={projectId} projectResetToken={0} printTool={noop} current={tools.find(t=>t.id===active)}/>
      </WorkspaceBody>
    </WorkspacePage>:<>
      <AppHeader title="Identidad" active="branding" {...nav}/>
      <LocalBrandEditor />
    </>}
  </>;
}

