import { useState } from 'react';
import { useBoard } from '../../context/BoardContext';
import { COLOR_PRESETS, CreateLabelSchema } from '../../types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';

interface Props {
  onClose: () => void;
}

export function LabelsPanel({ onClose }: Props) {
  const { labels, addLabel, removeLabel } = useBoard();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLOR_PRESETS[0]);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    const parsed = CreateLabelSchema.safeParse({ name: name.trim(), color });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }
    const success = await addLabel(parsed.data.name, parsed.data.color);
    if (success) {
      setName('');
      setShowForm(false);
    } else {
      setError('Failed to create label');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ className: '!rounded-2xl' }}>
      <DialogTitle className="!flex !items-center !justify-between !font-bold !text-base">
        Labels
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent className="!pt-0">
        {labels.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 text-center py-6">No labels yet</p>
        )}

        <div className="space-y-2 mb-4">
          {labels.map(label => (
            <div key={label.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 group transition-colors">
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-sm font-medium text-slate-700 flex-1">{label.name}</span>
              <Tooltip title="Delete label">
                <IconButton
                  size="small"
                  onClick={() => removeLabel(label.id)}
                  className="!opacity-0 group-hover:!opacity-100 !transition-opacity"
                >
                  <DeleteOutlineIcon fontSize="small" className="!text-slate-400 hover:!text-rose-500" />
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl animate-fade-in">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Label name (e.g. Bug, Feature)"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {error && <Alert severity="error" className="!text-xs !rounded-lg">{error}</Alert>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 text-xs font-medium py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 text-xs font-medium py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
          >
            <AddIcon fontSize="small" />
            Create label
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
