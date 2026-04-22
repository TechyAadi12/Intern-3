# 🎮 Ops Cockpit

## What is Ops Cockpit?

**Ops Cockpit** is a modern control dashboard designed to help teams monitor and manage automated workflow runs in real-time. Think of it like an air traffic control center, but for software workflows instead of airplanes. 

It's built with **React**, **TypeScript**, and **Vite** to provide a fast, responsive experience for operators who need to track, inspect, and control workflow execution.

---

## 🎯 Why Use Ops Cockpit?

Imagine you have dozens or hundreds of automated workflows running simultaneously. Without a good dashboard, tracking them is nearly impossible. Ops Cockpit solves this by giving you:

- **Real-time visibility** - See all your workflows at a glance
- **Quick actions** - Retry failed jobs, pause running workflows, or cancel stuck processes with one click
- **Intelligent filtering** - Find exactly what you need (by status, assignee, or search)
- **Live event tracking** - Watch what happened with every workflow step
- **Network awareness** - Know when your system is struggling with connection issues
- **Keyboard shortcuts** - Power users can work faster without touching the mouse

---

## ✨ Key Features Explained

### 1. **Queue Panel (Left Side)**
The Queue Panel shows a list of all your workflow jobs. Each job has:
- **Status**: Whether it's queued, running, paused, failed, completed, or canceled
- **Priority**: How urgent the job is (P0 = most urgent, P2 = least urgent)
- **Owner**: Who is assigned to this job
- **Last Updated**: When the job was last modified

**Use it to**: Browse all active workflows and quickly spot problems

---

### 2. **Filter & Search**
Keep the Queue Panel focused by filtering:
- **By Status**: Show only failed jobs, or only running ones
- **By Assignee**: See jobs assigned to you, or unassigned jobs
- **By Search**: Find a specific workflow ID or run ID

**Use it to**: Reduce noise and focus on what matters

---

### 3. **Detail Inspector (Top Right)**
When you select a job from the queue, this panel shows comprehensive details:
- Queue ID and Run ID
- Current status with color coding
- Priority level
- Who it's assigned to
- Progress percentage (0-100%)
- Number of retries
- Exact timestamp of last update

**Action Buttons** (do these things to your selected job):
- **Retry**: Restart a failed workflow
- **Pause**: Temporarily stop a running workflow
- **Cancel**: Stop and abandon the workflow (with confirmation)
- **Assign**: Take ownership of this job or assign it to yourself

**Use it to**: Understand what's happening with a specific job and take action

---

### 4. **Timeline Panel (Bottom Right)**
Shows a chronological log of everything that happened:
- **State changes**: When a job moved from one status to another
- **Operator actions**: When someone (like you) took action
- **System events**: Automatic updates from the system
- **Network events**: Connection issues or recoveries

Each event shows the exact time and any relevant details.

**Use it to**: Debug issues by seeing the complete history of a job

---

### 5. **Network Banner (Top)**
Always shows your current connection status:
- **Online/Offline/Reconnecting**: Your connection state
- **Lag (ms)**: How many milliseconds of delay (lower is better)
- **Dropped Updates**: Number of updates you missed
- **Heartbeat**: When the system last checked in

If data looks stale, click **"Resync now"** to get the latest info.

**Use it to**: Understand if network issues are causing problems

---

### 6. **Command Palette**
Quick access to common commands (press **Ctrl+K** or **Cmd+K**):
- **Focus first failed run** - Jumps to the first workflow that failed
- **Clear all filters** - Resets your view to show everything
- **Jump to timeline panel** - Switches focus to the Timeline

**Use it to**: Execute actions quickly without clicking around

---

### 7. **Keyboard Shortcuts**
Speed up your work with these shortcuts:
- **Ctrl+K / Cmd+K**: Open Command Palette
- **Arrow Up/Down**: Move between jobs in the queue
- **Enter**: Select a job and view details
- **Esc**: Clear error messages

**Use it to**: Work faster without using the mouse

---

## 🚀 How to Use Ops Cockpit

### Getting Started

**Step 1: Install and Run**
```bash
# Download dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5174/`

---

### Basic Workflow

**Step 1: Monitor the Queue**
- Look at the Queue Panel on the left
- You'll see all your workflows listed
- Pay attention to status colors (red = failed, green = success, blue = running)

**Step 2: Spot Problems**
- Red items = failed workflows that need attention
- Use filters to hide less important items
- Use search to find a specific workflow

**Step 3: Inspect Details**
- Click on any workflow to select it
- The Detail Inspector (top right) shows everything about that job
- The Timeline (bottom right) shows its complete history

**Step 4: Take Action**
- Click an action button (Retry, Pause, Cancel, Assign)
- Confirm any destructive actions (like Cancel)
- Watch the Timeline update in real-time

**Step 5: Monitor Network Status**
- Check the banner at the top
- If you see lag or dropped updates, click "Resync now"
- Network issues often explain why things seem stuck

---

### Common Tasks

**I need to restart a failed job:**
1. Find it in the Queue (filter by "failed" status if needed)
2. Click to select it
3. Click the "Retry" button in the Inspector

**I want to see only my jobs:**
1. In the Queue filters, change "Assignee" to "assigned to me"
2. Or click "Assign" on a job to claim it

**A job is stuck and won't complete:**
1. Select it in the Queue
2. Click "Cancel" to stop it
3. Check the Timeline to see what went wrong
4. Retry when you're ready

**I want to quickly jump to a problem:**
1. Press Ctrl+K to open Command Palette
2. Click "Focus first failed run"
3. The Inspector will show that job's details

---

## 🏗️ Technical Architecture

### Three Main Panels Work Together

**Queue Panel** ← → **Detail Inspector** ← → **Timeline Panel**

- Select something in Queue → Detail Inspector shows its info
- Details change → Timeline updates automatically
- All panels share data through a central store

### How Data Flows

1. **Server sends updates** - Jobs change status, events happen
2. **Store receives updates** - Central data hub gets notified
3. **Panels read from store** - All panels subscribe to get the latest
4. **You take action** - Clicking a button sends a command
5. **Store applies change** - The update is optimistic (happens immediately, confirmed later)

### Technology Stack

- **React 19**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Zustand**: Simple state management
- **Vite**: Lightning-fast build tool
- **React Router**: Page navigation
- **Vitest**: Testing framework

---

## 🧪 Testing & Building

**Run Tests:**
```bash
npm test          # Run once
npm run test:watch # Watch for changes
```

**Build for Production:**
```bash
npm run build
npm run preview  # Preview the production build
```

---

## 📋 Glossary (Simple Terms)

| Term | Meaning |
|------|---------|
| **Queue** | A list of all your jobs waiting to run |
| **Status** | The current state (running, failed, completed, etc.) |
| **Priority** | How urgent a job is (P0 = urgent, P2 = not urgent) |
| **Assignee** | The person responsible for this job |
| **Optimistic Update** | The UI changes immediately, confirmed by server later |
| **Timeline** | A chronological log of events |
| **Lag** | Delay in receiving updates (in milliseconds) |
| **Resync** | Refreshing data to make sure it's current |
| **Event** | Something that happened (state change, action, system event) |

---

## 🎓 Tips for Operators

✅ **DO:**
- Check the network banner first - it might explain weird behavior
- Use filters to focus on what needs attention
- Assign jobs to yourself so you can track them
- Review the Timeline before retrying a failed job
- Use keyboard shortcuts for speed

❌ **DON'T:**
- Panic if lag is high - the system will catch up
- Cancel jobs without checking the Timeline first
- Ignore network status warnings
- Assign jobs randomly - keep them organized

---

## 🐛 Troubleshooting

**"My data looks stale"**
- Check the Network Banner - does it say "offline"?
- Click "Resync now" to refresh
- Wait a few seconds for the connection to recover

**"A job won't update"**
- Check if it's in a pending action state
- The Timeline will show "optimistic action pending"
- Wait for server confirmation or refresh

**"I see a red error message"**
- Read what it says - it tells you what went wrong
- Click the X or press Esc to dismiss it
- Try the action again or reach out for help

---

## 💡 Need Help?

- **Monitor the Timeline** - It tells the complete story of what happened
- **Check the Network Banner** - Connection issues cause most problems  
- **Use filters** - Narrow down to find what you're looking for
- **Read error messages** - They explain what went wrong

---

Built with ❤️ for operations teams who manage complex workflows.
- on success: merge authoritative server update and event
- on failure: rollback from stored previous snapshot and show alert banner

## URL State Sync

`useUrlStateSync` stores and restores critical context through query params:

- `selected`
- `status`
- `assignee`
- `search`
- `panel`

Reloading restores operator context and panel focus.

## Performance Decisions

- Virtualized queue rendering using `react-window` (`FixedSizeList`)
- Derived filtering with memoization
- Per-surface selectors to reduce render blast radius
- Timeline capped to recent entries per run

## Failure Handling Strategy

The UI explicitly surfaces failure conditions:

- network banner for `online` / `offline` / `reconnecting`
- stale conflict warning when event sequences jump (missed updates)
- explicit resync action via snapshot pull
- optimistic rollback errors in banner
- destructive action confirmation dialog (`cancel`)

## Accessibility

- Keyboard traversal in queue (`ArrowUp`, `ArrowDown`, `Enter`)
- Focusable surfaces with clear roles
- Timeline log uses ARIA live updates
- Reduced-motion CSS support
- Command palette (Ctrl/Cmd+K)

## Folder Structure

```text
src/
  app/
  features/
    queue/
    details/
    timeline/
    common/
  hooks/
  services/
  state/
  types/
  utils/
```

## Tests Included

- optimistic update + rollback (`createOpsStore.test.ts`)
- filtering behavior (`queueFilters.test.ts`)
- panel synchronization selectors (`selectors.test.ts`)

## Trade-offs

- Service simulation is deterministic enough for UX validation, but not a replacement for full contract tests.
- Snapshot polling is retained in addition to stream updates for resilience and conflict recovery; this adds some duplication by design.
- Command palette is intentionally minimal and scoped to high-value operational shortcuts.
