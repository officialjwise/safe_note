import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search notes...' }) => {
  const [query, setQuery] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search for 300ms
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(text);
      }, 300);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onSearch('');
  }, [onSearch]);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleChangeText}
          clearButtonMode="never"
        />

        {query.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryBackground,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.elevatedSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.elevatedSurface,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: TYPOGRAPHY.body.fontSize,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
});

export default SearchBar;
