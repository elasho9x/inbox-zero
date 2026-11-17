'use client';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from './Avatar';

interface EmailItemProps {
  email: {
    id: string;
    subject: string;
    from: string;
    fromEmail: string;
    snippet: string;
    date: string;
    isRead: boolean;
    hasAttachment: boolean;
    isStarred: boolean;
  };
  onPress: () => void;
  theme: 'light' | 'dark';
}

export function EmailItem({ email, onPress, theme }: EmailItemProps) {
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        !email.isRead && styles.unread,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Avatar
            name={email.from}
            email={email.fromEmail}
            size={40}
            theme={theme}
          />
        </View>
        <View style={styles.middleSection}>
          <View style={styles.headerRow}>
            <Text style={[
              styles.senderName,
              isDark ? styles.senderNameDark : styles.senderNameLight,
              !email.isRead && styles.unreadText,
            ]}>
              {email.from}
            </Text>
            <Text style={[
              styles.timestamp,
              isDark ? styles.timestampDark : styles.timestampLight,
            ]}>
              {formatTime(email.date)}
            </Text>
          </View>
          <View style={styles.subjectRow}>
            <Text style={[
              styles.subject,
              isDark ? styles.subjectDark : styles.subjectLight,
              !email.isRead && styles.unreadText,
            ]}>
              {email.subject || '(No subject)'}
            </Text>
            {email.isStarred && (
              <Text style={styles.star}>★</Text>
            )}
            {email.hasAttachment && (
              <Text style={styles.attachment}>📎</Text>
            )}
          </View>
          <Text style={[
            styles.snippet,
            isDark ? styles.snippetDark : styles.snippetLight,
            !email.isRead && styles.unreadText,
          ]}>
            {email.snippet}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F1F5F9',
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderBottomColor: '#334155',
  },
  unread: {
    backgroundColor: '#EFF6FF',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  leftSection: {
    flexShrink: 0,
  },
  middleSection: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  senderNameLight: {
    color: '#1E293B',
  },
  senderNameDark: {
    color: '#F1F5F9',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 8,
    flexShrink: 0,
  },
  timestampLight: {
    color: '#94A3B8',
  },
  timestampDark: {
    color: '#94A3B8',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  subject: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  subjectLight: {
    color: '#334155',
  },
  subjectDark: {
    color: '#E2E8F0',
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  snippetLight: {
    color: '#64748B',
  },
  snippetDark: {
    color: '#94A3B8',
  },
  unreadText: {
    fontWeight: '600',
  },
  star: {
    fontSize: 12,
    color: '#FBBF24',
  },
  attachment: {
    fontSize: 12,
  },
});