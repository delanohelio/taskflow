/** Settings modal for configuring app behavior. */

import { useEffect, useState } from "react";
import { X, Settings, Archive, Clock, Check, AlertCircle } from "lucide-react";
import * as api from "@/services/api";

interface SettingsModalProps {
  onClose: () => void;
  onArchiveDone: () => void; // refresh board after archiving
}

export default function SettingsModal({ onClose, onArchiveDone }: SettingsModalProps) {
  const [autoArchiveMinutes, setAutoArchiveMinutes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [archivedCount, setArchivedCount] = useState<number | null>(null);

  useEffect(() => {
    api.fetchSettings().then((s) => {
      setAutoArchiveMinutes(s.auto_archive_minutes != null ? String(s.auto_archive_minutes) : "");
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSavedOk(false);
    try {
      const minutes = autoArchiveMinutes.trim() === "" ? null : parseInt(autoArchiveMinutes, 10);
      await api.updateSettings({ auto_archive_minutes: minutes ?? undefined });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveAll() {
    if (!window.confirm("Arquivar TODAS as tarefas concluídas agora? Esta ação não pode ser desfeita.")) return;
    setArchiving(true);
    setArchivedCount(null);
    try {
      const result = await api.archiveAllDone();
      setArchivedCount(result.archived);
      onArchiveDone();
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
              <Settings className="h-4 w-4 text-brand-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-surface-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Auto-archive setting */}
            <div className="rounded-xl border border-surface-200 p-4">
              <div className="mb-3 flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div>
                  <h3 className="text-sm font-semibold text-surface-800">Auto-Arquivamento</h3>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Tarefas concluídas serão arquivadas automaticamente após o período configurado.
                    Deixe em branco para desativar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="525600"
                  value={autoArchiveMinutes}
                  onChange={(e) => setAutoArchiveMinutes(e.target.value)}
                  placeholder="Ex: 1440 (24 horas)"
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <span className="flex-shrink-0 text-sm text-surface-500">minutos</span>
              </div>
              {autoArchiveMinutes && (
                <p className="mt-2 text-xs text-surface-400">
                  ≈ {Number(autoArchiveMinutes) >= 1440
                    ? `${(Number(autoArchiveMinutes) / 1440).toFixed(1)} dia(s)`
                    : Number(autoArchiveMinutes) >= 60
                    ? `${(Number(autoArchiveMinutes) / 60).toFixed(1)} hora(s)`
                    : `${autoArchiveMinutes} minuto(s)`}
                </p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-60"
            >
              {savedOk ? (
                <><Check className="h-4 w-4" /> Salvo!</>
              ) : saving ? (
                "Salvando..."
              ) : (
                "Salvar Configurações"
              )}
            </button>

            <hr className="border-surface-100" />

            {/* Archive all done */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Arquivar Todas as Concluídas</h3>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Arquiva imediatamente todas as tarefas com status <strong>Concluído</strong>,
                    independente do tempo.
                  </p>
                </div>
              </div>
              {archivedCount != null && (
                <div className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                  ✓ {archivedCount} tarefa(s) arquivada(s) com sucesso!
                </div>
              )}
              <button
                onClick={handleArchiveAll}
                disabled={archiving}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-60"
              >
                <Archive className="h-4 w-4" />
                {archiving ? "Arquivando..." : "Arquivar Todas Agora"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
