import { Button as KitButton } from "../../components/ui/button";
import { lb, si } from "./tokens";
import type { BtnProps, BtnVariant, FldProps, InpProps, SelProps } from "./form-primitives.types";

// Legacy compatibility API; new forms use components/ui directly.
export const Fld = ({label,children}: FldProps) => <div style={{marginBottom:12,minWidth:0}}><label style={lb}>{label}</label>{children}</div>;
export const Inp = ({value,onChange,type="text",placeholder,min}: InpProps) => <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} className="kit-focus" style={si}/>;
export const Sel = ({value,onChange,options}: SelProps) => <select value={value} onChange={e=>onChange(e.target.value)} className="kit-focus" style={{...si,appearance:"none"}}>{options.map(o=><option key={o}>{o}</option>)}</select>;
/**
 * Legacy button API kept as a facade over the shadcn <Button>, so the ~100 existing
 * `Btn` call sites across the nine tools pick up the standard control without edits.
 * New code should import Button from features/ui/kit directly.
 */
const BTN_VARIANT: Record<BtnVariant, "default" | "outline" | "brand"> = {
  dk: "default",
  ol: "outline",
  gd: "brand",
};
export const Btn = ({children,onClick,v="dk",sm,...rest}: BtnProps) => (
  <KitButton variant={BTN_VARIANT[v]} size={sm ? "sm" : "default"} onClick={onClick} {...rest}>
    {children}
  </KitButton>
);

export { InlineEmptyStateCard } from "./legacy-empty-state";
export type { BtnProps, BtnVariant, FldProps, InpProps, SelProps, InlineEmptyStateCardProps } from "./form-primitives.types";
