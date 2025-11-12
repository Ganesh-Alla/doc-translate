import mammoth from "mammoth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = "";

    // Extract text based on file type
    if (fileName.endsWith(".pdf")) {
      // Dynamic import for pdf-parse to handle ESM compatibility
      const pdfParseModule = await import("pdf-parse");
      // pdf-parse exports the function directly
      const pdfParse = pdfParseModule as unknown as (buffer: Buffer) => Promise<{ text: string }>;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text found in the document" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, fileName: file.name });
  } catch (error) {
    console.error("Error extracting text:", error);
    return NextResponse.json(
      { error: "Failed to extract text from document" },
      { status: 500 }
    );
  }
}

