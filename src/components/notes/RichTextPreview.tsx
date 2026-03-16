import React from 'react';
import { Linking, Text, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants';

interface RichTextPreviewProps {
  content: string;
  textStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

type InlineToken = {
  key: string;
  text: string;
  style?: TextStyle;
  linkUrl?: string;
};

const TOKEN_REGEX = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|\[[^\]]+\]\(([^)]+)\))/g;

const parseInlineTokens = (line: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of line.matchAll(TOKEN_REGEX)) {
    const full = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      tokens.push({
        key: `plain-${matchIndex}-${lastIndex}`,
        text: line.slice(lastIndex, start),
      });
    }

    if (full.startsWith('**') && full.endsWith('**')) {
      tokens.push({
        key: `bold-${matchIndex}`,
        text: full.slice(2, -2),
        style: styles.bold,
      });
    } else if (full.startsWith('__') && full.endsWith('__')) {
      tokens.push({
        key: `underline-${matchIndex}`,
        text: full.slice(2, -2),
        style: styles.underline,
      });
    } else if (full.startsWith('*') && full.endsWith('*')) {
      tokens.push({
        key: `italic-${matchIndex}`,
        text: full.slice(1, -1),
        style: styles.italic,
      });
    } else if (full.startsWith('~~') && full.endsWith('~~')) {
      tokens.push({
        key: `strike-${matchIndex}`,
        text: full.slice(2, -2),
        style: styles.strike,
      });
    } else if (full.startsWith('[')) {
      const linkMatch = full.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const parsedUrl = linkMatch[2].startsWith('http://') || linkMatch[2].startsWith('https://')
          ? linkMatch[2]
          : `https://${linkMatch[2]}`;

        tokens.push({
          key: `link-${matchIndex}`,
          text: linkMatch[1],
          linkUrl: parsedUrl,
          style: styles.link,
        });
      } else {
        tokens.push({ key: `raw-${matchIndex}`, text: full });
      }
    } else {
      tokens.push({ key: `raw-${matchIndex}`, text: full });
    }

    lastIndex = start + full.length;
    matchIndex += 1;
  }

  if (lastIndex < line.length) {
    tokens.push({
      key: `plain-tail-${lastIndex}`,
      text: line.slice(lastIndex),
    });
  }

  return tokens;
};

const RichTextPreview: React.FC<RichTextPreviewProps> = ({
  content,
  textStyle,
  containerStyle,
}) => {
  const lines = content.split('\n');

  return (
    <View style={containerStyle}>
      {lines.map((line, lineIndex) => {
        const isBullet = line.startsWith('- ');
        const lineText = isBullet ? line.slice(2) : line;
        const tokens = parseInlineTokens(lineText);

        return (
          <Text key={`line-${lineIndex}`} style={[styles.text, textStyle]}>
            {isBullet ? '\u2022 ' : ''}
            {tokens.length === 0 ? ' ' : null}
            {tokens.map((token) => (
              <Text
                key={token.key}
                style={token.style}
                onPress={
                  token.linkUrl
                    ? () => {
                        Linking.openURL(token.linkUrl as string).catch(() => undefined);
                      }
                    : undefined
                }
              >
                {token.text}
              </Text>
            ))}
            {lineIndex < lines.length - 1 ? '\n' : ''}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  link: {
    color: COLORS.info,
    textDecorationLine: 'underline',
  },
});

export default RichTextPreview;
