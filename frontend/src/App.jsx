import { useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function App() {
  const fileInput = useRef(null);
  const [filename, setFilename] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  async function uploadPdf(file) {
    if (!file) return;

    setError("");
    setPdfText("");
    setQuestion("");
    setAnswer("");
    setAskError("");

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setFilename("");
      setError("Choose a PDF file to continue.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFilename("");
      setError("This PDF is larger than 10 MB. Choose a smaller file.");
      return;
    }

    setFilename(file.name);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/api/extract`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(result.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result.detail;
        throw new Error(detail || "The PDF could not be processed.");
      }
      setPdfText(result.text);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Could not reach the API. Check that the backend is running."
          : requestError.message,
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function askQuestion(event) {
    event.preventDefault();
    const questionText = question.trim();
    if (!questionText || !pdfText) return;

    setAskError("");
    setAnswer("");
    setIsAsking(true);
    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText, question: questionText }),
      });
      const result = await response.json();
      if (!response.ok) {
        const detail = Array.isArray(result.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result.detail;
        throw new Error(detail || "The question could not be answered.");
      }
      setAnswer(result.answer);
    } catch (requestError) {
      setAskError(
        requestError instanceof TypeError
          ? "Could not reach the API. Check that the backend is running."
          : requestError.message,
      );
    } finally {
      setIsAsking(false);
    }
  }

  function handleFileSelection(event) {
    uploadPdf(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    uploadPdf(event.dataTransfer.files?.[0]);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3.75h6l5 5v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 4v5h5M9 14h6M9 17h6"
              />
            </svg>
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Paperwise
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Make your PDFs easier to read
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Upload a document to extract its text. Your file is processed locally
            by the application.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
              isDragging
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-300 bg-slate-50/70"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4.75 15.5v3.75a1 1 0 0 0 1 1h12.5a1 1 0 0 0 1-1V15.5"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Drop your PDF here</h2>
            <p className="mt-1 text-sm text-slate-500">
              PDF files only, up to 10 MB
            </p>
            <button
              className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={isExtracting}
            >
              {isExtracting ? "Reading PDF..." : "Choose a PDF"}
            </button>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelection}
              aria-label="Choose a PDF file"
            />
          </div>

          {filename && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                PDF
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {filename}
              </span>
              {isExtracting && (
                <span
                  aria-label="Extracting text"
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent"
                />
              )}
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}
        </section>

        {pdfText && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Extracted text</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Text extracted from {filename}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Ready
              </span>
            </div>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 sm:p-6">
              {pdfText}
            </pre>

            <form className="mt-6 border-t border-slate-200 pt-6" onSubmit={askQuestion}>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="pdf-question"
              >
                Ask a question about this PDF
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="pdf-question"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
                  type="text"
                  maxLength={1000}
                  placeholder="For example: What are the main findings?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  disabled={isAsking}
                />
                <button
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isAsking || !question.trim()}
                >
                  {isAsking ? "Thinking..." : "Ask AI"}
                </button>
              </div>
              {askError && (
                <div
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {askError}
                </div>
              )}
              {isAsking && (
                <p className="mt-4 text-sm text-slate-500" role="status">
                  Asking your local AI model...
                </p>
              )}
              {answer && (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-5">
                  <h3 className="text-sm font-semibold text-emerald-950">
                    Answer
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-950">
                    {answer}
                  </p>
                </div>
              )}
            </form>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-slate-500">
          PDF files are processed by your local backend and are not saved.
        </footer>
      </div>
    </main>
  );
}

export default App;
