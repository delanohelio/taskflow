import React, { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Award, RefreshCw, Zap, ListTodo } from "lucide-react";
import type { UserStats } from "@/types/task";
import { fetchUserStats, parseApiError } from "@/services/api";

export default function StatsScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserStats();
      setStats(data);
    } catch (err: any) {
      setError(parseApiError(err, "Erro ao carregar estatísticas."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-surface-500">
        Carregando estatísticas...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="font-semibold">{error || "Não foi possível obter as estatísticas."}</p>
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface-50">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-surface-900">
              <BarChart3 className="h-7 w-7 text-brand-600" />
              Estatísticas & Desempenho
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              Acompanhe seu fluxo de trabalho, métricas de conclusão no prazo e distribuição de prioridades.
            </p>
          </div>
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3.5 py-2 text-xs font-semibold text-surface-700 shadow-2xs hover:bg-surface-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-surface-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Tarefas</span>
              <ListTodo className="h-5 w-5 text-brand-600" />
            </div>
            <div className="text-3xl font-extrabold text-surface-900">{stats.total_tasks}</div>
            <p className="text-xs text-surface-400">Atividades no seu plano</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Concluídas</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-900">{stats.completed_tasks}</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <span>{stats.completion_rate_percent}% de conclusão</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold uppercase tracking-wider">Entregues no Prazo</span>
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-blue-900">{stats.completed_on_time}</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <span>{stats.on_time_rate_percent}% dentro do prazo</span>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-xs font-bold uppercase tracking-wider">Atrasadas</span>
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold text-red-900">{stats.overdue_tasks}</div>
            <p className="text-xs text-red-600">Requerem atenção imediata</p>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-600" />
              Distribuição por Status
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Para Fazer (Todo)</span>
                  <span>{stats.by_status.todo}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_status.todo / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Em Andamento (Doing)</span>
                  <span>{stats.by_status.doing}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_status.doing / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Concluídas (Done)</span>
                  <span>{stats.by_status.done}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_status.done / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Stand-by (Futuras)</span>
                  <span>{stats.by_status.standby}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_status.standby / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Priority & Subtasks Breakdown */}
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Prioridades & Subtarefas
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Alta Prioridade</span>
                  <span className="text-red-600 font-bold">{stats.by_priority.high}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_priority.high / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Prioridade Normal</span>
                  <span className="text-amber-600 font-bold">{stats.by_priority.normal}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_priority.normal / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Baixa Prioridade</span>
                  <span className="text-slate-600 font-bold">{stats.by_priority.low}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all"
                    style={{ width: `${stats.total_tasks > 0 ? (stats.by_priority.low / stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-surface-100">
                <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                  <span>Subtarefas Concluídas</span>
                  <span className="font-bold text-indigo-600">
                    {stats.subtasks_completed} / {stats.subtasks_total}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{
                      width: `${stats.subtasks_total > 0 ? (stats.subtasks_completed / stats.subtasks_total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
