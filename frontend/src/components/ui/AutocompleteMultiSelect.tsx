import React, { useState, useRef, useEffect } from "react";
import { Search, X, User as UserIcon, Users, Check } from "lucide-react";

export interface AutocompleteOption {
  id: number | string;
  label: string;
  sublabel?: string;
  badge?: string;
  type?: "user" | "group";
}

interface AutocompleteMultiSelectProps {
  options: AutocompleteOption[];
  selectedIds: (number | string)[];
  onChange: (newSelectedIds: any[]) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
}

export function AutocompleteMultiSelect({
  options,
  selectedIds,
  onChange,
  label,
  placeholder = "Digite um nome ou grupo para buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
}: AutocompleteMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));
  const unselectedOptions = options.filter((opt) => !selectedIds.includes(opt.id));

  const filteredOptions = query.trim()
    ? unselectedOptions.filter((opt) => {
        const q = query.toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
        );
      })
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: number | string) => {
    onChange([...selectedIds, id]);
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (id: number | string) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-surface-700">{label}</label>}

      {/* Selected Chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
                opt.type === "group"
                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                  : "bg-surface-100 text-surface-800 border border-surface-200"
              }`}
            >
              {opt.type === "group" ? (
                <Users className="h-3.5 w-3.5 text-purple-600" />
              ) : (
                <UserIcon className="h-3.5 w-3.5 text-surface-500" />
              )}
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/70 text-surface-600 border border-surface-200/50">
                  {opt.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(opt.id)}
                className="rounded-full p-0.5 hover:bg-black/10 text-surface-400 hover:text-surface-700 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-surface-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-surface-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 rounded-full p-1 text-surface-400 hover:text-surface-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-2xl border border-surface-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-surface-400">{emptyMessage}</div>
            ) : (
              <div className="space-y-0.5">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          opt.type === "group" ? "bg-purple-100 text-purple-700" : "bg-surface-100 text-surface-600"
                        }`}
                      >
                        {opt.type === "group" ? <Users className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-surface-900 truncate">{opt.label}</div>
                        {opt.sublabel && <div className="text-xs text-surface-400 truncate">{opt.sublabel}</div>}
                      </div>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
