import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api' || 'https://srisai-360-server.onrender.com/api'

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      }
      const response = await axios.get(`${API_URL}/tasks`, config)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch tasks'
      )
    }
  }
)

// NEW: Fetch all tasks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAllTasks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      }
      const response = await axios.get(`${API_URL}/tasks/all`, config)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch all tasks'
      )
    }
  }
)

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      }
      const response = await axios.post(`${API_URL}/tasks`, taskData, config)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create task'
      )
    }
  }
)

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, taskData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      }
      const response = await axios.put(`${API_URL}/tasks/${id}`, taskData, config)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update task'
      )
    }
  }
)

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState()
      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      }
      await axios.delete(`${API_URL}/tasks/${id}`, config)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete task'
      )
    }
  }
)

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [], // Current user tasks
    allTasks: [], // All users tasks
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Socket.IO updates
    taskCreated: (state, action) => {
      state.tasks.unshift(action.payload)
      state.allTasks.unshift(action.payload)
    },
    taskUpdated: (state, action) => {
      // Update in user's tasks
      const userIndex = state.tasks.findIndex(task => task._id === action.payload._id)
      if (userIndex !== -1) {
        state.tasks[userIndex] = action.payload
      }
      // Update in all tasks
      const allIndex = state.allTasks.findIndex(task => task._id === action.payload._id)
      if (allIndex !== -1) {
        state.allTasks[allIndex] = action.payload
      }
    },
    taskDeleted: (state, action) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload)
      state.allTasks = state.allTasks.filter(task => task._id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current user tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch all tasks
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.allTasks = action.payload
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload)
        state.allTasks.unshift(action.payload)
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        const allIndex = state.allTasks.findIndex(task => task._id === action.payload._id)
        if (allIndex !== -1) {
          state.allTasks[allIndex] = action.payload
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload)
        state.allTasks = state.allTasks.filter(task => task._id !== action.payload)
      })
  },
})

export const { clearError, taskCreated, taskUpdated, taskDeleted } = tasksSlice.actions
export default tasksSlice.reducer