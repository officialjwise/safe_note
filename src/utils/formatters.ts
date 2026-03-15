import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatters = {
  formatDate(dateString: string): string {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  },

  formatDateTime(dateString: string): string {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Unknown date';
    }
  },

  formatRelativeTime(dateString: string): string {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  },

  truncateText(text: string, length: number = 100): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },

  truncateLines(text: string, lines: number = 2): string {
    const textLines = text.split('\n').slice(0, lines).join('\n');
    if (text.split('\n').length > lines) {
      return textLines.trim() + '...';
    }
    return textLines.trim();
  },
};
