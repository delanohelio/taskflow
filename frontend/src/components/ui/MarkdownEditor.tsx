import React, { useRef, useState } from "react";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Link2,
  Eye,
  Edit3,
  X,
  Check,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Escreva sua descrição em Markdown...",
  minHeight = "160px",
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to wrap or insert text around current selection
  const insertFormatting = (prefix: string, suffix: string = "", defaultPlaceholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const contentToInsert = selected || defaultPlaceholder;

    const nextValue =
      value.substring(0, start) + prefix + contentToInsert + suffix + value.substring(end);

    onChange(nextValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorStart = start + prefix.length;
      const newCursorEnd = newCursorStart + contentToInsert.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 10);
  };

  // Helper to insert prefix at start of lines (for lists, headers, quotes)
  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the start of the line
    const lastNewline = value.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const nextValue =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  // Open Link Modal
  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    const selected = textarea
      ? value.substring(textarea.selectionStart, textarea.selectionEnd)
      : "";
    setLinkText(selected);
    setLinkUrl("");
    setShowLinkModal(true);
  };

  // Confirm Link insertion
  const handleConfirmLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith("/") && !formattedUrl.startsWith("#")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const textToUse = linkText.trim() || formattedUrl;
    const markdownLink = `[${textToUse}](${formattedUrl})`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = value.substring(0, start) + markdownLink + value.substring(end);
      onChange(nextValue);
      setTimeout(() => {
        textarea.focus();
        const newPos = start + markdownLink.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 10);
    } else {
      onChange(value ? `${value} ${markdownLink}` : markdownLink);
    }

    setShowLinkModal(false);
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormatting("**", "**", "texto em negrito");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormatting("*", "*", "texto em itálico");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      handleOpenLinkModal();
    }
  };

  return (
    <div className="relative rounded-2xl border border-surface-200 bg-white shadow-2xs overflow-hidden transition-all focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15">
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-surface-150 bg-surface-50/80 px-2 py-1.5 backdrop-blur-xs">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertFormatting("**", "**", "texto em negrito")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Negrito (Ctrl+B)"
            aria-label="Negrito"
          >
            <Bold className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting("*", "*", "texto em itálico")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Itálico (Ctrl+I)"
            aria-label="Itálico"
          >
            <Italic className="h-4 w-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-surface-300" />

          <button
            type="button"
            onClick={() => insertLinePrefix("## ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Título Médio (H2)"
            aria-label="Título H2"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix("### ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Título Pequeno (H3)"
            aria-label="Título H3"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-surface-300" />

          <button
            type="button"
            onClick={() => insertLinePrefix("- ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Lista com marcadores"
            aria-label="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix("1. ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Lista numerada"
            aria-label="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix("- [ ] ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Checklist de tarefas"
            aria-label="Checklist de tarefas"
          >
            <CheckSquare className="h-4 w-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-surface-300" />

          <button
            type="button"
            onClick={() => insertFormatting("`", "`", "código")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Código inline (`código`)"
            aria-label="Código"
          >
            <Code className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => insertLinePrefix("> ")}
            disabled={tab === "preview"}
            className="rounded-lg p-1.5 text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors disabled:opacity-40 cursor-pointer"
            title="Citação"
            aria-label="Citação"
          >
            <Quote className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenLinkModal}
            disabled={tab === "preview"}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors disabled:opacity-40 cursor-pointer"
            title="Inserir Link (Ctrl+K)"
            aria-label="Inserir Link"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Link</span>
          </button>
        </div>

        {/* Tab switch (Write vs Preview) */}
        <div className="flex items-center rounded-xl bg-surface-200/80 p-0.5 border border-surface-200 shrink-0">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              tab === "write"
                ? "bg-white text-surface-900 shadow-2xs"
                : "text-surface-500 hover:text-surface-800"
            }`}
          >
            <Edit3 className="h-3 w-3" />
            <span>Escrever</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              tab === "preview"
                ? "bg-white text-brand-700 shadow-2xs"
                : "text-surface-500 hover:text-surface-800"
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        {tab === "write" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full resize-y p-3.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none font-sans leading-relaxed"
          />
        ) : (
          <div
            style={{ minHeight }}
            className="p-4 overflow-y-auto bg-surface-50/40 text-sm"
          >
            {value.trim() ? (
              <div
                className="prose max-w-none text-surface-800"
                dangerouslySetInnerHTML={{ __html: marked.parse(value) as string }}
              />
            ) : (
              <p className="text-xs italic text-surface-400">Nenhum conteúdo para visualizar ainda.</p>
            )}
          </div>
        )}
      </div>

      {/* Link Creation Modal Popover */}
      {showLinkModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-900/30 backdrop-blur-2xs p-3">
          <form
            onSubmit={handleConfirmLink}
            className="w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-4 shadow-xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-100">
              <span className="text-xs font-bold text-surface-800 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-brand-600" />
                Inserir Link
              </span>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                  Texto exibido
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex: Documentação, Guia do Projeto"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                  Endereço URL (link)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com ou /tarefas"
                  required
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-xl border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-600 hover:bg-surface-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700 shadow-2xs transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Inserir
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
