// --- STATE MANAGEMENT ---
let tasks = JSON.parse(localStorage.getItem('tasks_v2')) || [];
let currentFilter = 'all';
let searchQuery = '';
let editTaskId = null; // Tracks the ID of the task currently being edited
let draggedIndex = null; // Tracks index of item being dragged
let currentSort = 'default';

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = (currentTheme && currentTheme.toLowerCase() === 'dark') ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
}

// --- TASK CRUD OPERATIONS ---
function saveTasks() {
    localStorage.setItem('tasks_v2', JSON.stringify(tasks));
    renderTasks();
}

function addTask(e) {
    e.preventDefault();
    const taskTitle = document.getElementById('taskTitle');
    const taskDesc = document.getElementById('taskDesc');
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    const taskDueDate = document.getElementById('taskDueDate');

    const title = taskTitle.value.trim();
    if (!title) return;

    const newTask = {
        id: Date.now().toString(),
        title: title,
        description: taskDesc ? taskDesc.value.trim() : '',
        priority: taskPriority.value,
        category: taskCategory.value,
        dueDate: taskDueDate.value || null,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    document.getElementById('taskForm').reset();
    showToast('Task created successfully!', 'success', 'fa-circle-plus');
}

function toggleTaskComplete(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();

    const task = tasks.find(t => t.id === id);
    if (task) {
        const msg = task.completed ? 'Task completed! 🎉' : 'Task marked active';
        const icon = task.completed ? 'fa-circle-check' : 'fa-circle-notch';
        showToast(msg, 'success', icon);
    }
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    if (editTaskId === id) editTaskId = null;
    saveTasks();
    showToast('Task deleted', 'danger', 'fa-trash-can');
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
}

// --- INLINE EDIT LOGIC ---
function startEdit(id) {
    editTaskId = id;
    renderTasks();
}

function cancelEdit() {
    editTaskId = null;
    renderTasks();
}

function saveEdit(id) {
    const editTitle = document.getElementById(`edit-title-${id}`).value.trim();
    if (!editTitle) return;

    const editDesc = document.getElementById(`edit-desc-${id}`).value.trim();
    const editPriority = document.getElementById(`edit-priority-${id}`).value;
    const editCategory = document.getElementById(`edit-category-${id}`).value;
    const editDueDate = document.getElementById(`edit-date-${id}`).value || null;

    tasks = tasks.map(task => {
        if (task.id === id) {
            return {
                ...task,
                title: editTitle,
                description: editDesc,
                priority: editPriority,
                category: editCategory,
                dueDate: editDueDate
            };
        }
        return task;
    });

    editTaskId = null;
    saveTasks();
    showToast('Task updated!', 'info', 'fa-pen-to-square');
}

// --- DRAG AND DROP HANDLERS ---
function handleDragStart(e, index) {
    draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Remove item from old position and insert at new target position
    const movedTask = tasks.splice(draggedIndex, 1)[0];
    tasks.splice(targetIndex, 0, movedTask);

    draggedIndex = null;
    saveTasks();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedIndex = null;
}

// --- EXPORT & IMPORT DATA LOGIC ---
function exportTasksJSON() {
    if (tasks.length === 0) {
        alert("There are no tasks to export!");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `task_flow_backup_${new Date().toISOString().split('T')[0]}.json`;

    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importTasksJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedTasks = JSON.parse(event.target.result);

            if (!Array.isArray(importedTasks)) {
                throw new Error("Invalid JSON structure.");
            }

            const isValid = importedTasks.every(t => t.id && t.title !== undefined);
            if (!isValid) {
                throw new Error("JSON does not match expected Task schema.");
            }

            tasks = importedTasks;
            saveTasks();
            alert("Tasks imported successfully!");
        } catch (err) {
            alert("Failed to import tasks: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// --- DEMO DATA GENERATOR ---
function loadDemoData() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    tasks = [
        {
            id: '1',
            title: 'Refactor portfolio website responsiveness',
            description: 'Audit mobile breakpoint flex wrappers and update CSS custom properties.',
            priority: 'high',
            category: 'Projects',
            dueDate: today,
            completed: false
        },
        {
            id: '2',
            title: 'Review React server components documentation',
            description: 'Check data-fetching patterns and client component boundaries.',
            priority: 'medium',
            category: 'Work',
            dueDate: tomorrow,
            completed: false
        },
        {
            id: '3',
            title: 'Set up local expense tracker database backup',
            description: 'Export local storage dump and convert to JSON.',
            priority: 'low',
            category: 'General',
            dueDate: null,
            completed: true
        }
    ];
    saveTasks();
}


// --- SORTING ENGINE ---
function sortTasksList(taskList) {
    const priorityMap = { high: 1, medium: 2, low: 3 };

    return [...taskList].sort((a, b) => {
        if (currentSort === 'dueDate') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (currentSort === 'priority') {
            return priorityMap[a.priority] - priorityMap[b.priority];
        }
        if (currentSort === 'title') {
            return a.title.localeCompare(b.title);
        }
        return 0; // 'default' retains array/drag order
    });
}


// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'info', icon = 'fa-circle-check') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000);
}

// --- RENDER & FILTER ENGINE ---
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const taskCountText = document.getElementById('taskCountText');

    if (!taskList) return;

    taskList.innerHTML = '';

    const filtered = tasks.filter(task => {
        const matchesFilter = 
            currentFilter === 'all' ? true :
            currentFilter === 'active' ? !task.completed :
            currentFilter === 'completed' ? task.completed :
            currentFilter === 'high' ? task.priority === 'high' : true;

        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    // NEW: Apply dynamic sorting to filtered tasks
    const sortedAndFiltered = sortTasksList(filtered);

    if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        
        const todayStr = new Date().toISOString().split('T')[0];

        sortedAndFiltered.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-card ${task.completed ? 'completed' : ''}`;

            // Attach drag event listeners when not editing
            if (task.id !== editTaskId) {
                li.setAttribute('draggable', 'true');
                li.addEventListener('dragstart', (e) => handleDragStart(e, index));
                li.addEventListener('dragover', (e) => handleDragOver(e));
                li.addEventListener('drop', (e) => handleDrop(e, index));
                li.addEventListener('dragend', (e) => handleDragEnd(e));
            }

            // --- INLINE EDIT MODE RENDER ---
            if (task.id === editTaskId) {
                li.innerHTML = `
                    <div class="edit-form-container" style="width: 100%; display: flex; flex-direction: column; gap: 0.75rem;">
                        <input type="text" id="edit-title-${task.id}" value="${escapeHTML(task.title)}" class="edit-input-title" 
                        onkeydown="if(event.key === 'Enter') saveEdit('${task.id}')" style="width: 100%; background: transparent; 
                        border: none; border-bottom: 2px solid var(--primary); color: var(--text-main); font-size: 1rem; font-weight: 
                        600; outline: none; padding: 0.2rem 0;">
                        <input type="text" id="edit-desc-${task.id}" value="${escapeHTML(task.description || '')}" placeholder="Description..." 
                        style="width: 100%; background: transparent; border: none; border-bottom: 1px dashed var(--border-color); color: var(--text-muted); 
                        font-size: 0.85rem; outline: none; padding: 0.2rem 0;">
                        
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-top: 0.25rem;">
                            <div class="select-wrapper">
                                <i class="fa-solid fa-flag"></i>
                                <select id="edit-priority-${task.id}">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                                </select>
                            </div>

                            <div class="select-wrapper">
                                <i class="fa-solid fa-tag"></i>
                                <select id="edit-category-${task.id}">
                                    <option value="General" ${task.category === 'General' ? 'selected' : ''}>General</option>
                                    <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>Work</option>
                                    <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
                                    <option value="Projects" ${task.category === 'Projects' ? 'selected' : ''}>Projects</option>
                                </select>
                            </div>

                            <div class="date-wrapper">
                                <i class="fa-regular fa-calendar"></i>
                                <input type="date" id="edit-date-${task.id}" value="${task.dueDate || ''}">
                            </div>
                        </div>

                        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                            <button class="btn-secondary" onclick="cancelEdit()" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Cancel</button>
                            <button class="btn-primary" onclick="saveEdit('${task.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-check"></i> Save</button>
                        </div>
                    </div>
                `;
                taskList.appendChild(li);
                return;
            }

            // --- STANDARD VIEW RENDER ---
            let dateBadgeHTML = '';
            if (task.dueDate) {
                const isToday = task.dueDate === todayStr;
                const isOverdue = !task.completed && !isToday && task.dueDate < todayStr;
                
                let badgeClass = 'badge-date';
                let label = task.dueDate;

                if (isOverdue) {
                    badgeClass += ' overdue';
                    label += ' (Overdue)';
                } else if (isToday) {
                    badgeClass += ' due-today';
                    label += ' (Due Today)';
                }

                dateBadgeHTML = `<span class="${badgeClass}">
                    <i class="fa-regular fa-calendar"></i> ${label}
                </span>`;
            }

            const descHTML = task.description 
                ? `<p class="task-description">${escapeHTML(task.description)}</p>` 
                : '';

            li.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-title">${escapeHTML(task.title)}</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button type="button" class="action-btn edit-btn" onclick="startEdit('${task.id}')" title="Edit Task">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" class="action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    ${descHTML}
                    <div class="task-meta">
                        <span class="badge badge-priority-${task.priority}">${task.priority}</span>
                        <span class="badge badge-category">#${task.category}</span>
                        ${dateBadgeHTML}
                    </div>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    if (taskCountText) {
        const activeCount = tasks.filter(t => !t.completed).length;
        taskCountText.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- INITIALIZATION & DOM READY EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderTasks();

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Task Form Submit
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', addTask);
    }

    // Load Demo Button
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', loadDemoData);
    }

    // Export Tasks
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTasksJSON);
    }

    // Import Tasks
    const importInput = document.getElementById('importInput');
    if (importInput) {
        importInput.addEventListener('change', importTasksJSON);
    }

    // Clear Completed
    const clearBtn = document.getElementById('clearCompletedBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompleted);
    }

    // Live Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });
    }

    // Filter Chips
    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Sort Listener
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTasks();
        });
    }

    // --- GLOBAL KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
    const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    // Press 'N' or 'Ctrl + K' / 'Cmd + K' to focus task title input
    if ((e.key.toLowerCase() === 'n' && !isInputActive) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        const taskTitleInput = document.getElementById('taskTitle');
        if (taskTitleInput) {
            taskTitleInput.focus();
            taskTitleInput.select();
        }
    }

    // Press 'Escape' to cancel inline edit or blur inputs
    if (e.key === 'Escape') {
        if (editTaskId !== null) {
            cancelEdit();
        } else if (isInputActive) {
            document.activeElement.blur();
        }
    }
    });
    
});