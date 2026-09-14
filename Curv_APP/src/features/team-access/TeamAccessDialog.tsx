import type { ReactNode } from "react";
import { ModalBody } from "../../components/ui/modal-body";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../components/ui/dialog";

export function TeamAccessDialog({ title, tenantName, open, onClose, busy = false, restoreFocus, children }: {
  title: string; tenantName: string; open: boolean; onClose: () => void; busy?: boolean;
  restoreFocus?: () => void; children: ReactNode;
}) {
  return <Dialog modal open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent className="team-access kit-surface kit-modal ta-dialog" showCloseButton={false}
      onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
      onInteractOutside={event => event.preventDefault()}
      onCloseAutoFocus={event => { if (restoreFocus) { event.preventDefault(); restoreFocus(); } }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>Estudio: {tenantName}</DialogDescription>
      <ModalBody>{children}</ModalBody>
    </DialogContent>
  </Dialog>;
}
