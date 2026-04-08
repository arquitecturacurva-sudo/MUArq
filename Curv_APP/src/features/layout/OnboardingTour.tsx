import { APP_TOUR_STEPS, DK, G, UI } from "../runtime/runtime";

type OnboardingTourProps = {
  tourOpen: boolean;
  closeTour: () => void;
  tourTargetRect: DOMRect | null;
  tourStepIndex: number;
  goPrevTourStep: () => void;
  goNextTourStep: () => void;
};

export default function OnboardingTour({
  tourOpen,
  closeTour,
  tourTargetRect,
  tourStepIndex,
  goPrevTourStep,
  goNextTourStep,
}: OnboardingTourProps) {
  if (!tourOpen) return null;

  return (
    <>
      <div onClick={closeTour} style={{position: "fixed", inset: 0, background: "rgba(11,15,20,0.48)", zIndex: 120}} />
      {tourTargetRect && (
        <div style={{position: "fixed", top: Math.max(0, tourTargetRect.top - 6), left: Math.max(0, tourTargetRect.left - 6), width: Math.max(20, tourTargetRect.width + 12), height: Math.max(20, tourTargetRect.height + 12), borderRadius: 10, border: `2px solid ${UI.accent}`, boxShadow: "0 0 0 9999px rgba(0,0,0,0)", pointerEvents: "none", zIndex: 121}}/>
      )}
      <div style={{position: "fixed", right: 24, bottom: 24, width: 340, maxWidth: "calc(100vw - 32px)", background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 10, boxShadow: "0 10px 26px rgba(16,24,40,0.18)", zIndex: 122, padding: "14px 14px 12px"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8}}>
          <div>
            <div style={{fontSize: 10, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4}}>
              Guía rápida · Paso {tourStepIndex + 1}/{APP_TOUR_STEPS.length}
            </div>
            <div style={{fontSize: 13, fontWeight: 800, color: DK}}>{APP_TOUR_STEPS[tourStepIndex]?.title}</div>
          </div>
          <button onClick={closeTour} title="Cerrar guía" style={{background: "transparent", border: "none", fontSize: 14, color: UI.textMuted, cursor: "pointer", lineHeight: 1, padding: 2}}>×</button>
        </div>
        <div style={{fontSize: 11, color: UI.textMuted, lineHeight: 1.55, marginBottom: 12}}>
          {APP_TOUR_STEPS[tourStepIndex]?.desc}
        </div>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <button onClick={goPrevTourStep} disabled={tourStepIndex === 0} style={{background: "transparent", border: `1px solid ${UI.border}`, borderRadius: 6, color: tourStepIndex === 0 ? "#AAB3BE" : UI.textMuted, fontSize: 10, fontWeight: 700, padding: "6px 10px", cursor: tourStepIndex === 0 ? "not-allowed" : "pointer"}}>
            ← Anterior
          </button>
          <button onClick={goNextTourStep} style={{background: UI.dark, border: "1px solid #0F141A", borderRadius: 6, color: "#fff", fontSize: 10, fontWeight: 700, padding: "6px 12px", cursor: "pointer"}}>
            {tourStepIndex === APP_TOUR_STEPS.length - 1 ? "Finalizar" : "Siguiente →"}
          </button>
        </div>
      </div>
    </>
  );
}
