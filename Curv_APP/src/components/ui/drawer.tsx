import type { ComponentProps } from "react";
import { Dialog, DialogContent } from "./dialog";
import { ModalBody } from "./modal-body";
import { cn } from "../../lib/utils";

// A side presentation of the existing modal primitive, not another focus trap.
export function Drawer(props: Omit<ComponentProps<typeof Dialog>, "modal">) {
  return <Dialog {...props} modal />;
}
export function DrawerContent({ className, children, ...props }: Omit<ComponentProps<typeof DialogContent>, "forceMount">) {
  return <DialogContent {...props} className={cn("kit-drawer kit-surface", className)}>
    <ModalBody className="kit-drawer__body">{children}</ModalBody>
  </DialogContent>;
}
export {
  DialogTrigger as DrawerTrigger, DialogClose as DrawerClose,
  DialogTitle as DrawerTitle, DialogDescription as DrawerDescription,
  DialogHeader as DrawerHeader, DialogFooter as DrawerFooter,
} from "./dialog";
