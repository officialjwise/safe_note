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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNotes } from '@hooks/useNotes';
import { ScreenHeader, LoadingSpinner } from '@components/shared';
import { validators } from '@utils/validators';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  NoteEditor: { noteId?: string };
};

type NoteEditorScreenProps = StackScreenProps<NotesStackParamList, 'NoteEditor'>;

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ navigation, route }) => {
  const { noteId } = route.params || {};
  const { notes, createNote, updateNote, loading } = useNotes();

  const existingNote = noteId ? notes.find((n) => n.id === noteId) : null;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [body, setBody] = useState(existingNote?.body || '');
  const [isDirty, setIsDirty] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Screenshot protection should be implemented via native modules
      // or a proper screenshot-blocking library for iOS/Android

      return () => {
        // Cleanup
      };
    }, [])
  );

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setIsDirty(true);
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    setIsDirty(true);
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
      setIsDirty(false);
      navigation.goBack();
    }
  };

  const isScreenTitle = existingNote ? 'Edit Note' : 'New Note';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (isDirty) {
              Alert.alert('Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard them?');
            }
            navigation.goBack();
          }}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </Pressable>

        <Text style={styles.headerTitle}>{isScreenTitle}</Text>

        <Pressable
          onPress={handleSave}
          disabled={!isDirty || loading}
          style={[styles.headerButton, (!isDirty || loading) && styles.headerButtonDisabled]}
        >
          <Text
            style={[styles.headerButtonText, (!isDirty || loading) && styles.headerButtonTextDisabled]}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={handleTitleChange}
            editable={!loading}
          />

          <TextInput
            style={styles.bodyInput}
            placeholder="Write your note..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            scrollEnabled={false}
            value={body}
            onChangeText={handleBodyChange}
            editable={!loading}
            textAlignVertical="top"
          />
        </View>
      </KeyboardAvoidingView>

      <LoadingSpinner visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.elevatedSurface,
  },
  headerButton: {
    padding: SPACING.md,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.accent,
    fontSize: 18,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  headerTitle: {
    ...TYPOGRAPHY.sectionHeader,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.lg,
  },
  titleInput: {
    ...TYPOGRAPHY.title,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    padding: 0,
    fontWeight: '700',
  },
  bodyInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
    padding: 0,
    lineHeight: 24,
  },
});

export default NoteEditorScreen;
