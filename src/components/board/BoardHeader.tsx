import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import LabelIcon from '@mui/icons-material/Label';
import CloseIcon from '@mui/icons-material/Close';
import { FilterBar } from './FilterBar';
import { TeamMembersPanel } from '../team/TeamMembersPanel';
import { LabelsPanel } from '../labels/LabelsPanel';
import { BoardStats } from './BoardStats';

interface Props {
  onNewTask: () => void;
}

export function BoardHeader({ onNewTask }: Props) {
  const { filters, setFilters, stats } = useBoard();
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const hasActiveFilters = filters.priority !== 'all' || filters.assignee !== 'all' || filters.label !== 'all' || filters.search !== '';

  return (
    <>
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Task Board
              </h1>
              <BoardStats stats={stats} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search toggle */}
            <Tooltip title="Search tasks">
              <IconButton
                size="small"
                onClick={() => { setShowSearch(!showSearch); if (!showSearch) setShowFilters(false); }}
                className={showSearch ? '!bg-blue-50 !text-blue-600' : ''}
              >
                {showSearch ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Filter toggle */}
            <Tooltip title="Filters">
              <IconButton
                size="small"
                onClick={() => { setShowFilters(!showFilters); if (!showFilters) setShowSearch(false); }}
                className={showFilters || hasActiveFilters ? '!bg-blue-50 !text-blue-600' : ''}
              >
                <FilterListIcon fontSize="small" />
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </IconButton>
            </Tooltip>

            {/* Team members */}
            <Tooltip title="Team members">
              <IconButton size="small" onClick={() => setShowTeam(true)}>
                <PeopleIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Labels */}
            <Tooltip title="Labels">
              <IconButton size="small" onClick={() => setShowLabels(true)}>
                <LabelIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* New Task */}
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <AddIcon fontSize="small" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-3 animate-fade-in">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 transition bg-slate-50"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: '' })}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <CloseIcon fontSize="small" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter bar */}
        {showFilters && (
          <div className="mt-3 animate-fade-in">
            <FilterBar />
          </div>
        )}
      </header>

      {showTeam && <TeamMembersPanel onClose={() => setShowTeam(false)} />}
      {showLabels && <LabelsPanel onClose={() => setShowLabels(false)} />}
    </>
  );
}
