import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchTasks, fetchAllTasks, createTask, taskCreated, taskUpdated, taskDeleted } from '../store/slices/tasksSlice'
import { logout } from '../store/slices/authSlice'
import { socket } from '../utils/socket'
import { Plus, LogOut, Bell, Users, RefreshCw, Eye, Menu, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import TaskItem from '../components/TaskItem'
import ThemeToggle from '../components/ThemeToggle'

const Dashboard = () => {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [viewMode, setViewMode] = useState('all') 
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    dueDate: ''
  })
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { userInfo } = useSelector((state) => state.auth)
  const { tasks, allTasks, loading } = useSelector((state) => state.tasks)

  // Load tasks and setup socket
  useEffect(() => {
    if (!userInfo) {
      navigate('/login')
      return
    }
    
    loadAllTasks()
    
    // Socket connection establish karo
    if (socket && userInfo) {
      socket.emit('user_connected', {
        userId: userInfo._id,
        userName: userInfo.name
      })
    }
  }, [dispatch, userInfo, navigate])

  const loadAllTasks = async () => {
    setIsRefreshing(true)
    try {
      // Parallel mein dono tasks load karo
      await Promise.all([
        dispatch(fetchTasks()).unwrap(),
        dispatch(fetchAllTasks()).unwrap()
      ])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Socket event listeners
  useEffect(() => {
    console.log('🔌 Setting up socket listeners for user:', userInfo?.name)
    
    // Task Created Event
    const handleTaskCreated = (data) => {
      console.log('📝 Task created event received:', data)
      
      // Automatically add to Redux store (sab users ke liye)
      dispatch(taskCreated(data.task))
      
      // Sirf dusre users ko notification dikhao
      if (data.userId !== userInfo?._id) {
        toast.success(
          <div>
            <div className="font-semibold">{data.message}</div>
            <div className="text-sm text-gray-600">By: {data.actionBy}</div>
            <div className="text-xs text-gray-500">
              {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right'
          }
        )
      } else {
        // Creator ko success message
        toast.success(`✅ Task "${data.task.title}" created successfully!`, {
          duration: 3000
        })
      }
    }

    // Task Updated Event
    const handleTaskUpdated = (data) => {
      console.log('✏️ Task updated event received:', data)
      
      // Automatically update in Redux store
      dispatch(taskUpdated(data.task))
      
      if (data.userId !== userInfo?._id) {
        toast.info(
          <div>
            <div className="font-semibold">{data.message}</div>
            <div className="text-sm text-gray-600">By: {data.actionBy}</div>
            <div className="text-xs text-gray-500">
              {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right'
          }
        )
      } else {
        // Updater ko success message
        toast.success(`✅ Task "${data.task.title}" updated successfully!`, {
          duration: 3000
        })
      }
    }

    // Task Deleted Event
    const handleTaskDeleted = (data) => {
      console.log('🗑️ Task deleted event received:', data)
      
      // Sab users ke store se remove karo
      dispatch(taskDeleted(data.taskId))
      
      if (data.userId !== userInfo?._id) {
        toast.error(
          <div>
            <div className="font-semibold">{data.message}</div>
            <div className="text-sm text-gray-600">By: {data.actionBy}</div>
            <div className="text-xs text-gray-500">
              {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>,
          {
            duration: 5000,
            position: 'top-right'
          }
        )
      } else {
        // Deleter ko success message
        toast.success(`✅ Task "${data.taskTitle}" deleted successfully!`, {
          duration: 3000
        })
      }
    }

    // Online users count update
    const handleUsersUpdate = (data) => {
      setOnlineUsers(data.count)
    }

    // Event listeners register karo
    socket.on('taskCreated', handleTaskCreated)
    socket.on('taskUpdated', handleTaskUpdated)
    socket.on('taskDeleted', handleTaskDeleted)
    socket.on('users_update', handleUsersUpdate)

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners')
      socket.off('taskCreated', handleTaskCreated)
      socket.off('taskUpdated', handleTaskUpdated)
      socket.off('taskDeleted', handleTaskDeleted)
      socket.off('users_update', handleUsersUpdate)
    }
  }, [dispatch, userInfo])

  const handleLogout = () => {
    if (socket) {
      socket.disconnect()
    }
    dispatch(logout())
    navigate('/login')
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    
    if (!newTask.title.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      await dispatch(createTask({
        ...newTask,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null
      })).unwrap()
      
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        dueDate: ''
      })
      setShowTaskForm(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // Display tasks based on view mode
  const getDisplayTasks = () => {
    return viewMode === 'all' ? allTasks : tasks
  }

  const getTasksByStatus = (status) => {
    const displayTasks = getDisplayTasks()
    return displayTasks.filter(task => task.status === status)
  }

  const getStats = () => {
    const displayTasks = getDisplayTasks()
    const myTasks = tasks
    
    return {
      total: displayTasks.length,
      todo: getTasksByStatus('todo').length,
      inProgress: getTasksByStatus('in-progress').length,
      done: getTasksByStatus('done').length,
      myTotal: myTasks.length
    }
  }

  const stats = getStats()

  if (loading && tasks.length === 0 && allTasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading tasks...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left Section - Logo and Mobile Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mr-2 sm:mr-3" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  SriSaiGroup
                </h1>
              </div>
              
              {/* Online Users - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users size={16} />
                <span>{onlineUsers} online</span>
              </div>
            </div>
            
            {/* Right Section - User Info and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Welcome Text - Hidden on small mobile */}
              <span className="hidden xs:block text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                Welcome, <strong className="truncate max-w-[80px] sm:max-w-none">{userInfo?.name}</strong>!
              </span>
              
              {/* Refresh Button */}
              <button
                onClick={loadAllTasks}
                disabled={isRefreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                title="Refresh tasks"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              
              <ThemeToggle />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={16} />
                  <span>{onlineUsers} users online</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Welcome, <strong>{userInfo?.name}</strong>!
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-500">{stats.todo}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">To Do</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-gray-200 dark:border-gray-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-500">{stats.done}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow border border-blue-200 dark:border-blue-700">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.myTotal}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">My Tasks</div>
          </div>
        </div>

        {/* View Toggle and Add Task Button */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center ${
                viewMode === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Eye size={16} />
              <span className="hidden xs:inline">All Tasks</span>
              <span className="xs:hidden">All</span>
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center ${
                viewMode === 'my' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Eye size={16} />
              <span className="hidden xs:inline">My Tasks</span>
              <span className="xs:hidden">My</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus size={18} />
            <span>Add New Task</span>
          </button>
        </div>

        {/* View Mode Info */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-sm">
            {viewMode === 'all' ? (
              <>
                <Eye size={14} />
                <span className="font-medium">Viewing All Tasks</span>
                <span className="hidden sm:inline text-xs">- You can see tasks from all users</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span className="font-medium">Viewing My Tasks</span>
                <span className="hidden sm:inline text-xs">- Only your tasks are visible</span>
              </>
            )}
          </div>
        </div>

        {/* Task Form */}
        {showTaskForm && (
          <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  placeholder="What needs to be done?"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {newTask.title.length}/100 characters
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  placeholder="Add more details about this task..."
                  rows="3"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {newTask.description.length}/500 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                  >
                    <option value="todo">📝 To Do</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3 pt-2 flex-col sm:flex-row">
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base flex-1"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false)
                    setNewTask({
                      title: '',
                      description: '',
                      status: 'todo',
                      dueDate: ''
                    })
                  }}
                  className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks Board */}
        {getDisplayTasks().length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* To Do Column */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full mr-2"></div>
                To Do ({stats.todo})
              </h3>
              <div className="space-y-3 sm:space-y-4 min-h-[150px] sm:min-h-[200px]">
                {getTasksByStatus('todo').map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
                {stats.todo === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No tasks to do
                  </p>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-2"></div>
                In Progress ({stats.inProgress})
              </h3>
              <div className="space-y-3 sm:space-y-4 min-h-[150px] sm:min-h-[200px]">
                {getTasksByStatus('in-progress').map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
                {stats.inProgress === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No tasks in progress
                  </p>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-2"></div>
                Done ({stats.done})
              </h3>
              <div className="space-y-3 sm:space-y-4 min-h-[150px] sm:min-h-[200px]">
                {getTasksByStatus('done').map(task => (
                  <TaskItem key={task._id} task={task} />
                ))}
                {stats.done === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No completed tasks
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Bell size={48} className="sm:hidden mx-auto opacity-50" />
              <Bell size={64} className="hidden sm:block mx-auto opacity-50" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
              Get started by creating your first task!
            </p>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Create Your First Task
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard