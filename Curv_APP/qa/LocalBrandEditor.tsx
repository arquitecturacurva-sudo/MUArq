import { useState, type ChangeEvent, type FormEvent } from "react";
import { BrandSettingsForm } from "../src/features/branding/BrandSettingsForm";
import { BrandLogoPicker } from "../src/features/branding/BrandLogoPicker";
import { BrandPreview } from "../src/features/branding/BrandPreview";
import { StatusPill } from "../src/features/ui/kit";
import { applyFontPreset, createDefaultBrandProfile } from "../src/lib/branding/defaults";
import { getContrastText } from "../src/lib/branding/contrast";
import { getBrandContactValidationError } from "../src/lib/branding/contactValidation";
import { normalizeHexColor } from "../src/lib/branding/hexValidation";
import { validateLogoFile } from "../src/lib/storage/brandLogoStorage";
import type { BrandProfileDraft, BrandSaveState } from "../src/lib/branding/types";

const initial = createDefaultBrandProfile({ownerUid:'qa-local',companyName:'Mi estudio de arquitectura'});

/** Local simulation of callbacks; production presentation components, no backend writes. */
export function LocalBrandEditor() {
  const [profile,setProfile] = useState<BrandProfileDraft>(initial);
  const [state,setState] = useState<BrandSaveState>('idle');
  const [error,setError] = useState('');
  const [logoError,setLogoError] = useState('');
  const [logoBusy,setLogoBusy] = useState(false);
  const preview = {...profile,backgroundColor:normalizeHexColor(profile.backgroundColor)||initial.backgroundColor,accentColor:normalizeHexColor(profile.accentColor)||initial.accentColor,primaryTextColor:getContrastText(normalizeHexColor(profile.backgroundColor)||initial.backgroundColor)};
  const edit = <K extends keyof BrandProfileDraft>(field:K,value:BrandProfileDraft[K]) => {setProfile(p=>({...p,[field]:value}));setState('idle');setError('');};
  const submit = (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!event.currentTarget.reportValidity())return;
    const invalid=getBrandContactValidationError(profile)||(!normalizeHexColor(profile.backgroundColor)||!normalizeHexColor(profile.accentColor)?'Corrige los colores antes de guardar.':'');
    setError(invalid);setState(invalid?'error':'saved');
  };
  const pick = async (event:ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    setLogoBusy(true);setLogoError('');
    try {
      const result=await validateLogoFile(file);if(!result.valid)throw new Error(result.errors.join(' '));
      const reader=new FileReader();
      const url=await new Promise<string>((resolve,reject)=>{reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No pudimos leer el archivo.'));reader.readAsDataURL(file);});
      edit('logoUrl',url);
    }catch(caught){setLogoError(caught instanceof Error?caught.message:'No pudimos leer el logo.');}
    finally{setLogoBusy(false);}
  };
  return <main className="brand-settings-shell">
    <header className="brand-settings-header"><div className="brand-settings-heading"><div><h1>Identidad del estudio</h1><p>Personaliza tus documentos y vistas previas externas.</p></div></div><StatusPill label={state==='saved'?'Guardado de prueba (local)':state==='error'?'Error al guardar':'Cambios sin guardar'} tone={state==='saved'?'success':state==='error'?'danger':'warning'} /></header>
    <div className="brand-settings-layout">
      <BrandSettingsForm profile={profile} previewProfile={preview} fallbackCompanyName="Mi estudio" canEdit busy={logoBusy} saveState={state} saveError={error} onFieldChange={edit} onFontChange={value=>{setProfile(p=>applyFontPreset(p,value));setState('idle');}} onSubmit={submit} onReset={()=>{setProfile(p=>({...initial,logoUrl:p.logoUrl}));setState('idle');setError('');}} onPrint={()=>window.print()} logoControl={<BrandLogoPicker logoUrl={profile.logoUrl} companyName={profile.companyName} busy={logoBusy} actionState={logoBusy?'uploading':'idle'} message="" error={logoError} onFileChange={event=>{void pick(event);}} onRemove={()=>edit('logoUrl',undefined)}/>} />
      <BrandPreview profile={preview} fallbackCompanyName="Mi estudio"/>
    </div>
  </main>;
}
