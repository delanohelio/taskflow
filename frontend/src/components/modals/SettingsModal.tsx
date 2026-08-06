import { useEffect, useState } from "react";
import { X, Settings, Archive, Clock, Check, AlertCircle, Download, Upload, Database, User as UserIcon, Lock, Mail, Save } from "lucide-react";
import * as api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface SettingsModalProps {
  onClose: () => void;
  onArchiveDone: () => void;
}

type TabType = "profile" | "preferences" | "backup";

export default function SettingsModal({ onClose, onArchiveDone }: SettingsModalProps) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Preferences form state
  const [autoArchiveMinutes, setAutoArchiveMinutes] = useState<string>("");
  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Backup & Restore states
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archivedCount, setArchivedCount] = useState<number | null>(null);

  useEffect(() => {
    api.fetchUserPersonalSettings().then((s) => {
      setAutoArchiveMinutes(s.auto_archive_minutes != null ? String(s.auto_archive_minutes) : "");
      setPrefLoading(false);
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await api.updateProfile({
        full_name: fullName.trim() || undefined,
        email: email.trim() || null,
        password: password.trim() || undefined,
      });
      await refreshUser();
      setPassword("");
      setProfileSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(api.parseApiError(err, "Erro ao atualizar perfil."));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePreferences() {
    setPrefSaving(true);
    setPrefSuccess(false);
    try {
      const minutes = autoArchiveMinutes.trim() === "" ? null : parseInt(autoArchiveMinutes, 10);
      await api.updateUserPersonalSettings({ auto_archive_minutes: minutes });
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 2500);
    } finally {
      setPrefSaving(false);
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

  async function handleExportBackup() {
    setExporting(true);
    setImportSuccess(null);
    setImportError(null);
    try {
      await api.exportBackup();
    } catch {
      setImportError("Erro ao exportar o arquivo de backup.");
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Importar um backup substituirá TODAS as suas tarefas atuais. Deseja continuar?")) {

      e.target.value = "";
      return;
    }

    setImporting(true);
    setImportSuccess(null);
    setImportError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const res = await api.importBackup(jsonData);
      setImportSuccess(`${res.imported_count} tarefas restauradas com sucesso!`);
      onArchiveDone();
      const newSettings = await api.fetchUserPersonalSettings();
      setAutoArchiveMinutes(newSettings.auto_archive_minutes != null ? String(newSettings.auto_archive_minutes) : "");
    } catch (err: any) {
      setImportError(api.parseApiError(err, "Falha na importação do backup."));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content w-full max-w-lg rounded-3xl border border-surface-200 bg-white p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Configurações do Usuário</h2>
              <p className="text-xs text-surface-500">Gerencie seu perfil, preferências e backups.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-surface-100 text-surface-400 hover:text-surface-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-surface-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profile" ? "bg-white text-purple-700 shadow-2xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Meu Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "preferences" ? "bg-white text-purple-700 shadow-2xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Preferências
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "backup" ? "bg-white text-purple-700 shadow-2xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Backup & Dados
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">E-mail (opcional)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1">Alterar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
              <span className="text-[11px] text-surface-400 mt-1 block">Preencha apenas se desejar mudar a senha</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {profileSaving ? "Salvando Perfil..." : "Salvar Alterações do Perfil"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            {prefLoading ? (
              <div className="p-8 text-center text-xs text-surface-400">Carregando preferências...</div>
            ) : (
              <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-surface-900">Auto-Arquivamento de Tarefas</h3>
                    <p className="mt-0.5 text-xs text-surface-500">
                      Suas tarefas concluídas serão arquivadas automaticamente após o período configurado em minutos. Deixe em branco para desativar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min="1"
                    max="525600"
                    value={autoArchiveMinutes}
                    onChange={(e) => setAutoArchiveMinutes(e.target.value)}
                    placeholder="Ex: 1440 (24 horas)"
                    className="flex-1 rounded-xl border border-surface-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                  <span className="text-xs font-semibold text-surface-600">minutos</span>
                </div>

                {autoArchiveMinutes && (
                  <p className="text-xs text-surface-500 font-medium">
                    ≈ {Number(autoArchiveMinutes) >= 1440
                      ? `${(Number(autoArchiveMinutes) / 1440).toFixed(1)} dia(s)`
                      : Number(autoArchiveMinutes) >= 60
                      ? `${(Number(autoArchiveMinutes) / 60).toFixed(1)} hora(s)`
                      : `${autoArchiveMinutes} minuto(s)`}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={prefSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {prefSuccess ? (
                    <><Check className="h-4 w-4" /> Preferências Salvas!</>
                  ) : prefSaving ? (
                    "Salvando..."
                  ) : (
                    "Salvar Preferências"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "backup" && (
          <div className="space-y-5">
            {/* Backup & Restore */}
            <div className="rounded-2xl border border-surface-200 bg-surface-50/50 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 text-purple-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-surface-900">Backup e Restauração de Dados</h3>
                  <p className="mt-0.5 text-xs text-surface-500">
                    Exporte suas tarefas para um arquivo JSON seguro ou restaure uma base anterior.
                  </p>
                </div>
              </div>

              {importSuccess && (
                <div className="rounded-xl bg-emerald-100 p-3 text-xs font-medium text-emerald-800">
                  ✓ {importSuccess}
                </div>
              )}

              {importError && (
                <div className="rounded-xl bg-red-100 p-3 text-xs font-medium text-red-800">
                  ⚠ {importError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exporting}
                  className="flex items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-xs font-semibold text-surface-700 shadow-2xs hover:bg-surface-100 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Download className="h-4 w-4 text-purple-600" />
                  {exporting ? "Salvando..." : "Exportar Backup"}
                </button>

                <label className="flex items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-xs font-semibold text-surface-700 shadow-2xs hover:bg-surface-100 transition-colors cursor-pointer disabled:opacity-60">
                  <Upload className="h-4 w-4 text-purple-600" />
                  <span>{importing ? "Importando..." : "Importar Backup"}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Archive all done */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Arquivar Concluídas Imediatamente</h3>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Arquiva todas as tarefas concluídas agora mesmo.
                  </p>
                </div>
              </div>

              {archivedCount != null && (
                <div className="rounded-xl bg-emerald-100 p-3 text-xs font-semibold text-emerald-800">
                  ✓ {archivedCount} tarefa(s) arquivada(s)!
                </div>
              )}

              <button
                type="button"
                onClick={handleArchiveAll}
                disabled={archiving}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Archive className="h-4 w-4" />
                {archiving ? "Arquivando..." : "Arquivar Concluídas Agora"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
