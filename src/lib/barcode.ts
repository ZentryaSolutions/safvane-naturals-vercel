import JsBarcode from "jsbarcode";

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  options?: { height?: number; width?: number }
) {
  JsBarcode(canvas, value, {
    format: "CODE128",
    width: options?.width ?? 2,
    height: options?.height ?? 72,
    displayValue: true,
    fontSize: 14,
    margin: 12,
    background: "#ffffff",
    lineColor: "#000000",
  });
}

export function downloadBarcodePng(sku: string, filename: string) {
  const canvas = document.createElement("canvas");
  renderBarcodeToCanvas(canvas, sku);
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function barcodeDataUrl(sku: string, height = 56): string {
  const canvas = document.createElement("canvas");
  renderBarcodeToCanvas(canvas, sku, { height, width: 1.5 });
  return canvas.toDataURL("image/png");
}
