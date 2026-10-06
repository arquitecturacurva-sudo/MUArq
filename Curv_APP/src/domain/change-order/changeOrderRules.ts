export const CHANGE_ORDER_CONDITIONS = [
  "Esta orden de cambio modifica exclusivamente los puntos aquí indicados y mantiene vigentes las demás condiciones de la cotización o contrato base.",
  "Cualquier trabajo adicional no descrito en este formato deberá evaluarse y formalizarse mediante una nueva orden de cambio.",
  "Los plazos actualizados se contabilizan desde la aprobación de esta orden y desde la disponibilidad de la información o pagos requeridos.",
  "La ejecución del cambio queda sujeta a la aprobación expresa del cliente.",
] as const;

export function hasChangeOrderContent(client: string, project: string, description: string, affectedDocuments: string) {
  return [client, project, description, affectedDocuments].some((value) => value.trim().length > 0);
}

export function formatChangeOrderAmount(value: string, symbol: string, fallback: "zero" | "dash") {
  return value ? `${symbol} ${value}` : fallback === "zero" ? `${symbol} 0.00` : "—";
}
