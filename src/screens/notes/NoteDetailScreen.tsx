import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNotes } from '@hooks/useNotes';
import { ConfirmDialog, ScreenHeader, LoadingSpinner } from '@components/shared';
import { Button, EmptyState } from '@components/ui';
import { formatters } from '@utils/formatters';
import { COLORS, SPACING, TYPOGRAPHY, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  NoteEditor: { noteId?: string };
};

type NoteDetailScreenProps = StackScreenProps<NotesStackParamList, 'NoteDetail'>;

const NoteDetailScreen: React.FC<NoteDetailScreenProps> = ({ navigation, route }) => {
  const { noteId } = route.params;
  const { notes, deleteNote, handleSelectNote, handleClearSelectedNote } = useNotes();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const note = notes.find((n) => n.id === noteId);

  useFocusEffect(
    React.useCallback(() => {
      // Screenshot protection should be implemented via native modules
      // or a proper screenshot-blocking library for iOS/Android

      return () => {
        // Cleanup
      };
    }, [])
  );

  const handleDeleteNote = async () => {
    if (!note) return;

    setDeleting(true);
    try {
      const result = await deleteNote(note.id);
      setShowDeleteDialog(false);

      // Navigate back after deletion
      if (result.type === 'notes/deleteNote/fulfilled') {
        navigation.goBack();
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!note) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Note" onBackPress={() => navigation.goBack()} />
        <EmptyState
          iconName="file-not-found"
          heading="Note not found"
          subtext="This note may have been deleted"
          ctaLabel="Go Back"
          onCtaPress={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Note"
        onBackPress={() => navigation.goBack()}
        rightIcon="pencil-outline"
        onRightIconPress={() =>
          navigation.push('NoteEditor', { noteId: note.id })
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{note.title || 'Untitled'}</Text>

        <View style={styles.timestampsContainer}>
          <Text style={styles.timestamp}>
            Created: {formatters.formatDateTime(note.createdAt)}
          </Text>
          <Text style={styles.timestamp}>
            Updated: {formatters.formatDateTime(note.updatedAt)}
          </Text>
        </View>

        <View style={styles.bodyContainer}>
          <Text style={styles.body}>{note.body}</Text>
        </View>

        <View style={styles.deleteButtonContainer}>
          <Button
            title="Delete Note"
            variant="destructive"
            onPress={() => setShowDeleteDialog(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Note?"
        message="This action cannot be undone. Your note will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDeleteNote}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <LoadingSpinner visible={deleting} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING.horizontal,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontWeight: '700',
  },
  timestampsContainer: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.elevatedSurface,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  bodyContainer: {
    marginBottom: SPACING.xl,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  deleteButtonContainer: {
    marginTop: SPACING.xl,
  },
});

export default NoteDetailScreen;
