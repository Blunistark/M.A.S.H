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
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}
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
    marginVertical: 8,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  avatarText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: Theme.roundness.lg, // 24px
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary,
    borderTopRightRadius: 6,
    ...Theme.shadows.level1,
  },
  assistantBubble: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    ...Theme.shadows.level1,
  },
  text: {
    fontSize: Theme.typography.bodyMd.fontSize,
    lineHeight: Theme.typography.bodyMd.lineHeight,
    fontFamily: Theme.typography.fontFamily,
  },
  userText: {
    color: Theme.colors.white,
  },
  assistantText: {
    color: Theme.colors.onSurface,
  },
  cardContainer: {
    marginTop: 10,
  },
  timestamp: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 4,
    color: Theme.colors.outline,
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
