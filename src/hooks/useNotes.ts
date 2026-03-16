import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@store';
import {
  fetchNotesThunk,
  createNoteThunk,
  updateNoteThunk,
  deleteNoteThunk,
  searchNotesThunk,
  setSelectedNote,
  clearSelectedNote,
  clearSearchResults,
} from '@store/slices/notesSlice';
import type { CreateNoteRequest, UpdateNoteRequest } from '@types';

export const useNotes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notes, selectedNote, searchResults, loading, error } = useSelector(
    (state: RootState) => state.notes
  );

  const fetchNotes = useCallback(() => {
    return dispatch(fetchNotesThunk());
  }, [dispatch]);

  const createNote = useCallback((noteData: CreateNoteRequest) => {
    return dispatch(createNoteThunk(noteData));
  }, [dispatch]);

  const updateNote = useCallback((id: string, noteData: UpdateNoteRequest) => {
    return dispatch(updateNoteThunk({ id, noteData }));
  }, [dispatch]);

  const deleteNote = useCallback((id: string) => {
    return dispatch(deleteNoteThunk(id));
  }, [dispatch]);

  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) {
      dispatch(clearSearchResults());
      return Promise.resolve();
    }
    return dispatch(searchNotesThunk(query));
  }, [dispatch]);

  const handleSelectNote = useCallback((note: any) => {
    dispatch(setSelectedNote(note));
  }, [dispatch]);

  const handleClearSelectedNote = useCallback(() => {
    dispatch(clearSelectedNote());
  }, [dispatch]);

  return {
    notes,
    selectedNote,
    searchResults,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    handleSelectNote,
    handleClearSelectedNote,
  };
};
