"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type Language = {
  code: string;
  name: string;
};

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "mr", name: "Marathi" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "cs", name: "Czech" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "he", name: "Hebrew" },
  { code: "uk", name: "Ukrainian" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>("te");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (selectedFile: File): boolean => {
    const ext = selectedFile.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setError("Please select a PDF, DOCX, or TXT file");
      return false;
    }
    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setError("");
      setOriginalText("");
      setTranslatedText("");
      setFileName(selectedFile.name);
      setFileType(selectedFile.name.toLowerCase().split(".").pop() || "");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    []
  );

  const extractText = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsExtracting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text");
      }

      setOriginalText(data.text);
      setFileName(data.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setIsExtracting(false);
    }
  };

  const translateText = async () => {
    if (!originalText.trim()) {
      setError("Please extract text from a document first");
      return;
    }

    setIsTranslating(true);
    setError("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to translate text");
      }

      setTranslatedText(data.translatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to translate text");
    } finally {
      setIsTranslating(false);
    }
  };

  const downloadTranslated = async (format: "txt" | "pdf" = "txt") => {
    if (!translatedText) return;

    if (format === "txt") {
      const blob = new Blob([translatedText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `translated_${fileName.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      setIsGeneratingPDF(true);
      try {
        const response = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: translatedText,
            fileName: fileName.replace(/\.[^/.]+$/, ""),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `translated_${fileName.replace(/\.[^/.]+$/, "")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate PDF");
      } finally {
        setIsGeneratingPDF(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/globe.svg"
              alt="Globe"
              width={40}
              height={40}
              className="dark:invert"
            />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Document Translator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Translate PDF, DOCX, and TXT documents for free
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* File Upload Section with Dropzone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Step 1: Upload Document
          </h2>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Image
                  src="/file.svg"
                  alt="File"
                  width={48}
                  height={48}
                  className="dark:invert opacity-70"
                />
              </div>
              {file ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Supported formats: PDF, DOCX, TXT
                  </p>
                </div>
              )}
            </label>
            {file && (
              <button
                onClick={extractText}
                disabled={isExtracting}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isExtracting ? "Extracting..." : "Extract Text"}
              </button>
            )}
          </div>
        </div>

        {/* Translation Section */}
        {(originalText || translatedText) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Step 2: Translate
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={translateText}
              disabled={isTranslating || !originalText}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {isTranslating ? "Translating..." : "Translate"}
            </button>
          </div>
        )}

        {/* Text Display Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Text */}
          {originalText && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Original Text
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {originalText.length} characters
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
                  {originalText}
                </p>
              </div>
            </div>
          )}

          {/* Translated Text */}
          {translatedText && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Translated Text
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {translatedText.length} characters
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
                  {translatedText}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadTranslated("txt")}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Download TXT
                </button>
                <button
                  onClick={() => downloadTranslated("pdf")}
                  disabled={isGeneratingPDF}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingPDF ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Powered by{" "}
            <a
              href="https://github.com/vitalets/google-translate-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Google Translate API
            </a>
            {" "}— Free unofficial Google Translate API
          </p>
        </div>
      </div>
    </div>
  );
}
