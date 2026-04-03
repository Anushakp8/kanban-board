import { format, differenceInDays, isToday, isPast, isTomorrow, addDays, isWithinInterval } from 'date-fns';

interface DueDateInfo {
  label: string;
  bg: string;
  text: string;
}

export function getDueDateInfo(dueDate: string | null, isDone: boolean): DueDateInfo | null {
  if (!dueDate) return null;

  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isDone) {
    return {
      label: format(due, 'MMM d'),
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    };
  }

  if (isPast(due) && !isToday(due)) {
    const daysOverdue = differenceInDays(today, due);
    return {
      label: `${daysOverdue}d overdue`,
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    };
  }

  if (isToday(due)) {
    return {
      label: 'Due today',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    };
  }

  if (isTomorrow(due)) {
    return {
      label: 'Due tomorrow',
      bg: 'bg-amber-50',
      text: 'text-amber-500',
    };
  }

  const threeDaysFromNow = addDays(today, 3);
  if (isWithinInterval(due, { start: today, end: threeDaysFromNow })) {
    const daysLeft = differenceInDays(due, today);
    return {
      label: `${daysLeft}d left`,
      bg: 'bg-amber-50',
      text: 'text-amber-500',
    };
  }

  return {
    label: format(due, 'MMM d'),
    bg: 'bg-slate-50',
    text: 'text-slate-500',
  };
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d, yyyy');
}
