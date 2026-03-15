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

  const fetchNotes = () => {
    return dispatch(fetchNotesThunk());
  };

  const createNote = (noteData: CreateNoteRequest) => {
    return dispatch(createNoteThunk(noteData));
  };

  const updateNote = (id: string, noteData: UpdateNoteRequest) => {
    return dispatch(updateNoteThunk({ id, noteData }));
  };

  const deleteNote = (id: string) => {
    return dispatch(deleteNoteThunk(id));
  };

  const searchNotes = (query: string) => {
    if (!query.trim()) {
      dispatch(clearSearchResults());
      return Promise.resolve();
    }
    return dispatch(searchNotesThunk(query));
  };

  const handleSelectNote = (note: any) => {
    dispatch(setSelectedNote(note));
  };

  const handleClearSelectedNote = () => {
    dispatch(clearSelectedNote());
  };

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
