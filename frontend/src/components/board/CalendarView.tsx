/** Responsive monthly calendar view displaying scheduled tasks and deadlines. */

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Bell } from "lucide-react";
import type { Task } from "@/types/task";
import { PRIORITY_CONFIG } from "@/utils/constants";
import PriorityIndicator from "@/components/ui/PriorityIndicator";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// Color mappings for task priorities inside calendar elements
const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  normal: "#f59e0b",
  low: "#3b82f6",
};

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper: Format Date to YYYY-MM-DD in local time
  const getLocalDateString = (dateObj: Date): string => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Generate days to display in the grid (including padding from adjacent months)
  const gridDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Weekday of 1st day (0 = Sunday, 1 = Monday, ...)
    const startOffset = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const tempDays: Date[] = [];

    // Padding from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      tempDays.push(new Date(year, month, -i));
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      tempDays.push(new Date(year, month, i));
    }

    // Padding from next month to complete the last week grid (total multiple of 7)
    const totalSlots = Math.ceil(tempDays.length / 7) * 7;
    const remaining = totalSlots - tempDays.length;
    for (let i = 1; i <= remaining; i++) {
      tempDays.push(new Date(year, month + 1, i));
    }

    return tempDays;
  }, [year, month]);

  // Group tasks by date key: YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const groups: Record<string, { start: Task[]; due: Task[] }> = {};

    tasks.forEach((task) => {
      // 1. Group by start date
      if (task.start_datetime) {
        const startKey = task.start_datetime.slice(0, 10);
        if (!groups[startKey]) groups[startKey] = { start: [], due: [] };
        groups[startKey].start.push(task);
      }
      // 2. Group by due date
      if (task.due_date) {
        const dueKey = task.due_date;
        if (!groups[dueKey]) groups[dueKey] = { start: [], due: [] };
        groups[dueKey].due.push(task);
      }
    });

    return groups;
  }, [tasks]);

  // Month navigation
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateKey(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateKey(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDateKey(getLocalDateString(new Date()));
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Selected date tasks list (primarily for mobile but useful for quick side-views)
  const selectedDateTasks = useMemo(() => {
    if (!selectedDateKey) return null;
    const dayTasks = tasksByDate[selectedDateKey];
    if (!dayTasks) return { start: [], due: [] };
    return dayTasks;
  }, [selectedDateKey, tasksByDate]);

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Calendar className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-surface-500">Visualização de agendamentos e prazos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50"
          >
            Hoje
          </button>
          <div className="flex items-center rounded-lg border border-surface-200 bg-white">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-surface-50 transition-colors rounded-l-lg border-r border-surface-100"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4 text-surface-600" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-surface-50 transition-colors rounded-r-lg"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4 text-surface-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Main Grid Calendar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-surface-200 shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-surface-100 bg-surface-50/50 text-center py-2 text-xs font-bold text-surface-500 uppercase tracking-wider">
            {weekdayNames.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Day Slots */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-surface-100 min-h-[420px] md:min-h-[500px]">
            {gridDays.map((dateObj, idx) => {
              const dateKey = getLocalDateString(dateObj);
              const isCurrentMonth = dateObj.getMonth() === month;
              const isToday = getLocalDateString(new Date()) === dateKey;
              const isSelected = selectedDateKey === dateKey;
              
              const dayData = tasksByDate[dateKey] || { start: [], due: [] };
              const totalTasksCount = dayData.start.length + dayData.due.length;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`group relative flex flex-col p-1.5 min-h-[70px] md:min-h-[85px] transition-colors cursor-pointer select-none ${
                    isCurrentMonth ? "bg-white" : "bg-surface-50/40 text-surface-400"
                  } ${isSelected ? "ring-2 ring-brand-500/20 bg-brand-50/10" : "hover:bg-surface-50/80"}`}
                >
                  {/* Day Number Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-brand-600 text-white"
                          : isCurrentMonth
                          ? "text-surface-700"
                          : "text-surface-400"
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>

                    {/* Small dot indicators for mobile */}
                    {totalTasksCount > 0 && (
                      <div className="flex gap-0.5 md:hidden">
                        {dayData.start.map((t) => (
                          <span
                            key={t.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: PRIORITY_COLORS[t.priority] || "#e2e8f0" }}
                          />
                        ))}
                        {dayData.due.map((t) => (
                          <span
                            key={t.id}
                            className="h-1.5 w-1.5 rounded-full border border-white"
                            style={{ backgroundColor: PRIORITY_COLORS[t.priority] || "#e2e8f0" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Task list inside grid (desktop/tablet only) */}
                  <div className="hidden md:flex flex-col gap-1 mt-1 flex-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                    {/* Start Tasks */}
                    {dayData.start.map((task) => {
                      const time = task.start_datetime ? task.start_datetime.slice(11, 16) : "";
                      return (
                        <div
                          key={`start-${task.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          className="flex items-center gap-1 rounded bg-brand-50 hover:bg-brand-100/80 border-l-2 px-1 py-0.5 text-[10px] text-brand-800 transition-colors"
                          style={{ borderLeftColor: PRIORITY_COLORS[task.priority] || "#e2e8f0" }}
                          title={`Início: ${task.title}`}
                        >
                          <span className="font-semibold text-brand-700">{time || "09:00"}</span>
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {/* Due Tasks */}
                    {dayData.due.map((task) => (
                      <div
                        key={`due-${task.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className="flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 border-l-2 px-1 py-0.5 text-[10px] text-rose-800 transition-colors"
                        style={{ borderLeftColor: PRIORITY_COLORS[task.priority] || "#e2e8f0" }}
                        title={`Prazo: ${task.title}`}
                      >
                        <Bell className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Info Sidebar */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-xs flex flex-col min-h-[250px] lg:min-h-[420px]">
          {selectedDateKey ? (
            <>
              <div className="border-b border-surface-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-surface-900">
                  {new Date(selectedDateKey + "T00:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                  })}
                </h3>
                <p className="text-xs text-surface-400">Atividades agendadas para o dia</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px]">
                {/* Starts list */}
                {selectedDateTasks && selectedDateTasks.start.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Iniciando</h4>
                    <div className="space-y-1.5">
                      {selectedDateTasks.start.map((task) => (
                        <div
                          key={`sel-start-${task.id}`}
                          onClick={() => onTaskClick(task)}
                          className="flex flex-col p-2 rounded-xl bg-brand-50/50 hover:bg-brand-50 border border-brand-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-brand-700 bg-brand-100/80 px-1.5 py-0.2 rounded-full">
                              {task.start_datetime ? task.start_datetime.slice(11, 16) : "09:00"}
                            </span>
                            <PriorityIndicator priority={task.priority} />
                          </div>
                          <span className="text-sm font-semibold text-surface-800 hover:text-brand-600 line-clamp-1">
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadlines list */}
                {selectedDateTasks && selectedDateTasks.due.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2">Prazos de Entrega</h4>
                    <div className="space-y-1.5">
                      {selectedDateTasks.due.map((task) => (
                        <div
                          key={`sel-due-${task.id}`}
                          onClick={() => onTaskClick(task)}
                          className="flex flex-col p-2 rounded-xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700">
                              <Bell className="h-2.5 w-2.5" /> Prazo final
                            </span>
                            <PriorityIndicator priority={task.priority} />
                          </div>
                          <span className="text-sm font-semibold text-surface-800 hover:text-rose-600 line-clamp-1">
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {(!selectedDateTasks || (selectedDateTasks.start.length === 0 && selectedDateTasks.due.length === 0)) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-surface-400 italic">Sem tarefas para este dia</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
              <Calendar className="h-10 w-10 text-surface-300 mb-2 animate-pulse" />
              <p className="text-sm font-medium text-surface-500">Selecione um dia</p>
              <p className="text-xs text-surface-400 mt-1 max-w-[180px]">
                Clique em qualquer dia do calendário para ver suas tarefas detalhadas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
