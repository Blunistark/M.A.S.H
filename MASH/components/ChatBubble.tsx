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
    marginVertical: 6,
    paddingHorizontal: Theme.spacing.containerPadding,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: 16, // Shrunk/compact
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary, // Pink primary bubble
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Theme.colors.surface, // White surface background
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline, // Soft pink outline
  },
  text: {
    fontSize: Theme.typography.bodyMd.fontSize,
    lineHeight: Theme.typography.bodyMd.lineHeight,
    fontFamily: Theme.typography.fontFamily,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: Theme.colors.onSurface, // High-contrast dark berry-grey text
  },
  cardContainer: {
    marginTop: 8,
    width: '100%',
  },
  timestamp: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 4,
    color: Theme.colors.onSurfaceVariant, // Soft dark pink-grey text
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 6,
  },
  assistantTimestamp: {
    textAlign: 'left',
    marginLeft: 6,
  },
});
