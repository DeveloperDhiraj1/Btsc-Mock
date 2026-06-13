import { createSlice } from '@reduxjs/toolkit';

// Default to the premium dark theme unless the user has explicitly opted out.
const initialDark = localStorage.getItem('darkMode') !== 'false';

const initialState = {
  darkMode: initialDark,
  sidebarOpen: false,
  toasts: [] // [{ id, message, type: 'success' | 'error' | 'info' }]
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      
      // Update HTML class list
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action) => {
      const { message, type = 'info', duration = 3000 } = action.payload;
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      state.toasts.push({ id, message, type, duration });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    }
  }
});

export const { toggleDarkMode, setSidebarOpen, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
