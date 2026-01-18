# Epoch Goals

A minimalist Chrome extension that replaces your new tab page with a goal tracking dashboard. Stay focused on what matters across different time horizons.

![Epoch Goals Screenshot](https://raw.githubusercontent.com/akhilesh-w/epoch-goals/main/icons/icon128.png)

## Features

- 📅 **Multiple Views** - Track goals by day, week, month, quarter, or year
- ✅ **Subtasks** - Break down goals into manageable subtasks
- ⌨️ **Keyboard Navigation** - Full keyboard support for power users
- 🔄 **Recurring Tasks** - Set up daily, weekly, or monthly recurring goals
- 🎯 **Drag & Drop** - Reorder and reschedule tasks easily
- 💾 **Local Storage** - All data stays on your device

## Installation

### From Source (Developer Mode)

1. **Download the extension**
   ```bash
   git clone https://github.com/akhilesh-w/epoch-goals.git
   ```
   Or download as ZIP: Click the green **Code** button → **Download ZIP** → Extract

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `epoch-goals` folder

3. **Done!** Open a new tab to see Epoch Goals

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate between tasks |
| `←` `→` | Move between columns |
| `Enter` | Expand/collapse task |
| `Space` | Toggle completion |
| `e` | Edit task |
| `x` | Delete task |
| `Escape` | Close modal/cancel |

## Usage

- **Add a goal**: Click "+ Add goal" or navigate to it and press Enter
- **Add subtasks**: Click the expand arrow (▶) then "+ Add subtask"
- **Complete tasks**: Click the checkbox or press Space
- **Edit tasks**: Double-click or press `e`
- **Navigate time**: Use the `‹` `›` arrows next to the year

## Data Storage

All your goals are stored locally in your browser using `localStorage`. Your data never leaves your device.

## License

MIT
