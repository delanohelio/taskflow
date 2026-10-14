import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  RefreshCw,
  Zap,
  ListTodo,
  TrendingUp,
  Sparkles,
  Tag,
  CheckSquare,
  ShieldCheck,
} from "lucide-react";
import type { UserStats } from "@/types/task";
import { fetchUserStats, parseApiError } from "@/services/api";
import DonutChart, { type DonutSegment } from "@/components/charts/DonutChart";
import ActivityVelocityChart from "@/components/charts/ActivityVelocityChart";
import RadialGaugeMeter from "@/components/charts/RadialGaugeMeter";
import PriorityBarBreakdown from "@/components/charts/PriorityBarBreakdown";
import TagDistributionChart from "@/components/charts/TagDistributionChart";

export default function StatsScreen() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchUserStats();
      setStats(data);
    } catch (err: any) {
      setError(parseApiError(err, "Erro ao carregar estatísticas."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
          <p className="text-sm font-semibold text-surface-600">Calculando métricas e estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6 text-center text-red-700 space-y-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="font-bold text-base">{error || "Não foi possível obter as estatísticas."}</p>
          <button
            onClick={() => loadStats(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-700 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Segments for Status Donut Chart
  const statusSegments: DonutSegment[] = [
    {
      id: "todo",
      label: "Para Fazer",
      value: stats.by_status.todo,
      color: "#64748b",
      hoverColor: "#475569",
    },
    {
      id: "doing",
      label: "Em Andamento",
      value: stats.by_status.doing,
      color: "#3b82f6",
      hoverColor: "#2563eb",
    },
    {
      id: "done",
      label: "Concluídas",
      value: stats.by_status.done,
      color: "#10b981",
      hoverColor: "#059669",
    },
    {
      id: "standby",
      label: "Stand-by",
      value: stats.by_status.standby,
      color: "#f59e0b",
      hoverColor: "#d97706",
    },
  ];

  const productivityScore = stats.productivity_score ?? Math.round(
    stats.total_tasks > 0
      ? (stats.completion_rate_percent * 0.5 + stats.on_time_rate_percent * 0.35 + Math.max(0, 100 - (stats.overdue_tasks / stats.total_tasks) * 100) * 0.15)
      : 100
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-surface-50/60">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white shadow-md shadow-brand-500/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-surface-900">
                  Analytics & Produtividade
                </h1>
                <p className="text-xs sm:text-sm text-surface-500">
                  Monitoramento em tempo real do fluxo de trabalho e métricas de desempenho.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStats(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-700 shadow-2xs hover:bg-surface-50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-brand-600" : ""}`} />
              Atualizar Dados
            </button>
          </div>
        </div>

        {/* Insight / Health Banner */}
        <div className="rounded-3xl border border-brand-200/60 bg-gradient-to-r from-brand-900 via-indigo-900 to-brand-950 p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur-md border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>TaskFlow Performance Engine v3.0</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                {productivityScore >= 80
                  ? "Excelente ritmo de entrega! Produtividade em alta."
                  : productivityScore >= 50
                  ? "Fluxo estável de trabalho com oportunidades de aceleração."
                  : "Atenção: alto volume de tarefas atrasadas ou pendentes."}
              </h2>
              <p className="text-xs md:text-sm text-brand-100/80 max-w-2xl leading-relaxed">
                {stats.overdue_tasks > 0
                  ? `Existem ${stats.overdue_tasks} tarefas com prazo vencido que necessitam de reorganização imediata para restabelecer a velocidade ideal do fluxo.`
                  : "Nenhuma tarefa atrasada! Todas as entregas estão no prazo estipulado."}
              </p>
            </div>

            {/* Score Ring in Banner */}
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
              <RadialGaugeMeter
                value={productivityScore}
                title="Score Geral"
                size={90}
                strokeWidth={8}
                colorScheme={productivityScore >= 80 ? "emerald" : productivityScore >= 50 ? "brand" : "amber"}
                icon={<ShieldCheck className="h-3 w-3" />}
              />
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-200">
                  Eficiência Geral
                </span>
                <div className="text-2xl font-black">{productivityScore} / 100</div>
                <span className="text-[11px] text-brand-200/80 block">
                  {productivityScore >= 80 ? "Alta Performance" : "Requer Atenção"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 4 KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks Card */}
          <div className="glass-card rounded-3xl p-5 space-y-3 transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-surface-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Tarefas</span>
              <div className="h-8 w-8 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600">
                <ListTodo className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-surface-900 tracking-tight">
              {stats.total_tasks}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
              <span>{stats.by_status.doing} em andamento ativo</span>
            </div>
          </div>

          {/* Completed Rate Card */}
          <div className="glass-card rounded-3xl p-5 space-y-3 transition-all hover:-translate-y-0.5 border-emerald-200/80 bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Concluídas</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-900 tracking-tight">
              {stats.completed_tasks}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <span>{stats.completion_rate_percent}% de taxa de entrega</span>
            </div>
          </div>

          {/* On-Time Rate Card */}
          <div className="glass-card rounded-3xl p-5 space-y-3 transition-all hover:-translate-y-0.5 border-blue-200/80 bg-blue-50/20">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-xs font-bold uppercase tracking-wider">Entregas no Prazo</span>
              <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-900 tracking-tight">
              {stats.completed_on_time}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <span>{stats.on_time_rate_percent}% dentro do prazo</span>
            </div>
          </div>

          {/* Overdue Card */}
          <div className={`glass-card rounded-3xl p-5 space-y-3 transition-all hover:-translate-y-0.5 ${
            stats.overdue_tasks > 0 ? "border-red-200/80 bg-red-50/30" : "border-surface-200"
          }`}>
            <div className="flex items-center justify-between text-red-700">
              <span className="text-xs font-bold uppercase tracking-wider">Atrasadas</span>
              <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-red-900 tracking-tight">
              {stats.overdue_tasks}
            </div>
            <p className="text-xs font-semibold text-red-600">
              {stats.overdue_tasks > 0 ? "Exigem atenção prioritária" : "Parabéns, zero pendências!"}
            </p>
          </div>
        </div>

        {/* Primary Charts Grid: Donut + Activity Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Status Donut Chart Card */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-600" />
                Distribuição de Status
              </h3>
              <span className="text-[11px] font-semibold text-surface-400">Tempo real</span>
            </div>

            <div className="py-2">
              <DonutChart segments={statusSegments} totalLabel="Total" size={190} strokeWidth={22} />
            </div>
          </div>

          {/* 7-Day Velocity Activity Chart Card */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Velocidade de Execução (Últimos 7 Dias)
              </h3>
              <span className="text-[11px] font-semibold text-surface-400">Concluídas vs Criadas</span>
            </div>

            <div className="flex-1 min-h-[220px]">
              {stats.recent_activity_trend && stats.recent_activity_trend.length > 0 ? (
                <ActivityVelocityChart data={stats.recent_activity_trend} />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-surface-400">
                  Dados de atividade recente insuficientes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Grid: Priorities & Subtasks & Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Breakdown & Subtask Efficiency */}
          <div className="glass-card rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-100 mb-4">
                <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Equilíbrio de Prioridades
                </h3>
                <span className="text-xs text-surface-500 font-semibold">{stats.total_tasks} tarefas</span>
              </div>
              <PriorityBarBreakdown
                high={stats.by_priority.high}
                normal={stats.by_priority.normal}
                low={stats.by_priority.low}
                total={stats.total_tasks}
              />
            </div>

            {/* Subtasks Progress Section */}
            <div className="pt-4 border-t border-surface-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-surface-700 flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  Subtarefas Concluídas
                </span>
                <span className="text-xs font-extrabold text-indigo-700 tabular-nums">
                  {stats.subtasks_completed} de {stats.subtasks_total}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-surface-100 overflow-hidden p-0.5 border border-surface-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  style={{
                    width: `${
                      stats.subtasks_total > 0
                        ? (stats.subtasks_completed / stats.subtasks_total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[11px] text-surface-400">
                <span>
                  {stats.subtasks_total > 0
                    ? `${Math.round((stats.subtasks_completed / stats.subtasks_total) * 100)}% de conclusão das etapas`
                    : "Sem subtarefas criadas"}
                </span>
                <span>{stats.subtasks_total - stats.subtasks_completed} restantes</span>
              </div>
            </div>
          </div>

          {/* Tag & Categorization Analytics */}
          <div className="glass-card rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-600" />
                Principais Categorias & Tags
              </h3>
              <span className="text-[11px] font-semibold text-surface-400">Distribuição</span>
            </div>

            <div className="py-2">
              <TagDistributionChart
                tags={stats.tag_distribution || []}
                totalTasks={stats.total_tasks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
