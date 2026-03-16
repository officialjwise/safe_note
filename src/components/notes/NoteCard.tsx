import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';
import { formatters } from '@utils/formatters';
import Card from '../ui/Card';

interface NoteCardProps {
  title: string;
  body: string;
  updatedAt: string;
  onPress: () => void;
  onDelete: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  title,
  body,
  updatedAt,
  onPress,
  onDelete,
}) => {
  void onDelete;

  const preview = formatters.truncateLines(body, 2);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.container}>
          <View style={styles.accentBar} />

          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'Untitled'}
            </Text>

            <Text style={styles.preview} numberOfLines={2}>
              {preview || 'Empty note'}
            </Text>
          </View>

          <Text style={styles.date}>{formatters.formatDate(updatedAt)}</Text>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  card: {
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
  },
  accentBar: {
    width: 4,
    height: '100%',
    backgroundColor: COLORS.accent,
    marginRight: SPACING.lg,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  preview: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
  },
});

export default NoteCard;
