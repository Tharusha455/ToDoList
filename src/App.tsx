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
import { GoogleLogin } from '@react-oauth/google'
import { ProgressBar } from './components/DashboardWidgets'
import AssignmentTab from './components/AssignmentTab'

import type { Task, Schedule, DayOfWeek, Assignment, User as UserType } from './types/index'
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
  const [user, setUser] = useState<UserType | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      fetchUserProfile(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('token')
        setIsAuthenticated(false)
      }
    } catch (err) {
      console.error('Profile fetch failed:', err)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (response: any) => {
    try {
      setLoading(true)
      console.log('Google credential received, authenticating with backend...')
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Login failed with status:', res.status, errorData)
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      console.log('Login successful, status 200. Token received.')
      
      // Save token
      localStorage.setItem('token', data.token)
      
      // Explicit state update to trigger immediate re-render
      setUser(data.user)
      setIsAuthenticated(true)
      
      addToast('Welcome to UniFlow!', 'success')
      
      // Force loading to false immediately after state set
      setLoading(false)
      
    } catch (err: any) {
      console.error('Google Auth Error:', err)
      addToast(err.message || 'Authentication service unreachable', 'error')
      setLoading(false) // Ensure spinner stops on error
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  // ─── Fetch all data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      // Check health first 
      const healthRes = await fetch(`${API_URL}/health`)
      const health = await safeJson(healthRes)
      setDbConnected(health.dbConnected)

      const headers = { 'Authorization': `Bearer ${token}` }
      const [tasksRes, scheduleRes, assignmentsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`, { headers }),
        fetch(`${API_URL}/schedule`, { headers }), // This might be public/shared
        fetch(`${API_URL}/assignments`, { headers })
      ])

      const tasksData = await safeJson(tasksRes)
      const assignmentsData = await safeJson(assignmentsRes)
      
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      
      // Schedule is currently public but could be filtered too
      const scheduleResData = await safeJson(scheduleRes)
      setSchedule(Array.isArray(scheduleResData) ? scheduleResData : [])
    } catch (err: any) {
      console.error('fetchData error:', err)
      addToast(err.message || 'Error fetching data', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, isAuthenticated])

  useEffect(() => { fetchData() }, [fetchData, isAuthenticated])

  // ─── Task CRUD ───────────────────────────────────────────────────────────
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  })

  const handleSaveTask = async (taskData: any) => {
    const isEdit = !!taskData._id
    const url = isEdit ? `${API_URL}/tasks/${taskData._id}` : `${API_URL}/tasks`
    const method = isEdit ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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
        headers: getAuthHeaders(),
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
      const res = await fetch(`${API_URL}/schedule/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
      const res = await fetch(`${API_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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

  const renderTaskSidebar = () => (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 h-full relative xl:sticky xl:top-6">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Upcoming Tasks</h2>
        <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold w-6 h-6 rounded-full ring-2 ring-white shadow-sm">
          {pendingTasks.length}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12 text-slate-400 text-sm font-medium">Loading tasks...</div>
      ) : pendingTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <p className="text-slate-600 font-bold mb-1">All caught up! 🎉</p>
          <p className="text-sm text-slate-400">No pending tasks found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
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

      <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-4">
        <button
          onClick={() => { setEditingTask(null); setIsTaskFormOpen(true) }}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-2.5 font-semibold hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
        >
          <Plus size={18} /> Add Task
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Daily Progress</span>
            <span className="text-indigo-600">{progress}%</span>
          </div>
          <ProgressBar progress={progress} />
        </div>
      </div>
    </div>
  )

  if (!isAuthenticated && !loading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1>UniFlow</h1>
          </div>
          <h2>Welcome to your dashboard</h2>
          <p>Please continue with your student account to access your tasks and assignments.</p>
          <div className="btn-google-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => addToast('Google Login Failed', 'error')}
              useOneTap
            />
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="app-root"><Spinner /></div>

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      <Toast toasts={toasts} remove={removeToast} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
        isOpen={sidebarOpen}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full md:ml-64 transition-all duration-300 ease-in-out overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden transition-colors outline-none focus:ring-2 focus:ring-blue-500" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 rounded-xl flex-1 max-w-md border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tasks or lectures..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            {dbConnected ? (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> MongoDB
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200/50">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline
              </span>
            )}
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-4 sm:pl-6">
              <div className="flex items-center gap-3">
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="User" className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <User size={18} />
                  </div>
                )}
                <div className="hidden lg:block text-sm">
                  <div className="font-semibold text-slate-800">{user?.name || 'User'}</div>
                  {user?.role === 'admin' && <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Admin</div>}
                </div>
              </div>
              <button 
                className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-md hover:bg-red-50" 
                onClick={handleLogout}
                title="Log Out"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 space-y-8">
          {/* Dashboard View - Splitting Main + Task Rail */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-8 animate-in fade-in duration-300 max-w-[1600px] mx-auto w-full">
              
              <main className="space-y-8">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Weekly Schedule</h2>
                    <p className="text-sm text-slate-500 mt-1">Your upcoming lectures and classes.</p>
                  </div>
                  <button
                    onClick={() => { setEditingLecture(null); setIsLectureFormOpen(true) }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 shadow-sm px-4 py-2.5 sm:py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors active:scale-95"
                  >
                    <Plus size={16} /> <span>Add Lecture</span>
                  </button>
                </div>

                {loading ? <Spinner /> : (
                  <>
                    {assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl shadow-sm">
                        <Bell size={20} className="text-amber-500 shrink-0" />
                        <span className="text-sm font-medium">You have <strong>{assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length}</strong> assignments due soon!</span>
                      </div>
                    )}

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                      {DAYS.map(day => (
                        <div key={day} className="flex flex-col gap-3">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 pb-1 border-b border-slate-200">
                            {day.slice(0, 3)}
                          </div>
                          <div className="flex flex-col gap-3">
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
                                <div className="h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-50/50">
                                  No classes
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Upcoming Deadlines</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignments
                          .filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48)))
                          .sort((a, b) => a.deadline.localeCompare(b.deadline))
                          .map(item => (
                            <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-rose-500 flex flex-col gap-1">
                              <h4 className="text-sm font-bold text-slate-800 truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">{item.subject}</p>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mt-auto bg-rose-50 w-fit px-2 py-1 rounded">
                                <Clock size={12} />
                                <span>Due: {format(new Date(item.deadline), 'MMM d, h:mm a')}</span>
                              </div>
                            </div>
                          ))}
                        {assignments.filter(a => a.status === 'Pending' && isBefore(new Date(a.deadline), addHours(new Date(), 48))).length === 0 && (
                          <div className="col-span-full py-8 text-center text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-xl shadow-sm">
                            No urgent deadlines. Good job!
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </main>

              {/* Task Sidebar / Column */}
              <aside className="w-full">
                {renderTaskSidebar()}
              </aside>
            </div>
          )}
            {activeTab === 'assignments' && (
              <main className="flex-1 w-full max-w-7xl mx-auto">
                <AssignmentTab 
                  assignments={assignments}
                  onAdd={handleAddAssignment}
                  onDelete={handleDeleteAssignment}
                  onToggleStatus={handleToggleAssignmentStatus}
                />
              </main>
            )}

            {activeTab === 'lectures' && (
              <main className="flex-1 w-full max-w-7xl mx-auto">
                <div className="animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">All Lectures</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage the global lecture schedule.</p>
                    </div>
                    <button onClick={() => { setEditingLecture(null); setIsLectureFormOpen(true) }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200">
                      <Plus size={18} /> Add Lecture
                    </button>
                  </div>
                  {loading ? <Spinner /> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {schedule.map(l => (
                        <LectureCard
                          key={l._id}
                          lecture={l}
                          onDelete={handleDeleteSchedule}
                          onEdit={(lec) => { setEditingLecture(lec); setIsLectureFormOpen(true) }}
                        />
                      ))}
                      {schedule.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                          <BookOpen size={40} className="text-slate-300 mb-4" />
                          <h3 className="text-lg font-bold text-slate-800 mb-1">No lectures yet</h3>
                          <p className="text-sm text-slate-500">Add a lecture to get started.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </main>
            )}

            {activeTab === 'settings' && (
              <main className="flex-1 w-full max-w-7xl mx-auto">
                <div className="animate-in fade-in duration-300">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage your account preferences.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <Settings size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Settings module coming soon.</p>
                  </div>
                </div>
              </main>
            )}
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
