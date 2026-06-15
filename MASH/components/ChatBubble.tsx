import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
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
        {children && <View style={styles.cardContainer}>{children}</View>}
        
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
    paddingHorizontal: 16,
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
    backgroundColor: '#ccfbf1', // teal-100
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  avatarText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#0d9488', // teal-600
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1e293b', // slate-800
  },
  cardContainer: {
    marginTop: 8,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    color: '#94a3b8', // slate-400
  },
  userTimestamp: {
    textAlign: 'right',
    marginRight: 4,
  },
  assistantTimestamp: {
    textAlign: 'left',
    marginLeft: 4,
  },
});
