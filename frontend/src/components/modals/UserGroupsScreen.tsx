import React, { useEffect, useState } from "react";
import { UserCheck, Plus, Trash2, Edit3, Users, Check, X } from "lucide-react";
import type { User, UserGroup } from "@/types/task";
import { createGroup, deleteGroup, fetchUserGroups, fetchUsers, updateGroup } from "@/services/api";

export default function UserGroupsScreen() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gData, uData] = await Promise.all([fetchUserGroups(), fetchUsers()]);
      setGroups(gData);
      setAllUsers(uData);
    } catch (err) {
      console.error("Erro ao carregar grupos", err);
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
    setShowModal(true);
  };

  const handleOpenEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setSelectedUserIds(group.members.map((m) => m.id));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
      alert(err.response?.data?.detail || "Erro ao salvar grupo.");
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
      alert(err.response?.data?.detail || "Erro ao excluir grupo.");
    }
  };

  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

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
              Crie grupos de usuários para facilitar o compartilhamento de tarefas em lote.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Grupo
          </button>
        </div>

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

      {/* Modal CRUD Grupo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-surface-900">
              {editingGroup ? "Editar Grupo" : "Novo Grupo"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700">Nome do Grupo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Time Frontend, Projeto Alpha"
                  required
                  className="mt-1 block w-full rounded-xl border border-surface-200 px-3.5 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-surface-700 mb-2 block">
                  Selecionar Membros
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-surface-200 p-2 space-y-1 bg-surface-50">
                  {allUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserSelection(u.id)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                          isSelected ? "bg-indigo-100 text-indigo-900 font-semibold" : "bg-white text-surface-700 hover:bg-surface-100"
                        }`}
                      >
                        <span>{u.full_name} (@{u.username})</span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-semibold text-surface-600 hover:bg-surface-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
