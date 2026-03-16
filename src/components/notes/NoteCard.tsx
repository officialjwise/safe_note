import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';
import { formatters } from '@utils/formatters';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
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
  const swipeableRef = React.useRef<Swipeable | null>(null);

  const renderRightActions = () => {
    return (
      <RectButton style={styles.deleteButton} onPress={handleDelete}>
        <MaterialCommunityIcons name="trash-can" size={24} color={COLORS.textPrimary} />
      </RectButton>
    );
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete();
  };

  const preview = formatters.truncateLines(body, 2);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      activeOffsetX={{ right: 20 }}
      activeOffsetY={[-5, 5]}
      friction={2}
    >
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
    </Swipeable>
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
  deleteButton: {
    backgroundColor: COLORS.destructive,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
  },
});

export default NoteCard;
