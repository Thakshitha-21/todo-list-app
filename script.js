// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const emptyState = document.getElementById('emptyState');
const currentDateSpan = document.getElementById('currentDate');
const filterBtns = document.querySelectorAll('.filter-btn');

// Task array and current filter
let tasks = [];
let currentFilter = 'all';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateDate();
    loadTasks();
    setupEventListeners();
});

// Update current date display
function updateDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDateSpan.textContent = now.toLocaleDateString('en-US', options);
}

// Set up event listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            currentFilter = this.dataset.filter;
            filterTasks();
        });
    });
}

// Add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        showNotification('Please enter a task!', 'warning');
        taskInput.focus();
        return;
    }
    
    // Create new task object
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Add to tasks array
    tasks.push(task);
    
    // Save to localStorage
    saveTasks();
    
    // Render the task
    renderTask(task);
    
    // Clear input and focus
    taskInput.value = '';
    taskInput.focus();
    
    // Update stats and UI
    updateStats();
    updateEmptyState();
    filterTasks();
    
    // Show success notification
    showNotification('Task added successfully!', 'success');
}

// Render a single task
function renderTask(task) {
    const taskItem = document.createElement('li');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;
    
    taskItem.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
        <span class="task-text">${task.text}</span>
        <div class="task-actions">
            <button class="edit-btn" title="Edit task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    const checkbox = taskItem.querySelector('.task-checkbox');
    const deleteBtn = taskItem.querySelector('.delete-btn');
    const editBtn = taskItem.querySelector('.edit-btn');
    const taskText = taskItem.querySelector('.task-text');
    
    // Toggle completion
    checkbox.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleTask(task.id);
    });
    
    // Delete task
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteTask(task.id);
    });
    
    // Edit task
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        editTask(task.id, taskText);
    });
    
    // Toggle completion on task click
    taskItem.addEventListener('click', function() {
        toggleTask(task.id);
    });
    
    taskList.appendChild(taskItem);
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    
    // Update UI
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskItem) {
        taskItem.classList.toggle('completed');
        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.classList.toggle('checked');
        
        // Add animation
        taskItem.style.transform = 'scale(1.02)';
        setTimeout(() => {
            taskItem.style.transform = '';
        }, 200);
    }
    
    // Save and update
    saveTasks();
    updateStats();
    filterTasks();
    
    // Show notification
    const message = task.completed ? 'Task completed!' : 'Task marked as pending';
    showNotification(message, 'success');
}

// Delete a task
function deleteTask(taskId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    // Remove from array
    tasks = tasks.filter(t => t.id !== taskId);
    
    // Remove from UI with animation
    const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskItem) {
        taskItem.style.transform = 'translateX(100%)';
        taskItem.style.opacity = '0';
        
        setTimeout(() => {
            taskItem.remove();
            updateStats();
            updateEmptyState();
            filterTasks();
        }, 300);
    }
    
    // Save and show notification
    saveTasks();
    showNotification('Task deleted!', 'danger');
}

// Edit a task
function editTask(taskId, taskTextElement) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const currentText = task.text;
    const newText = prompt('Edit your task:', currentText);
    
    if (newText !== null && newText.trim() !== '') {
        if (newText.trim() !== currentText) {
            task.text = newText.trim();
            taskTextElement.textContent = newText.trim();
            
            saveTasks();
            showNotification('Task updated!', 'success');
        }
    }
}

// Filter tasks based on current filter
function filterTasks() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const taskId = parseInt(item.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        switch (currentFilter) {
            case 'completed':
                item.style.display = task.completed ? 'flex' : 'none';
                break;
            case 'pending':
                item.style.display = !task.completed ? 'flex' : 'none';
                break;
            default:
                item.style.display = 'flex';
        }
    });
}

// Update task statistics
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    totalTasksSpan.textContent = totalTasks;
    completedTasksSpan.textContent = completedTasks;
    pendingTasksSpan.textContent = pendingTasks;
    
    // Animate number changes
    animateValue(totalTasksSpan, parseInt(totalTasksSpan.textContent) || 0, totalTasks, 500);
    animateValue(completedTasksSpan, parseInt(completedTasksSpan.textContent) || 0, completedTasks, 500);
    animateValue(pendingTasksSpan, parseInt(pendingTasksSpan.textContent) || 0, pendingTasks, 500);
}

// Animate number changes
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Update empty state visibility
function updateEmptyState() {
    if (tasks.length === 0) {
        emptyState.classList.add('show');
        taskList.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
        taskList.style.display = 'flex';
    }
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 
                     type === 'warning' ? 'var(--warning)' : 'var(--danger)'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
    
    document.body.appendChild(notification);
    
    // Add keyframes for animation
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        tasks.forEach(renderTask);
        updateStats();
        updateEmptyState();
        filterTasks();
    } else {
        updateEmptyState();
    }
}