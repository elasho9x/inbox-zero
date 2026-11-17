'use client';

import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { MailIcon, SendIcon, CloseIcon, PaperclipIcon, ArrowLeftIcon, ChevronDownIcon } from '@/components/ui/Icons';
import { useCompose } from '@/hooks/useCompose';

export default function ComposeScreen() {
  const router = useRouter();
  const { replyTo, forward, draftId } = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    to, setTo, 
    cc, setCc, 
    bcc, setBcc, 
    subject, setSubject, 
    body, setBody, 
    isSending, 
    send, 
    saveDraft,
    loadDraft 
  } = useCompose();

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [focusedField, setFocusedField] = useState<'to' | 'cc' | 'bcc' | 'subject' | 'body'>('to');

  // Load draft or reply/forward data on mount
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    } else if (replyTo) {
      // Load email being replied to
      fetchReplyData(replyTo);
    } else if (forward) {
      // Load email being forwarded
      fetchForwardData(forward);
    }
  }, []);

  const fetchReplyData = async (emailId: string) => {
    // Fetch email data and pre-fill compose
  };

  const fetchForwardData = async (emailId: string) => {
    // Fetch email data and pre-fill compose
  };

  const handleSend = async () => {
    if (!to.trim()) {
      Alert.alert('Error', 'Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please add a subject');
      return;
    }

    try {
      await send({
        to: to.split(',').map(e => e.trim()),
        cc: showCc ? cc.split(',').map(e => e.trim()) : [],
        bcc: showBcc ? bcc.split(',').map(e => e.trim()) : [],
        subject,
        body,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft({
        to: to.split(',').map(e => e.trim()),
        cc: showCc ? cc.split(',').map(e => e.trim()) : [],
        bcc: showBcc ? bcc.split(',').map(e => e.trim()) : [],
        subject,
        body,
      });
      Alert.alert('Saved', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const handleClose = () => {
    if (to.trim() || subject.trim() || body.trim()) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <View style={[
      styles.container,
      theme === 'dark' ? styles.containerDark : styles.containerLight,
    ]}>
      <View style={[
        styles.header,
        theme === 'dark' ? styles.headerDark : styles.headerLight,
      ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={24} color={theme === 'dark' ? '#FFFFFF' : '#1E3A8A'} />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          theme === 'dark' ? styles.headerTitleDark : styles.headerTitleLight,
        ]}>
          {draftId ? 'Edit Draft' : 'New Email'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveDraft} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Draft</Text>
          </TouchableOpacity>
          <Button
            title="Send"
            onPress={handleSend}
            loading={isSending}
            variant="primary"
            icon="send"
            size="sm"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* From */}
        <View style={styles.fieldRow}>
          <Text style={[
            styles.fieldLabel,
            theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
          ]}>
            From
          </Text>
          <View style={styles.fromContainer}>
            <Avatar
              name={user?.name || 'You'}
              email={user?.email || ''}
              size={32}
              theme={theme}
            />
            <Text style={[
              styles.fromEmail,
              theme === 'dark' ? styles.fromEmailDark : styles.fromEmailLight,
            ]}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* To */}
        <View style={styles.fieldRow}>
          <Text style={[
            styles.fieldLabel,
            theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
          ]}>
            To
          </Text>
          <Input
            label=""
            value={to}
            onChangeText={setTo}
            placeholder="Recipient email"
            placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => setFocusedField('cc')}
            style={styles.recipientInput}
            inputStyle={styles.recipientInputText}
          />
        </View>

        {/* CC */}
        {showCc && (
          <View style={styles.fieldRow}>
            <Text style={[
              styles.fieldLabel,
              theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
            ]}>
              CC
            </Text>
            <Input
              label=""
              value={cc}
              onChangeText={setCc}
              placeholder="CC recipients"
              placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => setFocusedField('bcc')}
              style={styles.recipientInput}
              inputStyle={styles.recipientInputText}
            />
          </View>
        )}

        {/* BCC */}
        {showBcc && (
          <View style={styles.fieldRow}>
            <Text style={[
              styles.fieldLabel,
              theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
            ]}>
              BCC
            </Text>
            <Input
              label=""
              value={bcc}
              onChangeText={setBcc}
              placeholder="BCC recipients"
              placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => setFocusedField('subject')}
              style={styles.recipientInput}
              inputStyle={styles.recipientInputText}
            />
          </View>
        )}

        {/* CC/BCC toggles */}
        <View style={styles.ccBccToggles}>
          {!showCc && (
            <TouchableOpacity onPress={() => setShowCc(true)} style={styles.toggleButton}>
              <ChevronDownIcon size={18} color="#64748B" />
              <Text style={styles.toggleText}>Add CC</Text>
            </TouchableOpacity>
          )}
          {showCc && !showBcc && (
            <TouchableOpacity onPress={() => setShowBcc(true)} style={styles.toggleButton}>
              <ChevronDownIcon size={18} color="#64748B" />
              <Text style={styles.toggleText}>Add BCC</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Subject */}
        <View style={styles.fieldRow}>
          <Text style={[
            styles.fieldLabel,
            theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
          ]}>
            Subject
          </Text>
          <Input
            label=""
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => setFocusedField('body')}
            style={styles.subjectInput}
            inputStyle={styles.subjectInputText}
          />
        </View>

        {/* Body */}
        <View style={styles.fieldRow}>
          <Text style={[
            styles.fieldLabel,
            theme === 'dark' ? styles.fieldLabelDark : styles.fieldLabelLight,
          ]}>
            Message
          </Text>
          <Input
            label=""
            value={body}
            onChangeText={setBody}
            placeholder="Type your message here..."
            placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
            autoCapitalize="sentences"
            multiline
            numberOfLines={15}
            style={styles.bodyInput}
            inputStyle={styles.bodyInputText}
          />
        </View>

        {/* Send Button */}
        <View style={styles.bottomActions}>
          <Button
            title="Send"
            onPress={handleSend}
            loading={isSending}
            variant="primary"
            icon="send"
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ChevronDownIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
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
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerTitleLight: {
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  fieldRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    width: 60,
  },
  fieldLabelLight: {
    color: '#64748B',
  },
  fieldLabelDark: {
    color: '#94A3B8',
  },
  fromContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  fromEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  fromEmailDark: {
    color: '#F1F5F9',
  },
  fromEmailLight: {
    color: '#1E293B',
  },
  recipientInput: {
    flex: 1,
    minHeight: 48,
  },
  recipientInputText: {
    fontSize: 16,
  },
  subjectInput: {
    minHeight: 48,
  },
  subjectInputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bodyInput: {
    minHeight: 200,
  },
  bodyInputText: {
    fontSize: 15,
    lineHeight: 24,
    paddingTop: 12,
  },
  ccBccToggles: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  bottomActions: {
    padding: 16,
    paddingBottom: 32,
  },
  ccBccToggles: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  chevronDown: {
    color: '#64748B',
  },
  bottomActions: {
    padding: 16,
    paddingBottom: 32,
  },
};

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ChevronDownIcon, ArrowLeftIcon } from '@/components/ui/Icons';
import { useCompose } from '@/hooks/useCompose';