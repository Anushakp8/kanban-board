import { memo } from 'react';

interface Props {
  stats: { total: number; completed: number; overdue: number; inProgress: number };
}

export const BoardStats = memo(function BoardStats({ stats }: Props) {
  return (
    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
      <span className="text-xs text-slate-500">
        {stats.total} task{stats.total !== 1 ? 's' : ''}
      </span>
      {stats.inProgress > 0 && (
        <span className="text-xs text-blue-600 font-medium">
          {stats.inProgress} in progress
        </span>
      )}
      {stats.completed > 0 && (
        <span className="text-xs text-emerald-600 font-medium">
          {stats.completed} done
        </span>
      )}
      {stats.overdue > 0 && (
        <span className="text-xs text-rose-500 font-medium">
          {stats.overdue} overdue
        </span>
      )}
    </div>
  );
});
