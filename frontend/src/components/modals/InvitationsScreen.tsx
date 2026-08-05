import React, { useEffect, useState } from "react";
import { Mail, Check, X, User as UserIcon, Calendar } from "lucide-react";
import type { TaskShare } from "@/types/task";
import { acceptShare, fetchInvitations, rejectShare } from "@/services/api";

interface InvitationsScreenProps {
  onInvitationHandled?: () => void;
}

export default function InvitationsScreen({ onInvitationHandled }: InvitationsScreenProps) {
  const [invitations, setInvitations] = useState<TaskShare[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await fetchInvitations();
      setInvitations(data);
    } catch (err) {
      console.error("Erro ao carregar convites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleAccept = async (shareId: number) => {
    try {
      await acceptShare(shareId);
      await loadInvitations();
      if (onInvitationHandled) onInvitationHandled();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao aceitar convite.");
    }
  };

  const handleReject = async (shareId: number) => {
    try {
      await rejectShare(shareId);
      await loadInvitations();
      if (onInvitationHandled) onInvitationHandled();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao recusar convite.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-50">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold text-surface-900">
            <Mail className="h-7 w-7 text-brand-600" />
            Convites de Compartilhamento
          </h2>
          <p className="text-sm text-surface-500 mt-1">
            Aceite ou recuse convites enviadas por outros usuários para colaborar em tarefas.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-surface-500">Carregando convites...</div>
        ) : invitations.length === 0 ? (
          <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center">
            <Mail className="mx-auto h-10 w-10 text-surface-300 mb-3" />
            <p className="text-sm font-medium text-surface-700">Nenhum convite pendente</p>
            <p className="text-xs text-surface-400 mt-1">
              Quando alguém compartilhar uma tarefa com você, ela aparecerá aqui para sua confirmação.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-xs hover:border-brand-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-100">
                      Tarefa #{inv.task_id}
                    </span>
                    <span className="text-xs text-surface-400">
                      Convite recebido
                    </span>
                  </div>
                  <p className="text-sm text-surface-700">
                    Você foi convidado para colaborar nesta atividade.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(inv.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </button>
                  <button
                    onClick={() => handleAccept(inv.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    Aceitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
