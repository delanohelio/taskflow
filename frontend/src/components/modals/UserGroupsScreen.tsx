import React, { useEffect, useState } from "react";
import { UserCheck, Plus, Trash2, Edit3, Users, X, AlertCircle } from "lucide-react";
import type { User, UserGroup } from "@/types/task";
import { createGroup, deleteGroup, fetchUserGroups, fetchPublicUsers, parseApiError, updateGroup } from "@/services/api";
import { AutocompleteMultiSelect, AutocompleteOption } from "@/components/ui/AutocompleteMultiSelect";

export default function UserGroupsScreen() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, uData] = await Promise.all([fetchUserGroups(), fetchPublicUsers()]);
      setGroups(gData);
      setAllUsers(uData);
    } catch (err: any) {
      setError(parseApiError(err, "Erro ao carregar lista de grupos ou usuários."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setName("");
    setSelectedUserIds([]);
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setSelectedUserIds(group.members.map((m) => m.id));
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError("Informe o nome do grupo.");
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: name.trim(),
          member_ids: selectedUserIds,
        });
      } else {
        await createGroup({
          name: name.trim(),
          member_ids: selectedUserIds,
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(parseApiError(err, "Erro ao salvar o grupo."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId: number, gName: string) => {
    if (!confirm(`Deseja excluir o grupo "${gName}"?`)) return;
    try {
      await deleteGroup(groupId);
      await loadData();
    } catch (err: any) {
      alert(parseApiError(err, "Erro ao excluir grupo."));
    }
  };

  const userOptions: AutocompleteOption[] = allUsers.map((u) => ({
    id: u.id,
    label: `${u.full_name} (@${u.username})`,
    sublabel: u.email || `@${u.username}`,
    badge: u.role === "admin" ? "Admin" : undefined,
    type: "user",
  }));

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-surface-900">
              <UserCheck className="h-7 w-7 text-indigo-600" />
              Grupos de Usuários
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              Crie grupos para organizar colaboradores e agilizar o compartilhamento de tarefas em lote.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Grupo
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-surface-500">Carregando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm font-medium text-surface-700">Nenhum grupo cadastrado</p>
            <p className="text-xs text-surface-400 mt-1">
              Crie um grupo de usuários para agilizar o compartilhamento de suas atividades.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-surface-200 bg-white p-5 shadow-xs space-y-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-surface-900">{group.name}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {group.members.length} membro(s) no grupo
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(group)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors cursor-pointer"
                      title="Editar grupo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id, group.name)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      title="Excluir grupo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Member chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-surface-100">
                  {group.members.length === 0 ? (
                    <span className="text-xs text-surface-400 italic">Sem membros</span>
                  ) : (
                    group.members.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                      >
                        @{m.username}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal CRUD Grupo com Autocomplete */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-5 border border-surface-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900">
                    {editingGroup ? "Editar Grupo" : "Novo Grupo"}
                  </h3>
                  <p className="text-xs text-surface-500">Defina o nome e selecione os membros do grupo.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>{modalError}</div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Nome do Grupo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Equipe Frontend, Projetos Especiais"
                  required
                  className="block w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <AutocompleteMultiSelect
                  label="Buscar e Adicionar Membros"
                  options={userOptions}
                  selectedIds={selectedUserIds}
                  onChange={(ids) => setSelectedUserIds(ids as number[])}
                  placeholder="Digite o nome ou username para buscar um membro..."
                  emptyMessage="Nenhum usuário encontrado para esta busca."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-surface-200 px-5 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? "Salvando..." : "Salvar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
