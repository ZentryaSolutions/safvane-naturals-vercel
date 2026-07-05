import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function printInvoiceElement(
  element: HTMLElement,
  orderNumber: string
): Promise<{ error?: string }> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      pdf.addPage();
      position = margin - (imgHeight - heightLeft);
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.setProperties({ title: `${orderNumber} — Invoice` });
    pdf.autoPrint();

    const blobUrl = pdf.output("bloburl");
    const printWindow = window.open(blobUrl, "_blank");

    if (!printWindow) {
      pdf.save(`${orderNumber}-invoice.pdf`);
      return {
        error: "Pop-up blocked. Invoice downloaded as PDF — open it to print.",
      };
    }

    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not generate invoice PDF",
    };
  }
}
