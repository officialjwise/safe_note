import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNotes } from '@hooks/useNotes';
import { RichTextPreview } from '@components/notes';
import { LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';
import type { Note } from '@types';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  NoteEditor: { noteId?: string };
};

type NoteEditorScreenProps = StackScreenProps<NotesStackParamList, 'NoteEditor'>;

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ navigation, route }) => {
  const { noteId } = route.params || {};
  const { notes, createNote, updateNote, loading } = useNotes();
  const draftStorageKey = `securenotes_draft_${noteId || 'new'}`;

  const existingNote = noteId ? notes.find((n: Note) => n.id === noteId) : null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [hasInitializedEditor, setHasInitializedEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Screenshot protection should be implemented via native modules
      // or a proper screenshot-blocking library for iOS/Android

      return () => {
        // Cleanup
      };
    }, [])
  );

  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(draftStorageKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft) as { title: string; body: string };
          setTitle(parsedDraft.title || '');
          setBody(parsedDraft.body || '');
          setIsDirty(true);
          setHasInitializedEditor(true);
          return;
        }

        if (existingNote) {
          setTitle(existingNote.title || '');
          setBody(existingNote.body || '');
        }
      } catch (error) {
        console.error('Failed to load draft note:', error);
      } finally {
        setHasInitializedEditor(true);
      }
    };

    loadInitialContent();
  }, [draftStorageKey, existingNote]);

  useEffect(() => {
    if (!hasInitializedEditor) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        if (!title.trim() && !body.trim()) {
          await AsyncStorage.removeItem(draftStorageKey);
          return;
        }

        await AsyncStorage.setItem(
          draftStorageKey,
          JSON.stringify({ title, body, updatedAt: new Date().toISOString() })
        );
      } catch (error) {
        console.error('Failed to autosave draft:', error);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [title, body, draftStorageKey, hasInitializedEditor]);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setIsDirty(true);
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    setIsDirty(true);
  };

  const applyFormat = (prefix: string, suffix: string = prefix) => {
    const start = selection.start;
    const end = selection.end;
    const selectedText = body.slice(start, end);
    const updatedBody = `${body.slice(0, start)}${prefix}${selectedText}${suffix}${body.slice(end)}`;

    setBody(updatedBody);
    setIsDirty(true);
    const cursorPosition = start + prefix.length + selectedText.length + suffix.length;
    setSelection({ start: cursorPosition, end: cursorPosition });
  };

  const insertBullet = () => {
    const start = selection.start;
    const updatedBody = `${body.slice(0, start)}\n- ${body.slice(start)}`;
    setBody(updatedBody);
    setIsDirty(true);
    const cursorPosition = start + 3;
    setSelection({ start: cursorPosition, end: cursorPosition });
  };

  const saveDraftAndClose = async () => {
    try {
      if (!title.trim() && !body.trim()) {
        await AsyncStorage.removeItem(draftStorageKey);
      } else {
        await AsyncStorage.setItem(
          draftStorageKey,
          JSON.stringify({ title, body, updatedAt: new Date().toISOString() })
        );
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle && !trimmedBody) {
      Alert.alert('Empty Note', 'Please enter a title or content');
      return;
    }

    const noteData = {
      title: validators.sanitizeInput(trimmedTitle, 500),
      body: validators.sanitizeInput(trimmedBody, 50000),
    };

    let result;
    if (existingNote) {
      result = await updateNote(existingNote.id, noteData);
    } else {
      result = await createNote(noteData);
    }

    if (result.type && (result.type.includes('/fulfilled') || result.meta.requestStatus === 'fulfilled')) {
      await AsyncStorage.removeItem(draftStorageKey);
      setIsDirty(false);
      navigation.goBack();
    }
  };

  const handleBack = () => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }

    Alert.alert('Unsaved Changes', 'Keep editing, save a draft, or discard changes?', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(draftStorageKey);
          navigation.goBack();
        },
      },
      {
        text: 'Save Draft',
        onPress: saveDraftAndClose,
      },
    ]);
  };

  const noteDate = existingNote?.updatedAt || new Date().toISOString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.circleAction}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.textPrimary} />
        </Pressable>

        <View style={styles.topBarActions}>
          <Pressable style={styles.circleAction}>
            <MaterialCommunityIcons name="undo-variant" size={21} color={COLORS.textPrimary} />
          </Pressable>
          <Pressable style={styles.circleAction}>
            <MaterialCommunityIcons name="share-variant-outline" size={21} color={COLORS.textPrimary} />
          </Pressable>
          <Pressable style={styles.circleAction} onPress={() => setShowPreview((prev) => !prev)}>
            <MaterialCommunityIcons
              name={showPreview ? 'pencil-outline' : 'eye-outline'}
              size={21}
              color={COLORS.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!isDirty || loading}
            style={[styles.doneButton, (!isDirty || loading) && styles.doneButtonDisabled]}
          >
            <MaterialCommunityIcons name="check" size={24} color="#111111" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.editorScroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.editorContent}
        >
          <Text style={styles.dateLabel}>
            {new Date(noteDate).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={handleTitleChange}
            editable={!loading}
            selectionColor="#F4C430"
          />

          {showPreview ? (
            <View style={styles.previewContainer}>
              <RichTextPreview content={body || 'Start writing...'} textStyle={styles.body} />
            </View>
          ) : (
            <TextInput
              style={styles.bodyInput}
              placeholder="Start writing..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={body}
              onChangeText={handleBodyChange}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
              editable={!loading}
              textAlignVertical="top"
              selectionColor="#F4C430"
            />
          )}
        </ScrollView>

        <View style={styles.toolbarContainer}>
          <Pressable style={styles.toolbarButton} onPress={() => applyFormat('**', '**')}>
            <Text style={styles.toolbarButtonText}>B</Text>
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={() => applyFormat('*', '*')}>
            <Text style={styles.toolbarButtonText}>I</Text>
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={() => applyFormat('__', '__')}>
            <Text style={styles.toolbarButtonText}>U</Text>
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={() => applyFormat('~~', '~~')}>
            <Text style={styles.toolbarButtonText}>S</Text>
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={insertBullet}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.textPrimary} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={() => applyFormat('[', '](https://)')}>
            <MaterialCommunityIcons name="link-variant" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>

      </KeyboardAvoidingView>

      <LoadingSpinner visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.md,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  circleAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17191F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  editorScroll: {
    flex: 1,
  },
  editorContent: {
    flexGrow: 1,
    paddingHorizontal: PADDING.horizontal,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  dateLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  titleInput: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    marginBottom: SPACING.md,
    padding: 0,
    fontWeight: '700',
  },
  bodyInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
    padding: 0,
    fontSize: 18,
    lineHeight: 28,
    minHeight: 240,
  },
  previewContainer: {
    minHeight: 240,
    paddingTop: SPACING.sm,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontSize: 18,
    lineHeight: 28,
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#17191F',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  toolbarButton: {
    height: 36,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  toolbarButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    fontSize: 24,
  },
});

export default NoteEditorScreen;
