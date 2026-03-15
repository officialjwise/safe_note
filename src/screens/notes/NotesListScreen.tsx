import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotes } from '@hooks/useNotes';
import { NoteCard, SearchBar } from '@components/notes';
import { LoadingSpinner, ScreenHeader } from '@components/shared';
import { EmptyState } from '@components/ui';
import { COLORS, SPACING, PADDING } from '@constants';
import type { StackScreenProps } from '@react-navigation/stack';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  NoteEditor: { noteId?: string };
};

type NotesListScreenProps = StackScreenProps<NotesStackParamList, 'NotesList'>;

const NotesListScreen: React.FC<NotesListScreenProps> = ({ navigation }): JSX.Element => {
  const { notes, searchResults, loading, fetchNotes, searchNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const displayNotes = searchQuery.length > 0 ? searchResults : notes;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotes();
    });

    return unsubscribe;
  }, [navigation, fetchNotes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchNotes(query);
  };

  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteDetail', { noteId });
  };

  const handleNoteDelete = (noteId: string) => {
    // Delete will be handled in detail screen
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  const handleNavigateToSettings = () => {
    navigation.getParent()?.navigate('Settings');
  };

  const renderEmptyState = () => {
    if (searchQuery.length > 0) {
      return (
        <EmptyState
          iconName="magnify"
          heading="No results"
          subtext={`We couldn't find notes matching "${searchQuery}"`}
        />
      );
    }

    return (
      <EmptyState
        iconName="lock-outline"
        heading="No notes yet"
        subtext="Tap + to create your first secure note"
        ctaLabel="Create Note"
        onCtaPress={handleCreateNote}
      />
    );
  };

  const renderSkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { height: 16, marginBottom: SPACING.md }]} />
      <View style={[styles.skeletonLine, { height: 12, width: '80%', marginBottom: SPACING.md }]} />
      <View style={[styles.skeletonLine, { height: 12, width: '60%' }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="My Notes"
        showBackButton={false}
        rightIcon="cog-outline"
        onRightIconPress={handleNavigateToSettings}
      />

      <SearchBar onSearch={handleSearch} />

      {loading && displayNotes.length === 0 ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View testID={`skeleton-${i}`} style={styles.skeletonWrapper}>
              {renderSkeletonCard()}
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={displayNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <NoteCard
                title={item.title}
                body={item.body}
                updatedAt={item.updatedAt}
                onPress={() => handleNotePress(item.id)}
                onDelete={() => handleNoteDelete(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
            />
          }
          contentContainerStyle={styles.listContent}
          scrollEnabled={displayNotes.length > 0}
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handleCreateNote}
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color={COLORS.primaryBackground}
        />
      </Pressable>

      <LoadingSpinner visible={loading && displayNotes.length > 0} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  listContent: {
    paddingHorizontal: PADDING.horizontal,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.huge,
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: PADDING.horizontal,
    paddingTop: SPACING.md,
  },
  skeletonWrapper: {
    marginBottom: SPACING.md,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.elevatedSurface,
    padding: SPACING.lg,
  },
  skeletonLine: {
    backgroundColor: COLORS.elevatedSurface,
    borderRadius: 6,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.95 }],
  },
});

export default NotesListScreen;
