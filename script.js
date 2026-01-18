// Epoch Goals - New Tab Extension
// Task management with localStorage persistence and multiple view modes

(function () {
  'use strict';

  // DOM Elements
  const columnsContainer = document.getElementById('columns');
  const prevWeekBtn = document.getElementById('prevWeek');
  const nextWeekBtn = document.getElementById('nextWeek');
  const currentYearEl = document.getElementById('currentYear');
  const backgroundEl = document.getElementById('background');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettings');
  const uploadBgBtn = document.getElementById('uploadBgBtn');
  const resetBgBtn = document.getElementById('resetBgBtn');
  const bgUpload = document.getElementById('bgUpload');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  // State
  let currentDate = new Date();
  let currentView = 'day'; // today, overview, day, week, month, quarter, year
  let expandedTasks = new Set(); // Track which tasks have expanded subtasks

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function getQuarterStart(date) {
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1);
  }

  function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  function formatMonthYear(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  function formatShortMonth(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  }

  // Use local date string to avoid timezone issues
  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // STORAGE FUNCTIONS
  // ============================================

  function getGoals() {
    try {
      const data = localStorage.getItem('epoch_goals');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading goals:', e);
      return {};
    }
  }

  function saveGoals(goals) {
    try {
      localStorage.setItem('epoch_goals', JSON.stringify(goals));
    } catch (e) {
      console.error('Error saving goals:', e);
    }
  }

  function addGoal(dateKey, title, options = {}) {
    const goals = getGoals();
    if (!goals[dateKey]) {
      goals[dateKey] = [];
    }
    goals[dateKey].push({
      id: Date.now().toString(),
      title: title,
      completed: false,
      subtasks: [],
      recurrence: options.recurrence || null // { type: 'daily' | 'weekly', days: [] }
    });
    saveGoals(goals);
    return goals;
  }

  function updateGoal(dateKey, goalId, newTitle) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal) {
        goal.title = newTitle;
        saveGoals(goals);
      }
    }
    return goals;
  }

  function toggleGoal(dateKey, goalId) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal) {
        goal.completed = !goal.completed;
        saveGoals(goals);
      }
    }
    return goals;
  }

  function deleteGoal(dateKey, goalId) {
    const goals = getGoals();
    if (goals[dateKey]) {
      goals[dateKey] = goals[dateKey].filter(g => g.id !== goalId);
      expandedTasks.delete(goalId);
      saveGoals(goals);
    }
    return goals;
  }

  // Subtask functions
  function addSubtask(dateKey, goalId, title) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal) {
        if (!goal.subtasks) goal.subtasks = [];
        goal.subtasks.push({
          id: Date.now().toString(),
          title: title,
          completed: false
        });
        saveGoals(goals);
      }
    }
    return goals;
  }

  function toggleSubtask(dateKey, goalId, subtaskId) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal && goal.subtasks) {
        const subtask = goal.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
          subtask.completed = !subtask.completed;
          saveGoals(goals);
        }
      }
    }
    return goals;
  }

  function deleteSubtask(dateKey, goalId, subtaskId) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal && goal.subtasks) {
        goal.subtasks = goal.subtasks.filter(s => s.id !== subtaskId);
        saveGoals(goals);
      }
    }
    return goals;
  }

  function updateSubtask(dateKey, goalId, subtaskId, newTitle) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const goal = goals[dateKey].find(g => g.id === goalId);
      if (goal && goal.subtasks) {
        const subtask = goal.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
          subtask.title = newTitle;
          saveGoals(goals);
        }
      }
    }
    return goals;
  }

  // Reorder tasks (for drag & drop)
  function reorderGoals(dateKey, goalId, newIndex) {
    const goals = getGoals();
    if (goals[dateKey]) {
      const currentIndex = goals[dateKey].findIndex(g => g.id === goalId);
      if (currentIndex !== -1 && currentIndex !== newIndex) {
        const [moved] = goals[dateKey].splice(currentIndex, 1);
        goals[dateKey].splice(newIndex, 0, moved);
        saveGoals(goals);
      }
    }
    return goals;
  }

  // Move task between dates
  function moveGoal(fromDateKey, toDateKey, goalId) {
    const goals = getGoals();
    if (goals[fromDateKey]) {
      const goalIndex = goals[fromDateKey].findIndex(g => g.id === goalId);
      if (goalIndex !== -1) {
        const [goal] = goals[fromDateKey].splice(goalIndex, 1);
        if (!goals[toDateKey]) goals[toDateKey] = [];
        goals[toDateKey].push(goal);
        saveGoals(goals);
      }
    }
    return goals;
  }

  // ============================================
  // INLINE INPUT (ADD)
  // ============================================

  function createInlineInput(dateKey, container) {
    const existing = container.querySelector('.inline-input-container');
    if (existing) {
      existing.querySelector('input').focus();
      return;
    }

    const inputContainer = document.createElement('div');
    inputContainer.className = 'inline-input-container';
    inputContainer.innerHTML = `
      <input type="text" class="inline-input" placeholder="Add a goal..." data-date="${dateKey}">
    `;

    const addGoalBtn = container.querySelector('.add-goal');
    if (addGoalBtn) {
      addGoalBtn.style.display = 'none';
    }

    container.querySelector('.tasks-list').appendChild(inputContainer);

    const input = inputContainer.querySelector('input');
    let saved = false; // Flag to prevent double save

    input.focus();

    function saveAndClose() {
      if (saved) return;
      const value = input.value.trim();
      if (value) {
        saved = true;
        const goals = addGoal(dateKey, value);
        // Get the newly created goal's ID
        const dayGoals = goals[dateKey] || [];
        const newGoal = dayGoals[dayGoals.length - 1];
        if (newGoal) {
          // Auto-expand the new task
          expandedTasks.add(newGoal.id);
        }
        render();
        // Focus on subtask input after render
        setTimeout(() => {
          const subtasksContainer = columnsContainer.querySelector(`[data-id="${newGoal.id}"] .subtasks-container`);
          if (subtasksContainer) {
            createSubtaskInput(subtasksContainer, dateKey, newGoal.id);
          }
        }, 50);
      } else {
        closeInput();
      }
    }

    function closeInput() {
      inputContainer.remove();
      if (addGoalBtn) addGoalBtn.style.display = 'flex';
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveAndClose();
      } else if (e.key === 'Escape') {
        saved = true; // Prevent blur from saving
        closeInput();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!saved) {
          saveAndClose();
        }
      }, 50);
    });
  }

  // ============================================
  // INLINE EDIT
  // ============================================

  function createEditInput(taskEl, goal, dateKey) {
    const titleEl = taskEl.querySelector('.task-title');
    const originalText = goal.title;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-input edit-input';
    input.value = originalText;

    titleEl.innerHTML = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    let saved = false;

    function saveEdit() {
      if (saved) return;
      const newValue = input.value.trim();
      if (newValue && newValue !== originalText) {
        saved = true;
        updateGoal(dateKey, goal.id, newValue);
        render();
      } else if (!newValue) {
        // Delete if empty
        saved = true;
        deleteGoal(dateKey, goal.id);
        render();
      } else {
        saved = true;
        render();
      }
    }

    function cancelEdit() {
      saved = true;
      render();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!saved) saveEdit();
      }, 50);
    });
  }

  // ============================================
  // RENDER COMPONENTS
  // ============================================

  function createTaskElement(goal, dateKey, showDate = false) {
    const hasSubtasks = goal.subtasks && goal.subtasks.length > 0;
    const isExpanded = expandedTasks.has(goal.id);

    // Wrapper for task + subtasks
    const wrapper = document.createElement('div');
    wrapper.className = 'task-wrapper';
    wrapper.dataset.id = goal.id;
    wrapper.dataset.date = dateKey;

    // Main task row
    const task = document.createElement('div');
    task.className = `task ${goal.completed ? 'completed' : ''}`;
    task.draggable = true;

    task.innerHTML = `
      <button class="task-expand ${isExpanded ? 'expanded' : ''}" data-goal-id="${goal.id}">▶</button>
      <div class="task-checkbox ${goal.completed ? 'checked' : ''}" data-goal-id="${goal.id}" data-date="${dateKey}"></div>
      <div class="task-content">
        <div class="task-title">${escapeHtml(goal.title)}${goal.recurrence ? '<span class="task-recurring">🔄</span>' : ''}</div>
        ${showDate ? `<div class="task-date">${dateKey}</div>` : ''}
      </div>
      <button class="task-delete" data-goal-id="${goal.id}" data-date="${dateKey}" title="Delete">🗑</button>
    `;

    // Expand/collapse subtasks
    const expandBtn = task.querySelector('.task-expand');
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (expandedTasks.has(goal.id)) {
        expandedTasks.delete(goal.id);
      } else {
        expandedTasks.add(goal.id);
      }
      render();
    });

    // Checkbox click handler
    const checkbox = task.querySelector('.task-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGoal(dateKey, goal.id);
      render();
    });

    // Delete button
    const deleteBtn = task.querySelector('.task-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteGoal(dateKey, goal.id);
      render();
    });

    // Double-click to edit
    const titleEl = task.querySelector('.task-title');
    titleEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (!goal.completed) {
        createEditInput(task, goal, dateKey);
      }
    });

    // Drag & drop
    task.addEventListener('dragstart', (e) => {
      task.classList.add('dragging');
      e.dataTransfer.setData('text/plain', JSON.stringify({ goalId: goal.id, dateKey }));
      e.dataTransfer.effectAllowed = 'move';
    });

    task.addEventListener('dragend', () => {
      task.classList.remove('dragging');
      document.querySelectorAll('.task.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    task.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      task.classList.add('drag-over');
    });

    task.addEventListener('dragleave', () => {
      task.classList.remove('drag-over');
    });

    task.addEventListener('drop', (e) => {
      e.preventDefault();
      task.classList.remove('drag-over');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.goalId !== goal.id) {
          const tasksList = wrapper.parentElement;
          const tasks = Array.from(tasksList.querySelectorAll('.task-wrapper'));
          const dropIndex = tasks.indexOf(wrapper);
          if (data.dateKey === dateKey) {
            reorderGoals(dateKey, data.goalId, dropIndex);
          } else {
            moveGoal(data.dateKey, dateKey, data.goalId);
          }
          render();
        }
      } catch (err) { }
    });

    wrapper.appendChild(task);

    // Render subtasks if expanded
    if (isExpanded) {
      const subtasksContainer = document.createElement('div');
      subtasksContainer.className = 'subtasks-container';

      // Existing subtasks
      (goal.subtasks || []).forEach(subtask => {
        const subtaskEl = document.createElement('div');
        subtaskEl.className = `subtask ${subtask.completed ? 'completed' : ''}`;
        subtaskEl.innerHTML = `
          <div class="subtask-checkbox ${subtask.completed ? 'checked' : ''}" data-subtask-id="${subtask.id}"></div>
          <span class="subtask-title">${escapeHtml(subtask.title)}</span>
          <button class="subtask-delete" title="Delete">×</button>
        `;

        // Toggle subtask
        subtaskEl.querySelector('.subtask-checkbox').addEventListener('click', () => {
          toggleSubtask(dateKey, goal.id, subtask.id);
          render();
        });

        // Double-click to edit subtask
        const subtaskTitle = subtaskEl.querySelector('.subtask-title');
        subtaskTitle.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          if (!subtask.completed) {
            createSubtaskEditInput(subtaskEl, dateKey, goal.id, subtask);
          }
        });

        // Delete subtask
        subtaskEl.querySelector('.subtask-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSubtask(dateKey, goal.id, subtask.id);
          render();
        });

        subtasksContainer.appendChild(subtaskEl);
      });

      // Add subtask button (styled like "+ Add goal")
      const addSubtaskEl = document.createElement('div');
      addSubtaskEl.className = 'add-subtask';
      addSubtaskEl.innerHTML = '<span class="add-subtask-icon">+</span><span>Add subtask</span>';
      addSubtaskEl.addEventListener('click', (e) => {
        e.stopPropagation();
        createSubtaskInput(subtasksContainer, dateKey, goal.id);
      });
      subtasksContainer.appendChild(addSubtaskEl);

      wrapper.appendChild(subtasksContainer);
    }

    return wrapper;
  }

  // Edit subtask inline
  function createSubtaskEditInput(subtaskEl, dateKey, goalId, subtask) {
    const titleEl = subtaskEl.querySelector('.subtask-title');
    const originalText = subtask.title;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'subtask-input';
    input.value = originalText;

    titleEl.innerHTML = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    let saved = false;

    function saveEdit() {
      if (saved) return;
      const newValue = input.value.trim();
      if (newValue && newValue !== originalText) {
        saved = true;
        updateSubtask(dateKey, goalId, subtask.id, newValue);
        render();
      } else if (!newValue) {
        saved = true;
        deleteSubtask(dateKey, goalId, subtask.id);
        render();
      } else {
        saved = true;
        render();
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        saved = true;
        render();
      }
    });

    input.addEventListener('blur', () => setTimeout(() => { if (!saved) saveEdit(); }, 50));
  }

  function createSubtaskInput(container, dateKey, goalId) {
    const existing = container.querySelector('.subtask-input');
    if (existing) {
      existing.focus();
      return;
    }

    const addBtn = container.querySelector('.add-subtask');
    if (addBtn) addBtn.style.display = 'none';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'subtask';
    inputWrapper.innerHTML = `<input type="text" class="subtask-input" placeholder="Subtask...">`;

    container.insertBefore(inputWrapper, container.querySelector('.add-subtask'));

    const input = inputWrapper.querySelector('input');
    let saved = false;
    input.focus();

    function save() {
      if (saved) return;
      const value = input.value.trim();
      if (value) {
        saved = true;
        addSubtask(dateKey, goalId, value);
        render();
      } else {
        close();
      }
    }

    function close() {
      saved = true;
      inputWrapper.remove();
      if (addBtn) addBtn.style.display = 'flex';
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        close();
      }
    });

    input.addEventListener('blur', () => setTimeout(() => { if (!saved) save(); }, 50));
  }

  function renderColumn(date, options = {}) {
    const dateKey = getDateKey(date);
    const goals = getGoals();
    const dayGoals = goals[dateKey] || [];
    const isTodayDate = isToday(date);
    const { compact = false } = options;

    const column = document.createElement('div');
    column.className = 'column' + (compact ? ' column-compact' : '');
    column.dataset.date = dateKey;

    column.innerHTML = `
      <div class="column-header">
        <span class="column-date">${formatDate(date)}</span>
        ${isTodayDate ? '<span class="current-badge">Current</span>' : ''}
      </div>
      <div class="column-content">
        <div class="tasks-list"></div>
        <div class="add-goal" data-date="${dateKey}">
          <span class="add-goal-icon">+</span>
          <span>Add goal</span>
        </div>
      </div>
    `;

    const tasksList = column.querySelector('.tasks-list');
    dayGoals.forEach(goal => {
      const taskEl = createTaskElement(goal, dateKey);
      tasksList.appendChild(taskEl);
    });

    const addGoalBtn = column.querySelector('.add-goal');
    addGoalBtn.addEventListener('click', () => {
      createInlineInput(dateKey, column.querySelector('.column-content'));
    });

    return column;
  }

  // ============================================
  // VIEW RENDERERS
  // ============================================

  function renderTodayView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-today';

    const today = new Date();
    const column = renderColumn(today);
    column.classList.add('column-wide');
    columnsContainer.appendChild(column);

    currentYearEl.textContent = today.getFullYear();
  }

  function renderDayView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-day';

    // Calculate start date to center around currentDate
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 1);

    for (let i = 0; i < 4; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const column = renderColumn(date);
      columnsContainer.appendChild(column);
    }

    currentYearEl.textContent = currentDate.getFullYear();
  }

  function renderWeekView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-week';

    const weekStart = getWeekStart(currentDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const column = renderColumn(date, { compact: true });
      columnsContainer.appendChild(column);
    }

    currentYearEl.textContent = currentDate.getFullYear();
  }

  function renderMonthView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-month';

    const monthStart = getMonthStart(currentDate);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthContainer = document.createElement('div');
    monthContainer.className = 'month-container';

    // Month header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header-title';
    monthHeader.textContent = formatMonthYear(currentDate);
    monthContainer.appendChild(monthHeader);

    // Day headers
    const dayHeaders = document.createElement('div');
    dayHeaders.className = 'month-day-headers';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
      const h = document.createElement('div');
      h.className = 'month-day-header';
      h.textContent = day;
      dayHeaders.appendChild(h);
    });
    monthContainer.appendChild(dayHeaders);

    // Calendar grid
    const grid = document.createElement('div');
    grid.className = 'month-grid';

    // Padding for first week
    const firstDayOfWeek = (monthStart.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.className = 'month-day empty';
      grid.appendChild(empty);
    }

    // Days
    const goals = getGoals();
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const dayGoals = goals[dateKey] || [];
      const isTodayDate = isToday(date);

      const dayEl = document.createElement('div');
      dayEl.className = 'month-day' + (isTodayDate ? ' today' : '');
      dayEl.dataset.date = dateKey;

      dayEl.innerHTML = `
        <div class="month-day-number">${day}</div>
        <div class="month-day-tasks">
          ${dayGoals.slice(0, 3).map(g => `
            <div class="month-task ${g.completed ? 'completed' : ''}">${escapeHtml(g.title)}</div>
          `).join('')}
          ${dayGoals.length > 3 ? `<div class="month-task-more">+${dayGoals.length - 3} more</div>` : ''}
        </div>
        <div class="month-day-add">+</div>
      `;

      dayEl.querySelector('.month-day-add').addEventListener('click', (e) => {
        e.stopPropagation();
        currentDate = new Date(date);
        setView('day');
        setTimeout(() => {
          const col = columnsContainer.querySelector(`[data-date="${dateKey}"]`);
          if (col) {
            createInlineInput(dateKey, col.querySelector('.column-content'));
          }
        }, 50);
      });

      dayEl.addEventListener('click', () => {
        currentDate = new Date(date);
        setView('day');
      });

      grid.appendChild(dayEl);
    }

    monthContainer.appendChild(grid);
    columnsContainer.appendChild(monthContainer);

    currentYearEl.textContent = currentDate.getFullYear();
  }

  function renderQuarterView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-quarter';

    const quarterStart = getQuarterStart(currentDate);
    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
    const goals = getGoals();

    const container = document.createElement('div');
    container.className = 'quarter-container';

    // Quarter header
    const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
    const quarterIndex = Math.floor(quarterStart.getMonth() / 3);
    const quarterHeader = document.createElement('div');
    quarterHeader.className = 'quarter-header';
    quarterHeader.innerHTML = `
      <div class="quarter-title">${quarterNames[quarterIndex]} ${quarterStart.getFullYear()}</div>
      <div class="quarter-subtitle">${formatShortMonth(quarterStart)} - ${formatShortMonth(quarterEnd)}</div>
    `;
    container.appendChild(quarterHeader);

    // Calculate quarter stats
    let totalTasks = 0;
    let completedTasks = 0;
    const monthStats = [];

    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + m, 1);
      const monthEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + m + 1, 0);
      let monthTotal = 0;
      let monthCompleted = 0;

      for (let d = 1; d <= monthEnd.getDate(); d++) {
        const date = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + m, d);
        const dateKey = getDateKey(date);
        const dayGoals = goals[dateKey] || [];
        monthTotal += dayGoals.length;
        monthCompleted += dayGoals.filter(g => g.completed).length;
      }

      totalTasks += monthTotal;
      completedTasks += monthCompleted;
      monthStats.push({
        name: formatShortMonth(monthDate),
        month: monthDate,
        total: monthTotal,
        completed: monthCompleted,
        progress: monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0
      });
    }

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Stats cards
    const statsRow = document.createElement('div');
    statsRow.className = 'quarter-stats';
    statsRow.innerHTML = `
      <div class="stat-card stat-total">
        <div class="stat-value">${totalTasks}</div>
        <div class="stat-label">Total Goals</div>
      </div>
      <div class="stat-card stat-completed">
        <div class="stat-value">${completedTasks}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card stat-pending">
        <div class="stat-value">${totalTasks - completedTasks}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card stat-progress">
        <div class="stat-value">${overallProgress}%</div>
        <div class="stat-label">Progress</div>
      </div>
    `;
    container.appendChild(statsRow);

    // Month progress bars
    const monthsSection = document.createElement('div');
    monthsSection.className = 'quarter-months';

    monthStats.forEach(stat => {
      const monthRow = document.createElement('div');
      monthRow.className = 'month-progress-row';
      monthRow.innerHTML = `
        <div class="month-progress-label">${stat.name}</div>
        <div class="month-progress-bar">
          <div class="month-progress-fill" style="width: ${stat.progress}%"></div>
        </div>
        <div class="month-progress-text">${stat.completed}/${stat.total}</div>
      `;
      monthRow.addEventListener('click', () => {
        currentDate = new Date(stat.month);
        setView('month');
      });
      monthsSection.appendChild(monthRow);
    });

    container.appendChild(monthsSection);

    // Recent tasks in this quarter
    const recentSection = document.createElement('div');
    recentSection.className = 'quarter-recent';
    recentSection.innerHTML = '<div class="quarter-section-title">Recent in this quarter</div>';

    const recentTasks = document.createElement('div');
    recentTasks.className = 'quarter-recent-tasks';

    // Get recent uncompleted tasks from this quarter
    const today = new Date();
    for (let day = 0; day < 14; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() - day);
      if (date < quarterStart || date > quarterEnd) continue;

      const dateKey = getDateKey(date);
      const dayGoals = (goals[dateKey] || []).filter(g => !g.completed);

      dayGoals.slice(0, 3).forEach(goal => {
        const taskEl = document.createElement('div');
        taskEl.className = 'quarter-task';
        taskEl.innerHTML = `
          <div class="quarter-task-date">${formatDate(date)}</div>
          <div class="quarter-task-title">${escapeHtml(goal.title)}</div>
        `;
        taskEl.addEventListener('click', () => {
          currentDate = new Date(date);
          setView('day');
        });
        recentTasks.appendChild(taskEl);
      });
    }

    if (recentTasks.children.length === 0) {
      recentTasks.innerHTML = '<div class="quarter-empty">No pending tasks in the last 2 weeks</div>';
    }

    recentSection.appendChild(recentTasks);
    container.appendChild(recentSection);

    columnsContainer.appendChild(container);
    currentYearEl.textContent = currentDate.getFullYear();
  }

  function renderYearView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-year';

    const yearContainer = document.createElement('div');
    yearContainer.className = 'year-grid';

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(currentDate.getFullYear(), m, 1);
      const miniMonth = createMiniMonth(monthDate, true);
      yearContainer.appendChild(miniMonth);
    }

    columnsContainer.appendChild(yearContainer);
    currentYearEl.textContent = currentDate.getFullYear();
  }

  function createMiniMonth(monthDate, tiny = false) {
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const goals = getGoals();

    const container = document.createElement('div');
    container.className = 'mini-month' + (tiny ? ' mini-month-tiny' : '');

    const header = document.createElement('div');
    header.className = 'mini-month-header';
    header.textContent = formatShortMonth(monthDate);
    header.addEventListener('click', () => {
      currentDate = new Date(monthDate);
      setView('month');
    });
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'mini-month-grid';

    // Padding
    const firstDayOfWeek = (monthDate.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.className = 'mini-day empty';
      grid.appendChild(empty);
    }

    // Days
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const dayGoals = goals[dateKey] || [];
      const hasGoals = dayGoals.length > 0;
      const allComplete = dayGoals.length > 0 && dayGoals.every(g => g.completed);
      const isTodayDate = isToday(date);

      const dayEl = document.createElement('div');
      dayEl.className = 'mini-day';
      if (isTodayDate) dayEl.classList.add('today');
      if (hasGoals) dayEl.classList.add('has-goals');
      if (allComplete) dayEl.classList.add('all-complete');
      dayEl.textContent = day;

      dayEl.addEventListener('click', () => {
        currentDate = new Date(date);
        setView('day');
      });

      grid.appendChild(dayEl);
    }

    container.appendChild(grid);
    return container;
  }

  function renderOverviewView() {
    columnsContainer.innerHTML = '';
    columnsContainer.className = 'columns view-overview';

    const goals = getGoals();

    // Collect all tasks into completed and uncompleted
    const uncompleted = [];
    const completed = [];

    Object.keys(goals).sort().reverse().forEach(dateKey => {
      const dayGoals = goals[dateKey];
      const date = new Date(dateKey + 'T12:00:00');

      dayGoals.forEach(goal => {
        const item = { ...goal, dateKey, date };
        if (goal.completed) {
          completed.push(item);
        } else {
          uncompleted.push(item);
        }
      });
    });

    const container = document.createElement('div');
    container.className = 'overview-columns';

    // Uncompleted column
    const uncompletedCol = document.createElement('div');
    uncompletedCol.className = 'overview-column';
    uncompletedCol.innerHTML = `
      <div class="overview-column-header">
        <span class="overview-column-title">📋 To Do</span>
        <span class="overview-column-count">${uncompleted.length}</span>
      </div>
    `;
    const uncompletedList = document.createElement('div');
    uncompletedList.className = 'overview-column-list';

    if (uncompleted.length === 0) {
      uncompletedList.innerHTML = '<div class="overview-empty-col">No pending tasks!</div>';
    } else {
      uncompleted.forEach(item => {
        const taskEl = createOverviewTask(item);
        uncompletedList.appendChild(taskEl);
      });
    }
    uncompletedCol.appendChild(uncompletedList);

    // Completed column
    const completedCol = document.createElement('div');
    completedCol.className = 'overview-column completed-column';
    completedCol.innerHTML = `
      <div class="overview-column-header">
        <span class="overview-column-title">✅ Done</span>
        <span class="overview-column-count">${completed.length}</span>
      </div>
    `;
    const completedList = document.createElement('div');
    completedList.className = 'overview-column-list';

    if (completed.length === 0) {
      completedList.innerHTML = '<div class="overview-empty-col">No completed tasks yet</div>';
    } else {
      completed.forEach(item => {
        const taskEl = createOverviewTask(item);
        completedList.appendChild(taskEl);
      });
    }
    completedCol.appendChild(completedList);

    container.appendChild(uncompletedCol);
    container.appendChild(completedCol);
    columnsContainer.appendChild(container);
    currentYearEl.textContent = new Date().getFullYear();
  }

  function createOverviewTask(item) {
    const taskEl = document.createElement('div');
    taskEl.className = 'overview-task-item' + (item.completed ? ' completed' : '');
    taskEl.innerHTML = `
      <div class="overview-task-checkbox ${item.completed ? 'checked' : ''}" data-id="${item.id}" data-date="${item.dateKey}"></div>
      <div class="overview-task-content">
        <div class="overview-task-title">${escapeHtml(item.title)}</div>
        <div class="overview-task-date">${formatDate(item.date)}</div>
      </div>
    `;

    const checkbox = taskEl.querySelector('.overview-task-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGoal(item.dateKey, item.id);
      render();
    });

    taskEl.addEventListener('click', () => {
      currentDate = new Date(item.date);
      setView('day');
    });

    return taskEl;
  }

  // ============================================
  // VIEW SWITCHING
  // ============================================

  function setView(view) {
    currentView = view;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === view);
    });
    render();
  }

  function render() {
    switch (currentView) {
      case 'today':
        renderTodayView();
        break;
      case 'overview':
        renderOverviewView();
        break;
      case 'day':
        renderDayView();
        break;
      case 'week':
        renderWeekView();
        break;
      case 'month':
        renderMonthView();
        break;
      case 'quarter':
        renderQuarterView();
        break;
      case 'year':
        renderYearView();
        break;
      default:
        renderDayView();
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  function navigate(direction) {
    const delta = direction === 'prev' ? -1 : 1;

    switch (currentView) {
      case 'today':
        // No navigation for today
        break;
      case 'day':
        currentDate.setDate(currentDate.getDate() + (delta * 4));
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + (delta * 7));
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + delta);
        break;
      case 'quarter':
        currentDate.setMonth(currentDate.getMonth() + (delta * 3));
        break;
      case 'year':
        currentDate.setFullYear(currentDate.getFullYear() + delta);
        break;
    }

    render();
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  prevWeekBtn.addEventListener('click', () => navigate('prev'));
  nextWeekBtn.addEventListener('click', () => navigate('next'));

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
      setView(this.dataset.view);
    });
  });

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    switch (key) {
      case 'n':
        // Add new goal to today
        e.preventDefault();
        currentDate = new Date();
        setView('day');
        setTimeout(() => {
          const todayKey = getDateKey(new Date());
          const col = columnsContainer.querySelector(`[data-date="${todayKey}"]`);
          if (col) {
            createInlineInput(todayKey, col.querySelector('.column-content'));
          }
        }, 50);
        break;
      case 't':
        e.preventDefault();
        setView('today');
        break;
      case 'd':
        e.preventDefault();
        setView('day');
        break;
      case 'w':
        e.preventDefault();
        setView('week');
        break;
      case 'm':
        e.preventDefault();
        setView('month');
        break;
      case 'q':
        e.preventDefault();
        setView('quarter');
        break;
      case 'y':
        e.preventDefault();
        setView('year');
        break;
      case 'o':
        e.preventDefault();
        setView('overview');
        break;
      case 'escape':
        // Close settings modal
        settingsModal.classList.remove('active');
        clearFocus();
        break;
      case 'arrowdown':
      case 'j':
        // Move down in current column
        e.preventDefault();
        navigateVertical(1);
        break;
      case 'arrowup':
      case 'k':
        // Move up in current column
        e.preventDefault();
        navigateVertical(-1);
        break;
      case 'arrowright':
        // Move to next column
        e.preventDefault();
        navigateColumn(1);
        break;
      case 'arrowleft':
        // Move to previous column
        e.preventDefault();
        navigateColumn(-1);
        break;
      case 'enter':
        // Expand/collapse or add goal
        e.preventDefault();
        handleEnter();
        break;
      case 'e':
        // Edit current task
        e.preventDefault();
        editCurrentTask();
        break;
      case ' ':
        // Toggle current task completion
        e.preventDefault();
        toggleCurrentTask();
        break;
      case 'x':
        // Delete current task
        e.preventDefault();
        deleteCurrentTask();
        break;
    }
  });

  // Navigation state: track current column and row
  let focusedColIndex = -1;
  let focusedRowIndex = -1; // Index into flat list of navigable items

  function getColumns() {
    return Array.from(columnsContainer.querySelectorAll('.column'));
  }

  function getColumnNavigableItems(column) {
    // Build flat list of all navigable items: tasks, subtasks (if expanded), add-subtask, add-goal
    const items = [];
    const taskWrappers = Array.from(column.querySelectorAll('.task-wrapper'));

    taskWrappers.forEach(wrapper => {
      const goalId = wrapper.dataset.id;
      const isExpanded = expandedTasks.has(goalId);

      // Add the task itself
      items.push({ type: 'task', element: wrapper, goalId, dateKey: wrapper.dataset.date });

      // If expanded, add subtasks and add-subtask button
      if (isExpanded) {
        const subtasks = wrapper.querySelectorAll('.subtask');
        subtasks.forEach((subtask, idx) => {
          const checkbox = subtask.querySelector('.subtask-checkbox');
          const subtaskId = checkbox ? checkbox.dataset.subtaskId : null;
          items.push({ type: 'subtask', element: subtask, goalId, subtaskId, dateKey: wrapper.dataset.date });
        });

        const addSubtaskBtn = wrapper.querySelector('.add-subtask');
        if (addSubtaskBtn) {
          items.push({ type: 'add-subtask', element: addSubtaskBtn, goalId, dateKey: wrapper.dataset.date });
        }
      }
    });

    // Add the add-goal button
    const addBtn = column.querySelector('.add-goal');
    if (addBtn) {
      items.push({ type: 'add-goal', element: addBtn, dateKey: column.dataset.date });
    }

    return items;
  }

  function clearFocus() {
    document.querySelectorAll('.task-focused, .subtask-focused, .add-goal-focused, .add-subtask-focused').forEach(el => {
      el.classList.remove('task-focused', 'subtask-focused', 'add-goal-focused', 'add-subtask-focused');
    });
  }

  function applyFocus() {
    clearFocus();
    const columns = getColumns();
    if (focusedColIndex < 0 || focusedColIndex >= columns.length) return;

    const column = columns[focusedColIndex];
    const items = getColumnNavigableItems(column);

    if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
      const item = items[focusedRowIndex];
      const focusClass = item.type === 'task' ? 'task-focused' :
        item.type === 'subtask' ? 'subtask-focused' :
          item.type === 'add-subtask' ? 'add-subtask-focused' :
            'add-goal-focused';
      item.element.classList.add(focusClass);
      item.element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function navigateVertical(direction) {
    const columns = getColumns();
    if (columns.length === 0) return;

    // Initialize to first column if not set
    if (focusedColIndex < 0) {
      focusedColIndex = 0;
      focusedRowIndex = 0;
      applyFocus();
      return;
    }

    const column = columns[focusedColIndex];
    const items = getColumnNavigableItems(column);

    if (direction > 0) {
      // Moving down
      if (focusedRowIndex < items.length - 1) {
        focusedRowIndex++;
      }
    } else {
      // Moving up
      if (focusedRowIndex > 0) {
        focusedRowIndex--;
      }
    }

    applyFocus();
  }

  function navigateColumn(direction) {
    const columns = getColumns();
    if (columns.length === 0) return;

    // Initialize
    if (focusedColIndex < 0) {
      focusedColIndex = 0;
      focusedRowIndex = 0;
      applyFocus();
      return;
    }

    const newColIndex = focusedColIndex + direction;
    if (newColIndex < 0 || newColIndex >= columns.length) return;

    // Get current item type to try to find similar position
    const oldColumn = columns[focusedColIndex];
    const oldItems = getColumnNavigableItems(oldColumn);
    const oldItem = oldItems[focusedRowIndex];

    focusedColIndex = newColIndex;

    const newColumn = columns[focusedColIndex];
    const newItems = getColumnNavigableItems(newColumn);

    // Try to maintain similar row position
    if (focusedRowIndex >= newItems.length) {
      focusedRowIndex = Math.max(0, newItems.length - 1);
    }

    applyFocus();
  }

  function handleEnter() {
    const columns = getColumns();
    if (focusedColIndex < 0 || focusedColIndex >= columns.length) return;

    const column = columns[focusedColIndex];
    const items = getColumnNavigableItems(column);

    if (focusedRowIndex < 0 || focusedRowIndex >= items.length) return;

    const item = items[focusedRowIndex];

    if (item.type === 'add-goal') {
      // Trigger add goal
      createInlineInput(item.dateKey, column.querySelector('.column-content'));
    } else if (item.type === 'add-subtask') {
      // Trigger add subtask
      const subtasksContainer = item.element.parentElement;
      createSubtaskInput(subtasksContainer, item.dateKey, item.goalId);
    } else if (item.type === 'task') {
      // Toggle expand/collapse
      if (expandedTasks.has(item.goalId)) {
        expandedTasks.delete(item.goalId);
      } else {
        expandedTasks.add(item.goalId);
      }
      render();
      setTimeout(() => applyFocus(), 50);
    } else if (item.type === 'subtask') {
      // Toggle subtask completion
      toggleSubtask(item.dateKey, item.goalId, item.subtaskId);
      render();
      setTimeout(() => applyFocus(), 50);
    }
  }

  function getFocusedItem() {
    const columns = getColumns();
    if (focusedColIndex < 0 || focusedColIndex >= columns.length) return null;

    const column = columns[focusedColIndex];
    const items = getColumnNavigableItems(column);

    if (focusedRowIndex >= 0 && focusedRowIndex < items.length) {
      return items[focusedRowIndex];
    }
    return null;
  }

  function getFocusedTask() {
    const item = getFocusedItem();
    if (item && item.type === 'task') {
      return item.element;
    }
    return null;
  }

  function toggleCurrentTask() {
    const item = getFocusedItem();
    if (!item) return;

    if (item.type === 'task') {
      toggleGoal(item.dateKey, item.goalId);
      render();
      setTimeout(() => applyFocus(), 50);
    } else if (item.type === 'subtask') {
      toggleSubtask(item.dateKey, item.goalId, item.subtaskId);
      render();
      setTimeout(() => applyFocus(), 50);
    }
  }

  function editCurrentTask() {
    const item = getFocusedItem();
    if (!item) return;

    if (item.type === 'task') {
      const goals = getGoals();
      if (goals[item.dateKey]) {
        const goal = goals[item.dateKey].find(g => g.id === item.goalId);
        if (goal && !goal.completed) {
          const taskEl = item.element.querySelector('.task');
          createEditInput(taskEl, goal, item.dateKey);
        }
      }
    } else if (item.type === 'subtask') {
      // Edit subtask
      const goals = getGoals();
      if (goals[item.dateKey]) {
        const goal = goals[item.dateKey].find(g => g.id === item.goalId);
        if (goal && goal.subtasks) {
          const subtask = goal.subtasks.find(s => s.id === item.subtaskId);
          if (subtask && !subtask.completed) {
            createSubtaskEditInput(item.element, item.dateKey, item.goalId, subtask);
          }
        }
      }
    }
  }

  function deleteCurrentTask() {
    const item = getFocusedItem();
    if (!item) return;

    if (item.type === 'task') {
      deleteGoal(item.dateKey, item.goalId);
      render();
      setTimeout(() => applyFocus(), 50);
    } else if (item.type === 'subtask') {
      deleteSubtask(item.dateKey, item.goalId, item.subtaskId);
      render();
      setTimeout(() => applyFocus(), 50);
    }
  }

  // ============================================
  // SETTINGS MODAL
  // ============================================

  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });

  // ============================================
  // CUSTOM BACKGROUND
  // ============================================

  uploadBgBtn.addEventListener('click', () => {
    bgUpload.click();
  });

  bgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        localStorage.setItem('epoch_custom_bg', imageData);
        applyCustomBackground(imageData);
      };
      reader.readAsDataURL(file);
    }
  });

  resetBgBtn.addEventListener('click', () => {
    localStorage.removeItem('epoch_custom_bg');
    backgroundEl.style.backgroundImage = '';
  });

  function applyCustomBackground(imageData) {
    if (imageData) {
      backgroundEl.style.backgroundImage = `url(${imageData})`;
      backgroundEl.style.backgroundSize = 'cover';
      backgroundEl.style.backgroundPosition = 'center';
    }
  }

  // ============================================
  // EXPORT / IMPORT
  // ============================================

  exportBtn.addEventListener('click', () => {
    const goals = getGoals();
    const data = JSON.stringify(goals, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epoch-goals-${getDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedGoals = JSON.parse(event.target.result);
          const currentGoals = getGoals();

          // Merge imported goals with current
          Object.keys(importedGoals).forEach(dateKey => {
            if (!currentGoals[dateKey]) {
              currentGoals[dateKey] = [];
            }
            // Add goals that don't already exist (by id)
            importedGoals[dateKey].forEach(goal => {
              if (!currentGoals[dateKey].find(g => g.id === goal.id)) {
                currentGoals[dateKey].push(goal);
              }
            });
          });

          saveGoals(currentGoals);
          render();
          settingsModal.classList.remove('active');
          alert('Goals imported successfully!');
        } catch (err) {
          alert('Error importing goals: Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  });

  // ============================================
  // INITIALIZE
  // ============================================

  function init() {
    currentDate = new Date();

    // Load custom background
    const savedBg = localStorage.getItem('epoch_custom_bg');
    if (savedBg) {
      applyCustomBackground(savedBg);
    }

    setView('day');
  }

  init();
})();
