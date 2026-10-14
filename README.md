# Paperwise PDF Reader

A small local application that extracts text from PDFs and answers questions
using an Ollama model running on your computer. Uploaded PDFs are read in
memory and are not saved by the backend.

## Requirements

- Python 3.10 or newer
- Node.js 20.19 or newer, or 22.12 or newer
- [Ollama](https://ollama.com/) for question answering

## Install

From the project root, create a Python virtual environment and install the
backend packages:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Install the frontend packages:

```powershell
Set-Location frontend
npm.cmd install
Set-Location ..
```

Download the default small model:

```powershell
ollama pull llama3.2:3b
```

## Run

Start the backend from the project root:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Start Ollama if it is not already running. In a second terminal, start the
frontend:

```powershell
Set-Location frontend
npm.cmd run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`).

### Ollama settings

The backend defaults to model `llama3.2:3b` and Ollama at
`http://127.0.0.1:11434`. Override either setting in the backend terminal
before starting FastAPI:

```powershell
$env:OLLAMA_MODEL = "your-installed-model"
$env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
```

To use a different API origin for the frontend, set `VITE_API_URL` before
starting Vite, for example:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000"
npm.cmd run dev
```

## How it works

1. React checks that the selected file is a PDF no larger than 10 MB and posts
   it to `POST /api/extract`.
2. FastAPI checks the upload and uses PyMuPDF to extract its page text. The
   filename and extracted text are returned to the browser; the PDF itself is
   not written to disk.
3. The browser displays the extracted text and sends the question plus that
   text to `POST /api/ask`.
4. FastAPI splits the text into overlapping chunks, selects up to four chunks
   with words matching the question, and sends only those excerpts to Ollama.
5. Ollama's answer is returned to the browser.

Scanned PDFs that contain only images are not OCR-processed. Question answering
requires Ollama to be running and the configured model to be installed.

## API

- `GET /api/health` reports whether the FastAPI application is running.
- `POST /api/extract` accepts a multipart form field named `file` and returns
  the filename and extracted text.
- `POST /api/ask` accepts JSON with `text` and `question` fields and returns an
  `answer`. Ollama connection errors and missing models are reported clearly.
