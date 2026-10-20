import { useState, type ChangeEvent } from "react";
import {
  deleteBrandLogo,
  uploadBrandLogo,
  validateLogoFile,
  type BrandLogoUploadResult,
} from "../../lib/storage/brandLogoStorage";
import { runLockedBrandMutation } from "./brandMutationLock";
import { BrandLogoPicker } from "./BrandLogoPicker";

type LogoUploaderProps = {
  clientId: string;
  logoUrl?: string;
  companyName: string;
  disabled: boolean;
  beforeMutation: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onUploaded: (result: BrandLogoUploadResult) => void;
  onRemoved: () => void;
};

type LogoActionState = "idle" | "uploading" | "removing";

export const LogoUploader = ({
  clientId,
  logoUrl,
  companyName,
  disabled,
  beforeMutation,
  onBusyChange,
  onUploaded,
  onRemoved,
}: LogoUploaderProps) => {
  const [actionState, setActionState] = useState<LogoActionState>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = disabled || actionState !== "idle";

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;
    setError("");
    setMessage("");
    setActionState("uploading");
    try {
      const result = await runLockedBrandMutation(onBusyChange, async () => {
        const validation = await validateLogoFile(file);
        if (!validation.valid) throw new Error(validation.errors.join(" "));
        await beforeMutation();
        return uploadBrandLogo(clientId, file, validation);
      });
      onUploaded(result);
      setMessage(result.warnings[0] || "Logo guardado de forma segura.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos subir el logo.");
    } finally {
      setActionState("idle");
    }
  };

  const handleRemove = async () => {
    if (disabled) return;
    setError("");
    setMessage("");
    setActionState("removing");
    try {
      await runLockedBrandMutation(onBusyChange, async () => {
        await beforeMutation();
        await deleteBrandLogo(clientId);
      });
      onRemoved();
      setMessage("Logo eliminado. Usaremos el nombre de tu estudio.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos eliminar el logo.");
    } finally {
      setActionState("idle");
    }
  };

  return <BrandLogoPicker
    logoUrl={logoUrl}
    companyName={companyName}
    busy={busy}
    actionState={actionState}
    message={message}
    error={error}
    onFileChange={handleFile}
    onRemove={() => { void handleRemove(); }}
  />;
};
