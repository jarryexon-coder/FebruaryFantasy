// src/store/nbaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nbaAPI } from '../services/api';

export const fetchGames = createAsyncThunk(
  'nba/fetchGames',
  async () => {
    const response = await nbaAPI.getGames();
    return response.data;
  }
);

export const fetchLiveScores = createAsyncThunk(
  'nba/fetchLiveScores',
  async () => {
    const response = await nbaAPI.getLiveScores();
    return response.data;
  }
);

const nbaSlice = createSlice({
  name: 'nba',
  initialState: {
    games: [],
    liveScores: [],
    loading: false,
    error: null,
    lastUpdated: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload.games;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchLiveScores.fulfilled, (state, action) => {
        state.liveScores = action.payload.games;
      });
  },
});

export const { clearError } = nbaSlice.actions;
export default nbaSlice.reducer;
