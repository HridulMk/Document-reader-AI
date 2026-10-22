"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Doc = { id: string; name: string; chunks: number; uploaded_at?: string };
type Source = { index: number; document: string; page: number; similarity: number; excerpt: string };
type Message = { role: "assistant" | "user"; text: string; sources?: Source[] };

const starterQuestions = [
  "Summarize the key points in my documents",
  "What are the main risks or limitations mentioned?",
  "List important dates, numbers, and decisions",
];

export default function Home() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I’m KnowBase AI. Upload a PDF, DOCX, or TXT file, then ask me anything about its contents. I’ll cite the passages I use." },
  ]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  async function refreshDocuments() {
    try {
      const response = await fetch(`${API}/api/documents`);
      if (!response.ok) throw new Error("Could not load documents");
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch {
      setError("Can't reach the API. Start the FastAPI server on port 8000.");
    }
  }

  useEffect(() => { void refreshDocuments(); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(`${API}/api/documents/upload`, { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || `Failed to upload ${file.name}`);
      }
      await refreshDocuments();
      setMessages((old) => [...old, { role: "assistant", text: `${files.length} document${files.length > 1 ? "s" : ""} indexed successfully. Ask a question to get started.` }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function askQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!documents.length) {
      setError("Upload a document before asking a question.");
      return;
    }
    setQuestion("");
    setError("");
    setMessages((old) => [...old, { role: "user", text: trimmed }]);
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, top_k: 5 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Question failed.");
      setMessages((old) => [...old, { role: "assistant", text: data.answer, sources: data.sources || [] }]);
    } catch (e) {
      setMessages((old) => [...old, { role: "assistant", text: `I couldn't complete that request: ${e instanceof Error ? e.message : "Unknown error"}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(doc: Doc) {
    if (!window.confirm(`Delete "${doc.name}" and its indexed chunks?`)) return;
    try {
      const response = await fetch(`${API}/api/documents/${doc.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Delete failed");
      await refreshDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askQuestion(question);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">K</span><span>knowbase<span className="brand-ai">.ai</span></span></a>
        <div className="topbar-right"><span className="status-dot" /> Local workspace <span className="avatar">H</span></div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="side-heading"><div><p className="eyebrow">WORKSPACE</p><h2>Your knowledge</h2></div><span className="count">{documents.length}</span></div>
          <button className="upload-button" onClick={() => fileInput.current?.click()} disabled={uploading}>
            <span className="plus-icon">{uploading ? "…" : "+"}</span>{uploading ? "Indexing documents…" : "Add documents"}
          </button>
          <input ref={fileInput} className="hidden-input" type="file" accept=".pdf,.docx,.txt" multiple onChange={uploadFiles} />
          <p className="helper">PDF, DOCX or TXT · Up to 15 MB each</p>

          <div className="section-label">LIBRARY <span>{documents.length} FILES</span></div>
          <div className="document-list">
            {documents.length === 0 ? <div className="empty-library"><div className="empty-icon">▤</div><p>No documents yet</p><span>Upload a file to build your knowledge base.</span></div> :
              documents.map((doc) => <div className="document-item" key={doc.id}>
                <div className="file-icon">{doc.name.toLowerCase().endsWith(".pdf") ? "PDF" : doc.name.toLowerCase().endsWith(".docx") ? "DOC" : "TXT"}</div>
                <div className="doc-info"><strong title={doc.name}>{doc.name}</strong><span>{doc.chunks} searchable chunks</span></div>
                <button className="delete-button" title={`Delete ${doc.name}`} onClick={() => void deleteDocument(doc)}>×</button>
              </div>)}
          </div>
          <div className="sidebar-bottom"><div className="privacy-icon">⌑</div><div><strong>Your documents, your answers</strong><p>Responses are grounded in retrieved document passages.</p></div></div>
        </aside>

        <section className="main-panel">
          <div className="welcome-header">
            <div className="sparkle">✳</div>
            <p className="eyebrow">YOUR AI KNOWLEDGE ASSISTANT</p>
            <h1>Every document.<br /><span>One conversation.</span></h1>
            <p className="welcome-subtitle">Ask questions, connect ideas, and find the details that matter — with answers sourced from your own files.</p>
            <div className="feature-pills"><span>✧ Retrieval augmented generation</span><span>⌁ Source citations</span><span>◈ Semantic search</span></div>
          </div>

          <div className="chat-area">
            {messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${index}-${message.role}`}>
              <div className={`message-avatar ${message.role}`}>{message.role === "assistant" ? "✳" : "H"}</div>
              <div className="message-content">
                <div className="message-author">{message.role === "assistant" ? "KnowBase AI" : "You"} <span>{message.role === "assistant" ? "· AI assistant" : "· Just now"}</span></div>
                <div className="message-text">{message.text}</div>
                {!!message.sources?.length && <div className="sources"><div className="sources-title">SOURCES USED <span>{message.sources.length}</span></div>
                  {message.sources.map((source) => <details className="source-card" key={`${index}-${source.index}`}>
                    <summary><span className="source-number">{source.index}</span><span className="source-name">{source.document}<small>Page {source.page} · Match {(source.similarity * 100).toFixed(0)}%</small></span><span className="chevron">⌄</span></summary>
                    <p>{source.excerpt}</p>
                  </details>)}
                </div>}
              </div>
            </div>)}
            {busy && <div className="message-row assistant"><div className="message-avatar assistant">✳</div><div className="message-content"><div className="message-author">KnowBase AI <span>· searching your documents</span></div><div className="typing"><i /><i /><i /></div></div></div>}
            <div ref={chatEnd} />
          </div>

          {messages.length < 3 && <div className="suggestions"><p>TRY ASKING</p>{starterQuestions.map((item) => <button key={item} onClick={() => void askQuestion(item)} disabled={!documents.length || busy}>{item}<span>↗</span></button>)}</div>}

          {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
          <form className="composer" onSubmit={submit}>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void askQuestion(question); } }} placeholder={documents.length ? "Ask a question about your documents…" : "Upload a document to start asking questions…"} rows={2} disabled={!documents.length || busy} />
            <div className="composer-footer"><span><span className="key-hint">↵</span> to send · Shift + Enter for new line</span><button className="send-button" type="submit" disabled={!question.trim() || busy || !documents.length}>{busy ? "Thinking…" : "Ask AI"} <span>↑</span></button></div>
          </form>
          <p className="disclaimer">AI can make mistakes. Verify important information against the original document.</p>
        </section>
      </div>
    </main>
  );
}
