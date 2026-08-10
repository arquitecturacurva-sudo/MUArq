import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Pill } from "../ui/kit";
import type { DemoProjectDefinition, DemoTourStep } from "./types";
import "./demos.css";

export type DemoTourProps = {
  definition: DemoProjectDefinition;
  restartToken: string | number;
  onActivateTool: (step: DemoTourStep) => void;
  onStepCompleted: (step: DemoTourStep, stepIndex: number) => void;
  onCompleted: () => void;
  onDuplicate: () => void;
  onCreateFromScratch: () => void;
  onBackToDemos: () => void;
  onClose?: () => void;
};

type DemoTourSessionProps = Omit<DemoTourProps, "restartToken">;

function DemoTourSession({
  definition,
  onActivateTool,
  onStepCompleted,
  onCompleted,
  onDuplicate,
  onCreateFromScratch,
  onBackToDemos,
  onClose,
}: DemoTourSessionProps) {
  const steps = useMemo(() => definition.tourSteps.slice(0, 5), [definition.tourSteps]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(steps.length === 0);
  const [isOpen, setIsOpen] = useState(true);
  const activateToolRef = useRef(onActivateTool);
  const currentStep = steps[stepIndex];
  const progressValue = isComplete ? steps.length : Math.min(stepIndex + 1, steps.length);

  useEffect(() => {
    activateToolRef.current = onActivateTool;
  }, [onActivateTool]);

  useEffect(() => {
    const firstStep = steps[0];
    if (firstStep) activateToolRef.current(firstStep);
  }, [steps]);

  if (!isOpen) return null;

  const activateStep = (nextIndex: number) => {
    const nextStep = steps[nextIndex];
    if (!nextStep) return;
    setStepIndex(nextIndex);
    onActivateTool(nextStep);
  };

  const goBack = () => {
    if (stepIndex > 0) activateStep(stepIndex - 1);
  };

  const goForward = () => {
    if (!currentStep) return;
    onStepCompleted(currentStep, stepIndex);

    if (stepIndex === steps.length - 1) {
      setIsComplete(true);
      onCompleted();
      return;
    }

    activateStep(stepIndex + 1);
  };

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <aside className="demo-tour" aria-label={`Recorrido guiado de ${definition.title}`}>
      <div className="demo-tour__topline">
        <Pill tone="brand">Proyecto demo</Pill>
        <button className="demo-tour__close" type="button" onClick={close} aria-label="Cerrar recorrido">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="demo-tour__progress-row">
        <span>{isComplete ? "Recorrido completo" : `Paso ${progressValue} de ${steps.length}`}</span>
        <span>{steps.length ? Math.round((progressValue / steps.length) * 100) : 100}%</span>
      </div>
      <div
        className="demo-tour__progress"
        role="progressbar"
        aria-label="Progreso del recorrido"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={progressValue}
      >
        <span style={{ width: `${steps.length ? (progressValue / steps.length) * 100 : 100}%` }} />
      </div>

      {isComplete ? (
        <div className="demo-tour__completion" aria-live="polite">
          <p className="demo-tour__eyebrow">Ya conoces el flujo de {definition.title}</p>
          <h2>Crea un proyecto real con este mismo flujo.</h2>
          <div className="demo-tour__completion-actions">
            <Button variant="default" onClick={onDuplicate}>
              Duplicar como proyecto
            </Button>
            <Button variant="outline" onClick={onCreateFromScratch}>
              Crear proyecto desde cero
            </Button>
            <Button variant="ghost" onClick={onBackToDemos}>
              Volver a las demos
            </Button>
          </div>
        </div>
      ) : currentStep ? (
        <div className="demo-tour__step" aria-live="polite">
          <p className="demo-tour__eyebrow">{definition.title}</p>
          <h2>{currentStep.title}</h2>
          <p>{currentStep.description}</p>
          <div className="demo-tour__navigation">
            <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
              <ArrowLeft size={15} aria-hidden />
              Anterior
            </Button>
            <Button variant="default" onClick={goForward}>
              {stepIndex === steps.length - 1 ? "Finalizar" : "Siguiente"}
              {stepIndex === steps.length - 1 ? null : <ArrowRight size={15} aria-hidden />}
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function DemoTour({ restartToken, ...props }: DemoTourProps) {
  return (
    <DemoTourSession
      key={`${props.definition.id}-v${props.definition.version}-${restartToken}`}
      {...props}
    />
  );
}
