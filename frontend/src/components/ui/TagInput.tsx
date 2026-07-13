/** Custom tag input with dropdown suggestions and chip display. */

import { useState, useRef, useEffect } from "react";
import { X, Tag } from "lucide-react";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  availableTags?: string[];
  placeholder?: string;
}

export default function TagInput({
  tags,
  setTags,
  availableTags = [],
  placeholder = "Adicionar tag...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions: availableTags not yet added, filtered by input
  const suggestions = availableTags.filter(
    (tag) =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInputValue("");
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
      else if (suggestions.length > 0) addTag(suggestions[0]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Input area with chips */}
      <div
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-3 py-2 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Tag className="h-3.5 w-3.5 flex-shrink-0 text-surface-400" />

        {/* Chips */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-100 pl-2.5 pr-1.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-300 hover:text-brand-900"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-surface-700 placeholder:text-surface-400 outline-none"
        />
      </div>

      {/* Dropdown suggestions */}
      {isOpen && (inputValue.trim() || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-surface-200 bg-white shadow-lg">
          {/* Create new tag option */}
          {inputValue.trim() && !tags.includes(inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(inputValue);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-brand-50"
            >
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                + "{inputValue.trim().toLowerCase()}"
              </span>
              <span className="text-xs text-surface-400">Criar nova tag</span>
            </button>
          )}

          {/* Existing tag suggestions */}
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(tag);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-50"
            >
              <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600">
                {tag}
              </span>
            </button>
          ))}

          {suggestions.length === 0 && !inputValue.trim() && (
            <p className="px-3 py-3 text-xs text-surface-400 italic">
              Nenhuma tag disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}
