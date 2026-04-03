import { useState, useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoard } from '../../context/BoardContext';
import { type Task, type Status, COLUMNS } from '../../types';
import { BoardHeader } from './BoardHeader';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from '../task/TaskCard';
import { TaskDetailPanel } from '../task/TaskDetailPanel';
import { NewTaskModal } from '../task/NewTaskModal';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

export function Board() {
  const { filteredTasks, loading, error, updateTaskStatus, selectedTask, setSelectedTask } = useBoard();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getTasksByStatus = useCallback(
    (status: Status) => filteredTasks.filter(t => t.status === status),
    [filteredTasks]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [filteredTasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const task = filteredTasks.find(t => t.id === activeId);
    if (!task) return;

    const isColumnDrop = COLUMNS.some(c => c.id === overId);
    const targetStatus = isColumnDrop
      ? (overId as Status)
      : filteredTasks.find(t => t.id === overId)?.status;

    if (targetStatus && targetStatus !== task.status) {
      updateTaskStatus(activeId, targetStatus);
    }
  }, [filteredTasks, updateTaskStatus]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress size={40} thickness={4} />
          <p className="text-sm text-slate-500 font-medium">Loading your board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Alert severity="error" variant="outlined" className="max-w-md">
          <strong>Failed to load board</strong> &mdash; {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <BoardHeader onNewTask={() => setShowNewTaskModal(true)} />

      <div className="flex-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(column => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div className="rotate-2 scale-105 opacity-90">
                <TaskCard task={activeTask} isDragOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {showNewTaskModal && (
        <NewTaskModal onClose={() => setShowNewTaskModal(false)} />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
