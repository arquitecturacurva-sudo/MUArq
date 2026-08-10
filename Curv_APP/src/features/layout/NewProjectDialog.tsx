import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/kit";
import {
  COMMERCIAL_STATUS_OPTIONS,
  PROJECT_CURRENCY_OPTIONS,
  TRACK_DEFAULT_ORDER,
  TRACK_LABELS,
  type CommercialStatus,
  type ProjectCurrency,
  type TrackId,
} from "../runtime/runtime";

export type NewProjectDialogProps = {
  name: string;
  setName: (value: string) => void;
  client: string;
  setClient: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  currency: ProjectCurrency;
  setCurrency: (value: ProjectCurrency) => void;
  status: CommercialStatus;
  setStatus: (value: CommercialStatus) => void;
  tracks: Record<TrackId, boolean>;
  setTracks: React.Dispatch<React.SetStateAction<Record<TrackId, boolean>>>;
  createProject: () => void;
};

/**
 * The new-project form used to occupy a third of the dashboard. It is a task, not a
 * readout, so it lives behind the primary action instead of competing with the metrics.
 */
export default function NewProjectDialog({
  name,
  setName,
  client,
  setClient,
  code,
  setCode,
  type,
  setType,
  location,
  setLocation,
  currency,
  setCurrency,
  status,
  setStatus,
  tracks,
  setTracks,
  createProject,
}: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const submit = () => {
    createProject();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Nuevo proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Esta ficha alimenta la propuesta, la cotización y la cobranza.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="np-name">Nombre del proyecto</FieldLabel>
            <Input
              id="np-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Casa Pradera"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="np-client">Cliente</FieldLabel>
              <Input
                id="np-client"
                value={client}
                onChange={(event) => setClient(event.target.value)}
                placeholder="Ej. GoTo Market"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="np-code">Código de cotización</FieldLabel>
              <Input
                id="np-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Ej. COT-012"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="np-type">Tipo</FieldLabel>
              <Input
                id="np-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="Vivienda / Comercial"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="np-location">Ubicación</FieldLabel>
              <Input
                id="np-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ciudad / distrito"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="np-status">Estado comercial</FieldLabel>
              <Select value={status} onValueChange={(value) => setStatus(value as CommercialStatus)}>
                <SelectTrigger id="np-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMERCIAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="np-currency">Moneda</FieldLabel>
              <Select value={currency} onValueChange={(value) => setCurrency(value as ProjectCurrency)}>
                <SelectTrigger id="np-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel>Tracks activos</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {TRACK_DEFAULT_ORDER.map((track) => (
                <Button
                  key={track}
                  type="button"
                  size="sm"
                  variant={tracks[track] ? "brand" : "outline"}
                  aria-pressed={tracks[track]}
                  onClick={() => setTracks((prev) => ({...prev, [track]: !prev[track]}))}
                >
                  {TRACK_LABELS[track]}
                </Button>
              ))}
            </div>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Crear proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
