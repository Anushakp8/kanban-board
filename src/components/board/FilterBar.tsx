import { useBoard } from '../../context/BoardContext';
import type { Priority } from '../../types';

export function FilterBar() {
  const { filters, setFilters, teamMembers, labels } = useBoard();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={e => setFilters({ ...filters, priority: e.target.value as Priority | 'all' })}
        className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>

      {/* Assignee filter */}
      {teamMembers.length > 0 && (
        <select
          value={filters.assignee}
          onChange={e => setFilters({ ...filters, assignee: e.target.value })}
          className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="all">All Assignees</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Label filter */}
      {labels.length > 0 && (
        <select
          value={filters.label}
          onChange={e => setFilters({ ...filters, label: e.target.value })}
          className="text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="all">All Labels</option>
          {labels.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      )}

      {/* Clear filters */}
      {(filters.priority !== 'all' || filters.assignee !== 'all' || filters.label !== 'all') && (
        <button
          onClick={() => setFilters({ ...filters, priority: 'all', assignee: 'all', label: 'all' })}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
