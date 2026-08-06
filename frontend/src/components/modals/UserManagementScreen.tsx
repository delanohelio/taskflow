import React, { useEffect, useState } from "react";
import { Users, Plus, Trash2, Shield, User as UserIcon, Mail, Lock, AlertCircle, X, CheckCircle2 } from "lucide-react";
import type { User, UserRole } from "@/types/task";
import { createUser, deleteUser, fetchUsers, parseApiError, updateUser } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";

export default function UserManagementScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const roleOptions: CustomSelectOption<UserRole>[] = [
    {
      value: "user",
      label: "Usuário Comum",
      description: "Acesso ao seu próprio painel de tarefas e atividades compartilhadas",
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      value: "admin",
      label: "Administrador",
      description: "Acesso total, gestão de usuários e configurações do sistema",
      icon: <Shield className="h-4 w-4 text-purple-600" />,
    },
  ];

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(parseApiError(err, "Erro ao carregar lista de usuários."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = () => {
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setRole("user");
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Client-side validations with friendly messages
    if (username.trim().length < 3) {
      setModalError("O nome de usuário deve ter pelo menos 3 caracteres.");
      return;
    }
    if (password.length < 4) {
      setModalError("A senha inicial deve ter pelo menos 4 caracteres.");
      return;
    }
    if (fullName.trim().length < 2) {
      setModalError("O nome completo deve ter pelo menos 2 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await createUser({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        email: email.trim() || null,
        role,
      });
      setShowCreateModal(false);
      await loadUsers();
    } catch (err: any) {
      setModalError(parseApiError(err, "Erro ao criar novo usuário. Verifique os dados fornecidos."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (currentUser?.id === userId) {
      alert("Não é possível excluir a sua própria conta de administrador em uso.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) return;
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      alert(parseApiError(err, "Erro ao excluir usuário."));
    }
  };

  const handleToggleRole = async (user: User) => {
    if (currentUser?.id === user.id) {
      alert("Não é possível remover suas próprias permissões de administrador.");
      return;
    }
    const newRole: UserRole = user.role === "admin" ? "user" : "admin";
    try {
      await updateUser(user.id, { role: newRole });
      await loadUsers();
    } catch (err: any) {
      alert(parseApiError(err, "Erro ao atualizar função do usuário."));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-surface-900">
              <Users className="h-7 w-7 text-purple-600" />
              Gestão de Usuários (Admin)
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              Cadastre novos usuários, gerencie permissões e atribua papéis no sistema.
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-surface-500">Carregando usuários...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-xs">
              <table className="w-full text-left text-sm text-surface-600 min-w-[640px]">
                <thead className="border-b border-surface-200 bg-surface-50 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Usuário</th>
                    <th className="px-6 py-3.5">Nome Completo</th>
                    <th className="px-6 py-3.5">E-mail</th>
                    <th className="px-6 py-3.5">Função</th>
                    <th className="px-6 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-surface-900 flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-surface-400" />
                          @{u.username} {isSelf && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">(Você)</span>}
                        </td>
                        <td className="px-6 py-4">{u.full_name}</td>
                        <td className="px-6 py-4 text-surface-500">{u.email || "—"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                              isSelf
                                ? "opacity-60 cursor-not-allowed bg-purple-100 text-purple-800"
                                : u.role === "admin"
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                                : "bg-surface-100 text-surface-700 hover:bg-surface-200 cursor-pointer"
                            }`}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            {u.role === "admin" ? "Administrador" : "Usuário Comum"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="block lg:hidden space-y-3">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className="rounded-2xl border border-surface-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-surface-100 pb-2.5">
                      <div className="flex items-center gap-2 font-bold text-surface-900">
                        <UserIcon className="h-4 w-4 text-purple-600" />
                        <span>@{u.username}</span>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            (Você)
                          </span>
                        )}
                      </div>
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-surface-800 font-semibold text-sm">{u.full_name}</div>
                      {u.email && <div className="text-surface-500">{u.email}</div>}
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={isSelf}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                          isSelf
                            ? "opacity-60 cursor-not-allowed bg-purple-100 text-purple-800"
                            : u.role === "admin"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                            : "bg-surface-100 text-surface-700 hover:bg-surface-200 cursor-pointer"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {u.role === "admin" ? "Administrador" : "Usuário Comum"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Modal Criar Usuário com Componentes Customizados */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-5 border border-surface-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900">Novo Usuário</h3>
                  <p className="text-xs text-surface-500">Preencha os campos para cadastrar um usuário no TaskFlow.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 animate-in slide-in-from-top-2 duration-150">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{modalError}</div>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Nome de Usuário <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ex: joao"
                      required
                      minLength={3}
                      className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-surface-400 mt-1 block">Mínimo de 3 caracteres</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Senha Inicial <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={4}
                      className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-surface-400 mt-1 block">Mínimo de 4 caracteres</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: João da Silva"
                  required
                  minLength={2}
                  className="block w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">E-mail (opcional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@empresa.com"
                    className="block w-full rounded-xl border border-surface-200 pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <CustomSelect<UserRole>
                  label="Função e Permissões no Sistema"
                  options={roleOptions}
                  value={role}
                  onChange={(val) => setRole(val)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-surface-200 px-5 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Criar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
