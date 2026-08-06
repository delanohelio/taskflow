import React, { useState, useRef, useEffect } from "react";
import { Bell, Mail, UserCheck, AlertTriangle, Clock, Check, CheckCheck } from "lucide-react";
import type { Notification } from "@/types/task";
import { fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/services/api";

interface NotificationDropdownProps {
  onNotificationClick?: (taskLink?: number | null) => void;
}

export default function NotificationDropdown({ onNotificationClick }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    try {
      const data = await fetchUserNotifications();
      setNotifications(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, taskLinkId?: number | null) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (taskLinkId && onNotificationClick) {
        onNotificationClick(taskLinkId);
      }
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* ignore */
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "invitation":
        return <Mail className="h-4 w-4 text-indigo-600" />;
      case "subtask_assigned":
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "due_soon":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-brand-600" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl border border-surface-200 bg-white p-2.5 text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer shadow-2xs"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-3xl border border-surface-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-600" />
              <h4 className="text-sm font-bold text-surface-900">Notificações</h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 my-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-surface-400">Nenhuma notificação no momento</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link_task_id)}
                  className={`flex items-start gap-3 py-3 px-2 rounded-xl transition-colors cursor-pointer ${
                    n.is_read ? "opacity-75 hover:bg-surface-50" : "bg-purple-50/50 font-medium hover:bg-purple-50"
                  }`}
                >
                  <div className="mt-0.5 rounded-lg p-1.5 bg-white shadow-2xs shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-surface-900 truncate">{n.title}</div>
                    <div className="text-xs text-surface-600 line-clamp-2 mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-surface-400 mt-1">
                      {new Date(n.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-purple-600 shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
