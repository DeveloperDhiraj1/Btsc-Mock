import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  tests: [],
  activeTest: null,
  activeAttemptAnswers: [], // [{ questionId, selectedOption, timeSpent }]
  currentQuestionIndex: 0,
  loading: false,
  submitting: false,
  error: null,
  latestResult: null
};

// Fetch Tests Thunk
export const fetchTests = createAsyncThunk(
  'test/fetchTests',
  async (category = '', { rejectWithValue }) => {
    try {
      const response = await api.get(`/tests${category ? `?category=${category}` : ''}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tests');
    }
  }
);

// Start Test Attempt Thunk
export const startTestAttempt = createAsyncThunk(
  'test/startAttempt',
  async (testId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tests/${testId}/attempt`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start exam');
    }
  }
);

// Submit Test Attempt Thunk
export const submitTestAttempt = createAsyncThunk(
  'test/submitAttempt',
  async ({ testId, answers, timeSpent }, { rejectWithValue }) => {
    try {
      const response = await api.post('/tests/submit', { testId, answers, timeSpent });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit test');
    }
  }
);

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    selectQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    saveAnswer: (state, action) => {
      const { questionId, selectedOption, timeSpent } = action.payload;
      const existing = state.activeAttemptAnswers.find(a => a.questionId === questionId);
      if (existing) {
        existing.selectedOption = selectedOption;
        existing.timeSpent += timeSpent;
      } else {
        state.activeAttemptAnswers.push({ questionId, selectedOption, timeSpent });
      }
    },
    clearActiveTest: (state) => {
      state.activeTest = null;
      state.activeAttemptAnswers = [];
      state.currentQuestionIndex = 0;
      state.latestResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tests
      .addCase(fetchTests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload;
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Start Test Attempt
      .addCase(startTestAttempt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTestAttempt.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTest = action.payload;
        state.currentQuestionIndex = 0;
        // Seed initial answer structure
        state.activeAttemptAnswers = action.payload.questions.map(q => ({
          questionId: q._id,
          selectedOption: null,
          timeSpent: 0
        }));
      })
      .addCase(startTestAttempt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Test Attempt
      .addCase(submitTestAttempt.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitTestAttempt.fulfilled, (state, action) => {
        state.submitting = false;
        state.latestResult = action.payload;
      })
      .addCase(submitTestAttempt.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  }
});

export const { selectQuestion, saveAnswer, clearActiveTest } = testSlice.actions;
export default testSlice.reducer;
