import { translate } from "@vitalets/google-translate-api";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, sourceLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    // Split text into chunks if it's too long (Google Translate has limits)
    const maxChunkLength = 5000;
    const chunks = [];
    for (let i = 0; i < text.length; i += maxChunkLength) {
      chunks.push(text.slice(i, i + maxChunkLength));
    }

    // Translate each chunk
    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const result = await translate(chunk, {
            to: targetLang,
            from: sourceLang || "auto",
          });
          return result.text || chunk;
        } catch (error) {
          console.error("Translation error for chunk:", error);
          // Fallback: return original chunk if translation fails
          return chunk;
        }
      })
    );

    const translatedText = translatedChunks.join("");

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Error translating text:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
