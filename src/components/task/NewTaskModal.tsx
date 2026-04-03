import { useState, useRef, useEffect } from 'react';
import { useBoard } from '../../context/BoardContext';
import { CreateTaskSchema } from '../../types';
import type { Priority } from '../../types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FlagIcon from '@mui/icons-material/Flag';

interface Props {
  onClose: () => void;
}

export function NewTaskModal({ onClose }: Props) {
  const { createTask, labels, addLabelToTask, tasks } = useBoard();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevTaskCount = useRef(tasks.length);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // After task creation, attach labels then close
  useEffect(() => {
    if (submitting && tasks.length > prevTaskCount.current && selectedLabels.length > 0) {
      const newTask = tasks[tasks.length - 1];
      if (newTask) {
        Promise.all(selectedLabels.map(labelId => addLabelToTask(newTask.id, labelId)))
          .finally(() => onClose());
      }
    }
  }, [tasks.length, submitting, selectedLabels, addLabelToTask, tasks, onClose]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = CreateTaskSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    prevTaskCount.current = tasks.length;
    const success = await createTask(parsed.data);
    if (success) {
      if (selectedLabels.length === 0) {
        onClose();
      }
      // else: label attachment effect above will close the modal
    } else {
      setError('Failed to create task. Please try again.');
      setSubmitting(false);
    }
  };

  const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#94a3b8' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high', label: 'High', color: '#ef4444' },
  ];

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: '!rounded-2xl' }}>
      <DialogTitle className="!font-bold !text-lg !text-slate-800">
        Create New Task
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="!space-y-4 !pt-0">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              aria-required="true"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-300 transition bg-slate-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-300 resize-none transition bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      priority === opt.value
                        ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FlagIcon style={{ fontSize: 12, color: opt.color }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              />
            </div>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map(label => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                      selectedLabels.includes(label.id)
                        ? 'text-white ring-2 ring-offset-1'
                        : 'text-white opacity-50 hover:opacity-75'
                    }`}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <Alert severity="error" className="!rounded-lg">{error}</Alert>}
        </DialogContent>

        <DialogActions className="!px-6 !pb-5">
          <Button onClick={onClose} variant="text" color="inherit" className="!text-slate-600">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            className="!rounded-xl !shadow-sm"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
