import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateTask, deleteTask } from '../store/slices/tasksSlice'
import { Edit3, Trash2, Calendar, Save, X, User } from 'lucide-react'
import { format } from 'date-fns'

const TaskItem = ({ task }) => {
  const dispatch = useDispatch()
  const { userInfo } = useSelector((state) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
  })

  // Check if current user is the task owner
  const isTaskOwner = userInfo && task.user && (task.user._id === userInfo._id || task.user === userInfo._id)

  const handleUpdate = () => {
    if (!isTaskOwner) {
      alert('You can only edit your own tasks')
      return
    }
    
    dispatch(updateTask({
      id: task._id,
      taskData: {
        ...editData,
        dueDate: editData.dueDate ? new Date(editData.dueDate) : null
      }
    }))
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!isTaskOwner) {
      alert('You can only delete your own tasks')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      dispatch(deleteTask(task._id))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-500'
      case 'in-progress': return 'bg-blue-500'
      case 'done': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'todo': return 'To Do'
      case 'in-progress': return 'In Progress'
      case 'done': return 'Done'
      default: return status
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Task Owner Badge */}
      {!isTaskOwner && (
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-2">
          <User size={12} />
          <span>Created by {task.user?.name || 'Another user'}</span>
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Task title"
            maxLength={100}
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Task description"
            rows="3"
            maxLength={500}
          />
          <div className="flex gap-4 flex-col sm:flex-row">
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input
              type="date"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
              {task.title}
            </h3>
            {/* Only show edit/delete buttons to task owner */}
            {isTaskOwner && (
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Edit task"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          
          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 break-words">
              {task.description}
            </p>
          )}
          
          <div className="flex justify-between items-center flex-col sm:flex-row gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(task.status)}`}>
              {getStatusText(task.status)}
            </span>
            
            {task.dueDate && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
                {format(new Date(task.dueDate), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <span>Created: {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}</span>
            {isTaskOwner && (
              <span className="text-green-600">Your task</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskItem