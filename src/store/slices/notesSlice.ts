import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@services/api';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@types';

export interface NotesState {
  notes: Note[];
  selectedNote: Note | null;
  searchResults: Note[];
  loading: boolean;
  error: string | null;
}

const initialState: NotesState = {
  notes: [],
  selectedNote: null,
  searchResults: [],
  loading: false,
  error: null,
};

export const fetchNotesThunk = createAsyncThunk(
  'notes/fetchNotes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Note[]>('/v1/notes');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
    }
  }
);

export const createNoteThunk = createAsyncThunk(
  'notes/createNote',
  async (noteData: CreateNoteRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<Note>('/v1/notes', noteData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create note');
    }
  }
);

export const updateNoteThunk = createAsyncThunk(
  'notes/updateNote',
  async (
    { id, noteData }: { id: string; noteData: UpdateNoteRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put<Note>(`/v1/notes/${id}`, noteData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update note');
    }
  }
);

export const deleteNoteThunk = createAsyncThunk(
  'notes/deleteNote',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/v1/notes/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete note');
    }
  }
);

export const searchNotesThunk = createAsyncThunk(
  'notes/searchNotes',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Note[]>('/v1/notes/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search notes');
    }
  }
);

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setSelectedNote: (state, action) => {
      state.selectedNote = action.payload;
    },
    clearSelectedNote: (state) => {
      state.selectedNote = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Notes
    builder
      .addCase(fetchNotesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
      .addCase(fetchNotesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Note
    builder
      .addCase(createNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNoteThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes.unshift(action.payload);
      })
      .addCase(createNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Note
    builder
      .addCase(updateNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNoteThunk.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notes.findIndex((note) => note.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
          state.notes = state.notes.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload;
        }
      })
      .addCase(updateNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Note
    builder
      .addCase(deleteNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNoteThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = state.notes.filter((note) => note.id !== action.payload);
        if (state.selectedNote?.id === action.payload) {
          state.selectedNote = null;
        }
      })
      .addCase(deleteNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search Notes
    builder
      .addCase(searchNotesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchNotesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchNotesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.searchResults = [];
      });
  },
});

export const { setSelectedNote, clearSelectedNote, clearSearchResults } = notesSlice.actions;
export default notesSlice.reducer;
