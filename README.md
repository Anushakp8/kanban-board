# Kanban Task Board

A beautiful, fully-featured Kanban-style task board built with React, TypeScript, and Supabase. Drag tasks across columns, manage team members, add labels, and track activity — inspired by tools like Asana and Linear.

## Tech Stack

- **Frontend:** React 19, TypeScript 5.9 (strict), Vite 8
- **Styling:** Tailwind CSS 4 + Material UI 7
- **Drag & Drop:** dnd-kit
- **Validation:** Zod 4
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security + Anonymous Auth)
- **Runtime:** Bun
- **Utilities:** date-fns, uuid

## Features

### Core
- Kanban board with 4 columns: To Do, In Progress, In Review, Done
- Drag-and-drop tasks between columns
- Create, edit, and delete tasks with title, description, priority, due date
- Guest authentication (Supabase anonymous sign-in)
- Row Level Security — each user sees only their own data
- Loading, error, and empty states
- Responsive layout

### Advanced
1. **Team Members & Assignees** — Create a team, assign members to tasks, see avatars on cards
2. **Task Comments** — Add/delete comments with timestamps in the task detail panel
3. **Activity Log** — Automatic tracking of status changes, edits, assignments, labels
4. **Labels / Tags** — Custom labels with color picker, assign to tasks, filter by label
5. **Due Date Indicators** — Color-coded badges (overdue, due today, due soon)
6. **Search & Filtering** — Search by title/description, filter by priority, assignee, or label
7. **Board Summary / Stats** — Task count, in progress, completed, and overdue stats in the header

## Setup

### Prerequisites
- [Bun](https://bun.sh/) or Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier)

### 1. Clone and install
```bash
git clone <repo-url>
cd kanban-board
bun install
```

### 2. Configure Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase_schema.sql`
3. Go to **Authentication → Sign In / Up** and enable **Anonymous Sign-Ins**
4. Go to **Settings → API** and copy your project URL and `anon` key

### 3. Set environment variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run
```bash
bun dev
```

## Database Schema

7 tables with full RLS policies:

| Table | Purpose |
|-------|---------|
| `tasks` | Task data (title, description, status, priority, due date, position) |
| `team_members` | Team members (name, avatar, color) |
| `task_assignees` | Many-to-many: tasks ↔ team members |
| `labels` | Custom labels (name, color) |
| `task_labels` | Many-to-many: tasks ↔ labels |
| `comments` | Task comments |
| `activity_log` | Auto-tracked task activity history |

Full schema with indexes and triggers available in `supabase_schema.sql`.

## Architecture

Built following SOLID principles:

```
src/
├── types/          — Zod schemas + TypeScript types
├── lib/            — Supabase client, date utilities
├── services/       — One service per table (Single Responsibility)
├── context/        — BoardContext for state management
└── components/     — Feature-grouped UI components
    ├── board/      — Board, Column, Header, Stats, Filters
    ├── task/       — TaskCard, NewTaskModal, TaskDetailPanel
    ├── team/       — TeamMembersPanel
    └── labels/     — LabelsPanel
```

## Build

```bash
bun run build
```

Output is in `dist/` — deploy to Vercel, Netlify, or Cloudflare Pages.
