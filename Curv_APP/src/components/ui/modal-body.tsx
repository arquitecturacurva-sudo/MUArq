import { useEffect, useRef, type ComponentProps } from "react";
import { registerModalBackground } from "./modal-inert";

// Mount inside a modal DialogContent/DrawerContent. Unmount before restoring focus.
export function ModalBody({ children, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) return registerModalBackground(ref.current);
  }, []);
  return <div {...props} ref={ref}>{children}</div>;
}
