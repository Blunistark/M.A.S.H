import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../theme';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  children?: React.ReactNode;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, children }) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={styles.messageContent}>
        {/* Assistant Identity Badge */}
        {!isUser && (
          <View style={styles.badgeRow}>
            <Text style={styles.badgeIcon}>🤖</Text>
            <Text style={styles.badgeLabel}>M.A.S.H Intelligence</Text>
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
            {message.text}
          </Text>
        </View>
        
        {/* Render child cards if any (for assistant message details) */}
        {!!children && <View style={styles.cardContainer}>{children}</View>}
        
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 10,
    paddingHorizontal: Theme.spacing.containerPadding,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  messageContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.primary, // sky-600 equivalent
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#F2F2F7', // Off-white bubble
    borderRadius: 16,
    borderTopRightRadius: 0, // Flat top-right
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  assistantBubble: {
    backgroundColor: 'transparent', // Minimalist directly inline text
    paddingHorizontal: 0, // No inset spacing
    paddingVertical: 4,
  },
  text: {
    fontSize: Theme.typography.bodyMd.fontSize,
    lineHeight: Theme.typography.bodyMd.lineHeight,
    fontFamily: Theme.typography.fontFamily,
  },
  userText: {
    color: '#334155', // Slate-700 text color
  },
  assistantText: {
    color: Theme.colors.onSurfaceVariant, // Clinical slate text
    fontSize: 17, // slightly larger body text for AI
    lineHeight: 26,
  },
  cardContainer: {
    marginTop: 10,
    width: '100%',
  },
  timestamp: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 6,
    color: Theme.colors.onSurfaceVariant,
    opacity: 0.6,
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 6,
  },
  assistantTimestamp: {
    textAlign: 'left',
    marginLeft: 0,
  },
});
