/**
 * The in-app UI kit — a thin barrel over the shadcn components in `src/components/ui`,
 * which are installed and updated with `npx shadcn@latest add|diff`.
 *
 * Rules this kit encodes:
 * - Two button roles: `default` (solid, primary) and `outline` (secondary). `ghost` is
 *   for icon-only and toolbar affordances; `brand` is the single gold CTA per surface;
 *   `destructive` is for destructive actions only.
 * - One `Pill` for every status/metadata chip, coloured by `tone` rather than by a
 *   bespoke border/background per usage. Status reads as colour first, text second.
 * - Exactly two font sizes; the Tailwind scale is collapsed in styles/kit.css so
 *   `text-xs`/`text-sm` and `text-base`/`text-lg` cannot introduce a third.
 * - No breadcrumbs.
 *
 * Compose these primitives (Card + Field + Button) instead of writing custom UI.
 */
export { Button, buttonVariants } from "@/components/ui/button";
export { Badge, badgeVariants } from "@/components/ui/badge";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export { Separator } from "@/components/ui/separator";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export { Pill, StatusDot, type PillProps, type PillTone, type StatusDotProps } from "./pill";
export { StepNav, type StepNavProps } from "./stepNav";
