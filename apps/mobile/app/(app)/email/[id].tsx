'use client';

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MailIcon, ArrowLeftIcon, StarIcon, ArchiveIcon, TrashIcon, ReplyIcon, ForwardIcon, FlagIcon } from '@/components/ui/Icons';
import { useEmail } from '@/hooks/useEmail';

export default function EmailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { email, isLoading, isLoading: isLoadingActions, archive, trash, star, reply, forward } = useEmail(id as string);

  const handleArchive = async () => {
    try {
      await archive();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to archive email');
    }
  };

  const handleTrash = async () => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to move this email to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await trash();
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete email');
          }
        }},
      ]
    );
  };

  const handleStar = async () => {
    try {
      await star(!email?.isStarred);
    } catch (error) {
      Alert.alert('Error', 'Failed to update star');
    }
  };

  const handleReply = () => {
    router.push(`/app/compose?replyTo=${id}`);
  };

  const handleForward = () => {
    router.push(`/app/compose?forward=${id}`);
  };

  if (isLoading) {
    return (
      <View style={[
        styles.container,
        theme === 'dark' ? styles.containerDark : styles.containerLight,
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  if (!email) {
    return (
      <View style={[
        styles.container,
        theme === 'dark' ? styles.containerDark : styles.containerLight,
      ]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Email not found</Text>
          <Button title="Back to Inbox" onPress={() => router.back()} variant="outline" />
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[
      styles.container,
      theme === 'dark' ? styles.containerDark : styles.containerLight,
    ]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={24} color={theme === 'dark' ? '#FFFFFF' : '#1E3A8A'} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleStar} style={styles.actionButton}>
            <StarIcon size={22} color={email?.isStarred ? '#FBBF24' : (theme === 'dark' ? '#94A3B8' : '#64748B')} filled={email?.isStarred} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleArchive} style={styles.actionButton}>
            <ArchiveIcon size={22} color={theme === 'dark' ? '#FFFFFF' : '#1E3A8A'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTrash} style={styles.actionButton}>
            <TrashIcon size={22} color={theme === 'dark' ? '#FFFFFF' : '#1E3A8A'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emailHeader}>
          <View style={styles.senderRow}>
            <Avatar
              name={email.from}
              email={email.fromEmail}
              size={48}
              theme={theme}
            />
            <View style={styles.senderInfo}>
              <Text style={[
                styles.senderName,
                theme === 'dark' ? styles.senderNameDark : styles.senderNameLight,
              ]}>
                {email.from}
              </Text>
              <Text style={[
                styles.senderEmail,
                theme === 'dark' ? styles.senderEmailDark : styles.senderEmailLight,
              ]}>
                {email.fromEmail}
              </Text>
            </View>
          </View>

          <Text style={[
            styles.subject,
            theme === 'dark' ? styles.subjectDark : styles.subjectLight,
          ]}>
            {email.subject || '(No subject)'}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[
              styles.metaText,
              theme === 'dark' ? styles.metaTextDark : styles.metaTextLight,
            ]}>
              {formatDate(email.date)}
            </Text>
            {email.hasAttachment && (
              <View style={styles.attachmentBadge}>
                <PaperclipIcon size={12} color="#3B82F6" />
                <Text style={styles.badgeText}>Attachment</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.emailBody}>
          <Text style={[
            styles.bodyText,
            theme === 'dark' ? styles.bodyTextDark : styles.bodyTextLight,
          ]}>
            {email.body || email.snippet}
          </Text>
        </View>

        {email.attachments && email.attachments.length > 0 && (
          <View style={styles.attachmentsSection}>
            <Text style={[
              styles.attachmentTitle,
              theme === 'dark' ? styles.attachmentTitleDark : styles.attachmentTitleLight,
            ]}>
              Attachments
            </Text>
            {email.attachments.map((attachment: any, index: number) => (
              <View key={index} style={styles.attachmentItem}>
                <PaperclipIcon size={18} color="#3B82F6" />
                <Text style={[
                  styles.attachmentName,
                  theme === 'dark' ? styles.attachmentNameDark : styles.attachmentNameLight,
                ]}>
                  {attachment.filename}
                </Text>
                <Text style={[
                  styles.attachmentSize,
                  theme === 'dark' ? styles.attachmentSizeDark : styles.attachmentSizeLight,
                ]}>
                  {formatFileSize(attachment.size)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionBar}>
          <Button
            title="Reply"
            onPress={handleReply}
            variant="outline"
            icon="reply"
            size="sm"
            flex={1}
          />
          <Button
            title="Forward"
            onPress={handleForward}
            variant="outline"
            icon="forward"
            size="sm"
            flex={1}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ArrowLeftIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

function PaperclipIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05a12.12 12.12 0 0 1-14 0"/>
      <path d="M15.55 9.55a12.12 12.12 0 0 1 0 14"/>
      <path d="M9.55 15.45a12.12 12.12 0 0 1-14 0"/>
      <path d="M13 3l4 4 2-2"/>
      <path d="M13 21l-4-4 2-2"/>
    </svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  containerLight: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerDark: {
    backgroundColor: '#1E293B',
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emailHeader: {
    padding: 16,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: '600',
  },
  senderNameDark: {
    color: '#F1F5F9',
  },
  senderNameLight: {
    color: '#1E293B',
  },
  senderEmail: {
    fontSize: 14,
  },
  senderEmailDark: {
    color: '#94A3B8',
  },
  senderEmailLight: {
    color: '#64748B',
  },
  subject: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 28,
  },
  subjectDark: {
    color: '#F1F5F9',
  },
  subjectLight: {
    color: '#1E293B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 13,
  },
  metaTextDark: {
    color: '#94A3B8',
  },
  metaTextLight: {
    color: '#64748B',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  dividerDark: {
    backgroundColor: '#334155',
  },
  emailBody: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
  },
  bodyTextDark: {
    color: '#E2E8F0',
  },
  bodyTextLight: {
    color: '#334155',
  },
  attachmentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  attachmentTitleDark: {
    color: '#F1F5F9',
  },
  attachmentTitleLight: {
    color: '#1E293B',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentItemDark: {
    backgroundColor: '#1E293B',
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
  },
  attachmentNameDark: {
    color: '#F1F5F9',
  },
  attachmentNameLight: {
    color: '#1E293B',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#64748B',
  },
  attachmentSizeDark: {
    color: '#94A3B8',
  },
  attachmentSizeLight: {
    color: '#64748B',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBarDark: {
    backgroundColor: '#1E293B',
    borderTopColor: '#334155',
  },
});

import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { ArrowLeftIcon, ArchiveIcon, TrashIcon, StarIcon, ReplyIcon, ForwardIcon, PaperclipIcon } from '@/components/ui/Icons';
import { useEmail } from '@/hooks/useEmail';