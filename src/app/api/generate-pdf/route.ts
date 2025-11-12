import { type NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(request: NextRequest) {
  try {
    const { text, fileName } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();

    // Embed a font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Set up text parameters
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;
    const maxWidth = width - 2 * margin;
    const startY = height - margin;

    // Split text into lines that fit the page width
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw the text
    let currentPage = page;
    let y = startY;
    for (const line of lines) {
      if (y < margin + lineHeight) {
        // Add a new page if we run out of space
        currentPage = pdfDoc.addPage([595, 842]);
        y = height - margin;
      }
      currentPage.drawText(line, {
        x: margin,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Return the PDF as a response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || "translated"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

