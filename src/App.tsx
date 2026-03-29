import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Bell, User, BookOpen, Menu, X, AlertCircle, CheckCircle, Settings, Clock } from 'lucide-react'

// Parse JSON safely — returns null if response is HTML (server down)
async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    throw new Error(
      res.ok
        ? `Expected JSON but got: ${text.slice(0, 80)}`
        : `Backend server not responding. Run: node server/server.js`
    )
  }
  return res.json()
}
import { isSameDay, parseISO, isBefore, addHours, format } from 'date-fns'

import Sidebar from './components/Sidebar'
import TaskCard from './components/TaskCard'
import TaskForm from './components/TaskForm'
import LectureCard from './components/LectureCard'
import LectureForm from './components/LectureForm'
import { ProgressBar } from './components/DashboardWidgets'
import AssignmentTab from './components/AssignmentTab'

import type { Task, Schedule, DayOfWeek, Assignment } from './types/index'
import './styles/global.css'

const API_URL = '/api'

// ─── Toast Notification ────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'
interface ToastMsg { id: number; message: string; type: ToastType }

const Toast: React.FC<{ toasts: ToastMsg[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        {t.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)} className="toast-close"><X size={14} /></button>
      </div>
    ))}
  </div>
)

// ─── Loading Spinner ────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="spinner-wrap">
    <div className="spinner" />
    <p className="spinner-text">Loading data from MongoDB...</p>
  </div>
)

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isLectureFormOpen, setIsLectureFormOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Schedule | null>(null)

  const [toasts, setToasts] = useState<ToastMsg[]>([])
  let toastId = 0

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  // ─── Fetch all data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Check health first
      const healthRes = await fetch(`${API_URL}/health`)
      const health = await safeJson(healthRes)
      setDbConnected(health.dbConnected)

      const [tasksRes, scheduleRes, assignmentsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/schedule`),
        fetch(`${API_URL}/assignments`)
      ])

      const tasksData = await safeJson(tasksRes)
      const scheduleData = await safeJson(scheduleRes)
      const assignmentsData = await safeJson(assignmentsRes)
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setSchedule(Array.isArray(scheduleData) ? scheduleData : [])
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
    } catch (err: any) {
      console.error('fetchData error:', err)
      addToast(err.message || 'Could not reach backend. Start server/server.js on port 5000.', 'error')
      setTasks([])
      setSchedule([])
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Task CRUD ───────────────────────────────────────────────────────────
  const handleSaveTask = async (taskData: any) => {
    const isEdit = !!taskData._id
    const url = isEdit ? `${API_URL}/tasks/${taskData._id}` : `${API_URL}/tasks`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (!res.ok) {
        const errData = await safeJson(res)
        throw new Error(errData.error || `HTTP ${res.status}`)
      }
      const saved = await safeJson(res)
      setTasks(prev => isEdit ? prev.map(t => t._id === saved._id ? saved : t) : [...prev, saved])
      addToast(isEdit ? 'Task updated successfully!' : 'Task created successfully!', 'success')
      setIsTaskFormOpen(false)
      setEditingTask(null)
    } catch (err: any) {
      console.error('handleSaveTask error:', err)
      addToast(err.message || 'Failed to save task. Is the server running?', 'error')
    }
  }

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t._id === id)
    if (!task) return
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: !task.Status })
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setTasks(prev => prev.map(t => t._id === id ? updated : t))
      addToast(updated.Status ? 'Task marked complete! 🎉' : 'Task marked pending.', 'info')
    } catch (err: any) {
      addToast(err.message || 'Failed to update task.', 'error')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setTasks(prev => prev.filter(t => t._id !== id))
      addToast('Task deleted.', 'info')
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task.', 'error')
    }
  }

  // ─── Schedule CRUD ───────────────────────────────────────────────────────
  const handleSaveSchedule = async (data: any) => {
    const isEdit = !!data._id
    const url = isEdit ? `${API_URL}/schedule/${data._id}` : `${API_URL}/schedule`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }
      const saved = await res.json()
      setSchedule(prev => isEdit ? prev.map(s => s._id === saved._id ? saved : s) : [...prev, saved])
      addToast(isEdit ? 'Lecture updated!' : 'Lecture added to schedule!', 'success')
      setIsLectureFormOpen(false)
      setEditingLecture(null)
    } catch (err: any) {
      addToast(err.message || 'Failed to save lecture.', 'error')
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule entry?')) return
    try {
      const res = await fetch(`${API_URL}/schedule/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSchedule(prev => prev.filter(s => s._id !== id))
      addToast('Lecture removed.', 'info')
    } catch (err: any) {
      addToast(err.message || 'Failed to delete.', 'error')
    }
  }

  // ─── Assignment CRUD ─────────────────────────────────────────────────────
  const handleAddAssignment = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create assignment')
      const saved = await res.json()
      setAssignments(prev => [...prev, saved])
      addToast('Assignment created!', 'success')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleToggleAssignmentStatus = async (id: string, status: 'Pending' | 'Completed') => {
    try {
      const res = await fetch(`${API_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setAssignments(prev => prev.map(a => a._id === id ? updated : a))
      addToast(`Assignment marked as ${status.toLowerCase()}!`, 'info')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return
    try {
      const res = await fetch(`${API_URL}/assignments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setAssignments(prev => prev.filter(a => a._id !== id))
      addToast('Assignment deleted.', 'info')
    } catch (err: any) {
      addToast(err.message, 'error')
    }
  }

  // ─── Computed stats ──────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const today = new Date()
    const todayTasks = tasks.filter(t => {
      try { return isSameDay(parseISO(t.DueDate), today) } catch { return false }
    })
    if (todayTasks.length === 0) return 0
    return Math.round((todayTasks.filter(t => t.Status).length / todayTasks.length) * 100)
  }, [tasks])

  const pendingTasks = tasks.filter(t => !t.Status)
  const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // ─── Right Sidebar content  ──────────────────────────────────────────────
  const rightSidebarContent = (
    <div className="right-sidebar-inner">
      <div className="right-sidebar-header">
        <h2>Upcoming Tasks</h2>
        <span className="task-count-badge">{pendingTasks.length}</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading tasks...</div>
      ) : pendingTasks.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={32} className="empty-icon" />
          <p>All caught up! 🎉</p>
        </div>
      ) : (
        <div className="task-list-scroll">
          {pendingTasks
            .sort((a, b) => a.DueDate.localeCompare(b.DueDate))
            .map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={(t) => { setEditingTask(t); setIsTaskFormOpen(true) }}
              />
            ))}
        </div>
      )}

      <button
        onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
        className="add-task-btn"
      >
        <Plus size={18} /> Add Task
      </button>

      <div className="progress-section">
        <ProgressBar progress={progress} />
      </div>
    </div>
  )

  return (
    <div className="app-root">
      <Toast toasts={toasts} remove={removeToast} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
        isOpen={sidebarOpen}
      />

      {/* Main */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={22} />
            </button>
            <div className="search-wrap">
              <Search size={16} />
              <input type="text" placeholder="Search tasks or lectures..." />
            </div>
          </div>
          <div className="header-right">
            {dbConnected ? (
              <span className="db-badge db-connected">● MongoDB</span>
            ) : (
              <span className="db-badge db-disconnected">○ Offline</span>
            )}
            <Bell size={20} className="header-icon" />
            <div className="user-chip">
              <User size={18} />
              <span>Tharusha</span>
            </div>
          </div>
        </header>

        <div className="content-grid">
          {/* Center Column */}
          <main className="center-main">
            {activeTab === 'dashboard' && (
              <div className="dashboard-view">
                <div className="section-header">
                  <h2>Weekly Schedule</h2>
                  <button
                    onClick={() => { setEditingLecture(null); setIsLectureFormOpen(true) }}
                    className="btn-outline"
                  >
                    <Plus size={15} /> Add Lecture
                  </button>
                </div>

                {loading ? <Spinner /> : (
                  <>
                    {assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length > 0 && (
                      <div className="notification-banner">
                        <Bell size={20} />
                        <span>You have <strong>{assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length}</strong> assignments due soon!</span>
                      </div>
                    )}

                    <div className="timetable-grid">
                      {DAYS.map(day => (
                        <div key={day} className="day-col">
                          <div className="day-header">{day.slice(0, 3)}</div>
                          <div className="day-slots">
                            {schedule
                              .filter(s => s.Day === day)
                              .sort((a, b) => a.StartTime.localeCompare(b.StartTime))
                              .map(lecture => (
                                <LectureCard
                                  key={lecture._id}
                                  lecture={lecture}
                                  onDelete={handleDeleteSchedule}
                                  onEdit={(l) => { setEditingLecture(l); setIsLectureFormOpen(true) }}
                                />
                              ))}
                            {schedule.filter(s => s.Day === day).length === 0 && (
                              <div className="empty-slot" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="section-header" style={{ marginTop: '2.5rem' }}>
                      <h2>Upcoming Deadlines</h2>
                    </div>
                    <div className="assignment-list">
                      {assignments
                        .filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48)))
                        .sort((a, b) => a.deadline.localeCompare(b.deadline))
                        .map(item => (
                          <div key={item._id} className="assignment-card">
                            <div className="assignment-main">
                              <div className="assignment-info">
                                <h4 className="assignment-title">
                                  {item.title}
                                  {isBefore(new Date(item.deadline), addHours(new Date(), 24)) && (
                                    <span className="badge badge-urgent">
                                      <AlertCircle size={12} /> Urgent
                                    </span>
                                  )}
                                </h4>
                                <p className="assignment-subject">{item.subject}</p>
                              </div>
                              <div className="assignment-deadline">
                                <Clock size={14} />
                                <span>Due: {format(new Date(item.deadline), 'MMM d, h:mm a')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      {assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length === 0 && (
                        <div className="empty-state">
                          <p>No urgent deadlines. Good job!</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <AssignmentTab 
                assignments={assignments}
                onAdd={handleAddAssignment}
                onDelete={handleDeleteAssignment}
                onToggleStatus={handleToggleAssignmentStatus}
              />
            )}

            {activeTab === 'lectures' && (
              <div className="dashboard-view">
                <div className="section-header">
                  <h2>All Lectures</h2>
                  <button onClick={() => { setEditingLecture(null); setIsLectureFormOpen(true) }} className="btn-primary-sm">
                    <Plus size={15} /> Add Lecture
                  </button>
                </div>
                {loading ? <Spinner /> : (
                  <div className="lecture-grid">
                    {schedule.map(l => (
                      <LectureCard
                        key={l._id}
                        lecture={l}
                        onDelete={handleDeleteSchedule}
                        onEdit={(lec) => { setEditingLecture(lec); setIsLectureFormOpen(true) }}
                      />
                    ))}
                    {schedule.length === 0 && (
                      <div className="empty-state-center">
                        <BookOpen size={40} className="opacity-20" />
                        <p>No lectures yet. Add one!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="dashboard-view">
                <div className="section-header"><h2>Settings</h2></div>
                <div className="settings-card">
                  <Settings size={40} className="opacity-20 mb-4" />
                  <p className="text-slate-500">Settings module coming soon.</p>
                </div>
              </div>
            )}
          </main>

          {/* Right sidebar — desktop/tablet visible */}
          <aside className="right-col">
            {rightSidebarContent}
          </aside>
        </div>

        {/* Mobile-only task bar (below schedule) */}
        <div className="mobile-task-bar">
          {rightSidebarContent}
        </div>
      </div>

      {/* Modals */}
      {isTaskFormOpen && (
        <TaskForm
          onClose={() => { setIsTaskFormOpen(false); setEditingTask(null) }}
          onSave={handleSaveTask}
          initialTask={editingTask}
        />
      )}
      {isLectureFormOpen && (
        <LectureForm
          onClose={() => { setIsLectureFormOpen(false); setEditingLecture(null) }}
          onSave={handleSaveSchedule}
          initialLecture={editingLecture}
        />
      )}
    </div>
  )
}

export default App
