import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const savedUser = JSON.parse(localStorage.getItem('userInfo')) || null;
const savedToken = localStorage.getItem('accessToken') || null;

const initialState = {
  user: savedUser,
  token: savedToken,
  loading: false,
  error: null,
  verificationEmail: null
};

// Login Async Thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue(response.data.message || 'Login failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register Async Thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        return { email: userData.email, ...response.data };
      }
      return rejectWithValue(response.data.message || 'Registration failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Google Sign-in Async Thunk
export const googleLoginUser = createAsyncThunk(
  'auth/googleLoginUser',
  async (_, { rejectWithValue }) => {
    try {
      const { signInWithGooglePopup } = await import('../../services/firebase');
      const { idToken } = await signInWithGooglePopup();
      const response = await api.post('/auth/google', { idToken });
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        return response.data;
      }
      return rejectWithValue(response.data.message || 'Google sign-in failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Google sign-in failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
      api.post('/auth/logout').catch(() => {});
    },
    clearError: (state) => {
      state.error = null;
    },
    setVerificationEmail: (state, action) => {
      state.verificationEmail = action.payload;
    },
    updateUserSubscription: (state, action) => {
      if (state.user) {
        state.user.subscriptionPlan = {
          planType: 'premium',
          expiresAt: action.payload,
          status: 'active'
        };
        localStorage.setItem('userInfo', JSON.stringify(state.user));
      }
    },
    updateUserProfileImage: (state, action) => {
      if (state.user) {
        state.user.profileImage = action.payload;
        localStorage.setItem('userInfo', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.verificationEmail = action.payload.email;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLoginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.verificationEmail = null;
      })
      .addCase(googleLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError, setVerificationEmail, updateUserSubscription, updateUserProfileImage } = authSlice.actions;
export default authSlice.reducer;
