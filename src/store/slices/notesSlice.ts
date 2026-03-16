import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@types';
import { apiClient } from '@services/apiClient';

export interface NotesState {
  notes: Note[];
  selectedNote: Note | null;
  searchResults: Note[];
  loading: boolean;
  error: string | null;
}

const NOTES_CACHE_KEY = 'securenotes_notes_cache';

const initialState: NotesState = {
  notes: [],
  selectedNote: null,
  searchResults: [],
  loading: false,
  error: null,
};

const sortByUpdated = (notes: Note[]): Note[] => {
  return [...notes].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

// Convert API response to Note object
const transformApiNote = (apiNote: any): Note => ({
  id: apiNote.id,
  title: apiNote.title,
  body: apiNote.body, // API uses 'body'
  createdAt: apiNote.created_at,
  updatedAt: apiNote.updated_at,
  userId: apiNote.user_id,
});

export const fetchNotesThunk = createAsyncThunk(
  'notes/fetchNotes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getNotes();
      
      if (response.error || !response.data) {
        // Fall back to cached notes if API fails
        const cached = await AsyncStorage.getItem(NOTES_CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as Note[];
        }
        return rejectWithValue(response.error || 'Failed to fetch notes');
      }

      const notes = (response.data as any[]).map(transformApiNote);
      const sorted = sortByUpdated(notes);
      
      // Cache the notes locally
      await AsyncStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(sorted));
      
      return sorted;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch notes');
    }
  }
);

export const createNoteThunk = createAsyncThunk(
  'notes/createNote',
  async (noteData: CreateNoteRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.createNote(noteData.title, noteData.body);

      if (response.error || !response.data) {
        return rejectWithValue(response.error || 'Failed to create note');
      }

      const note = transformApiNote(response.data);
      
      // Update cache
      const cached = await AsyncStorage.getItem(NOTES_CACHE_KEY);
      const notes = cached ? JSON.parse(cached) : [];
      const updated = sortByUpdated([note, ...notes]);
      await AsyncStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(updated));
      
      return note;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create note');
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
      const response = await apiClient.updateNote(id, noteData.title, noteData.body);

      if (response.error || !response.data) {
        return rejectWithValue(response.error || 'Failed to update note');
      }

      const note = transformApiNote(response.data);
      
      // Update cache
      const cached = await AsyncStorage.getItem(NOTES_CACHE_KEY);
      const notes = cached ? JSON.parse(cached) : [];
      const updated = sortByUpdated(
        notes.map((n: Note) => (n.id === id ? note : n))
      );
      await AsyncStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(updated));
      
      return note;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update note');
    }
  }
);

export const deleteNoteThunk = createAsyncThunk(
  'notes/deleteNote',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.deleteNote(id);

      if (response.error) {
        return rejectWithValue(response.error || 'Failed to delete note');
      }

      // Update cache
      const cached = await AsyncStorage.getItem(NOTES_CACHE_KEY);
      if (cached) {
        const notes = JSON.parse(cached) as Note[];
        const updated = notes.filter((n: Note) => n.id !== id);
        await AsyncStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(updated));
      }
      
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete note');
    }
  }
);

export const searchNotesThunk = createAsyncThunk(
  'notes/searchNotes',
  async (query: string, { rejectWithValue }) => {
    try {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return [] as Note[];
      }

      // Try to search via API first
      const response = await apiClient.searchNotes(query);
      
      if (response.data) {
        const notes = (response.data as any[]).map(transformApiNote);
        return sortByUpdated(notes);
      }

      // Fall back to local cache search
      const cached = await AsyncStorage.getItem(NOTES_CACHE_KEY);
      if (cached) {
        const notes = JSON.parse(cached) as Note[];
        const results = notes.filter((note) => {
          const title = note.title.toLowerCase();
          const body = note.body.toLowerCase();
          return title.includes(normalized) || body.includes(normalized);
        });
        return sortByUpdated(results);
      }

      return [] as Note[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search notes');
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
    builder
      .addCase(fetchNotesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchNotesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNoteThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = sortByUpdated([action.payload, ...state.notes]);
      })
      .addCase(createNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNoteThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = sortByUpdated(
          state.notes.map((note) => (note.id === action.payload.id ? action.payload : note))
        );
        if (state.selectedNote?.id === action.payload.id) {
          state.selectedNote = action.payload;
        }
      })
      .addCase(updateNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
      })
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