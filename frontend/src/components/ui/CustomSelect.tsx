import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string = string> {
  options: CustomSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dropdownPosition?: "auto" | "down" | "up";
}

export function CustomSelect<T extends string = string>({
  options,
  value,
  onChange,
  label,
  placeholder = "Selecione uma opção...",
  className = "",
  disabled = false,
  dropdownPosition = "auto",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && dropdownPosition !== "down") {
      if (dropdownPosition === "up") {
        setOpenUp(true);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUp(spaceBelow < 220);
      }
    } else {
      setOpenUp(false);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-surface-700 mb-1">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-sm text-surface-900 transition-all hover:border-surface-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none ${
          disabled ? "opacity-60 cursor-not-allowed bg-surface-50" : "cursor-pointer"
        }`}
      >
        <span className="flex items-center gap-2 font-medium truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : <span className="text-surface-400">{placeholder}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-surface-400 transition-transform ${isOpen ? "rotate-180 text-purple-600" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-full rounded-2xl border border-surface-200 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 min-w-[140px] ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    isSelected ? "bg-purple-50 text-purple-900 font-semibold" : "hover:bg-surface-50 text-surface-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && <span className={isSelected ? "text-purple-600" : "text-surface-400"}>{opt.icon}</span>}
                    <div>
                      <div className="truncate">{opt.label}</div>
                      {opt.description && <div className="text-xs text-surface-400 font-normal">{opt.description}</div>}
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
