'use client';

import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/Item';
import { LogoutIcon, MoonIcon, SunIcon, MailIcon, ShieldIcon, BellIcon, InfoIcon, LogoutIcon as LogoutIconAlt } from '@/components/ui/Icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  return (
    <View style={theme === 'dark' ? styles.containerDark : styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            Account
          </Text>
          <Item>
            <ItemContent>
              <Avatar
                name={user?.name || 'User'}
                email={user?.email || ''}
                size={56}
                theme={theme}
              />
              <View style={styles.userInfo}>
                <Text style={[
                  styles.userName,
                  theme === 'dark' ? styles.userNameDark : styles.userNameLight,
                ]}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[
                  styles.userEmail,
                  theme === 'dark' ? styles.userEmailDark : styles.userEmailLight,
                ]}>
                  {user?.email || 'user@example.com'}
                </Text>
              </View>
            </ItemContent>
            <ItemActions>
              <Button
                title="Edit Profile"
                onPress={() => router.push('/app/settings/profile')}
                variant="outline"
                size="sm"
              />
            </ItemActions>
          </Item>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            Preferences
          </Text>
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <MoonIcon size={24} color={theme === 'dark' ? '#FBBF24' : '#F59E0B'} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Dark Mode
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Use dark theme
                  </Text>
                </View>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={handleThemeToggle}
                thumbColor={theme === 'dark' ? '#FBBF24' : '#F59E0B'}
                trackColor={{ false: '#E2E8F0', true: '#FBBF24' }}
              />
            </Item>
          </Item>
          
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <BellIcon size={24} color="#3B82F6" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Push Notifications
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Receive email notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                thumbColor="#3B82F6"
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
              />
            </Item>
          </Item>

          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <MailIcon size={24} color="#10B981" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Auto Sync
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Automatically sync emails
                  </Text>
                </View>
              </View>
              <Switch
                value={syncEnabled}
                onValueChange={setSyncEnabled}
                thumbColor="#10B981"
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              />
            </Item>
          </Item>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            Security
          </Text>
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <ShieldIcon size={24} color="#EF4444" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Change Password
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Update your password
                  </Text>
                </View>
              </View>
              <Button
                title="Change"
                onPress={() => router.push('/app/settings/change-password')}
                variant="outline"
                size="sm"
              />
            </Item>
          </Item>

          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <ShieldIcon size={24} color="#EF4444" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Two-Factor Authentication
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Add an extra layer of security
                  </Text>
                </View>
              </View>
              <Button
                title="Enable"
                onPress={() => router.push('/app/settings/2fa')}
                variant="outline"
                size="sm"
              />
            </Item>
          </Item>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            Connected Accounts
          </Text>
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <MailIcon size={24} color="#3B82F6" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Email Accounts
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Manage connected email accounts
                  </Text>
                </View>
              </View>
              <Button
                title="Manage"
                onPress={() => router.push('/app/settings/accounts')}
                variant="outline"
                size="sm"
              />
            </Item>
          </Item>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            About
          </Text>
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <InfoIcon size={24} color="#64748B" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Version
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    0.1.0
                  </Text>
                </View>
              </View>
            </ItemContent>
          </Item>

          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <InfoIcon size={24} color="#64748B" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                  ]}>
                    Privacy Policy
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Read our privacy policy
                  </Text>
                </View>
              </View>
              <Button
                title="Read"
                onPress={() => router.push('/app/settings/privacy')}
                variant="outline"
                size="sm"
              />
            </Item>
          </Item>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            theme === 'dark' ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}>
            Danger Zone
          </Text>
          <Item>
            <ItemContent>
              <View style={styles.settingRow}>
                <View style={styles.settingIconContainer}>
                  <LogoutIconAlt size={24} color="#EF4444" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[
                    styles.settingLabel,
                    theme === 'dark' ? styles.settingLabelDark : styles.settingLabelLight,
                    styles.settingLabelDanger,
                  ]}>
                    Sign Out
                  </Text>
                  <Text style={[
                    styles.settingDescription,
                    theme === 'dark' ? styles.settingDescriptionDark : styles.settingDescriptionLight,
                  ]}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
            </ItemContent>
            <ItemActions>
              <Button
                title="Sign Out"
                onPress={handleLogout}
                variant="destructive"
                size="sm"
              />
            </ItemActions>
          </Item>
        </View>
      </ScrollView>
    </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitleLight: {
    color: '#64748B',
  },
  sectionTitleDark: {
    color: '#94A3B8',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingLabelLight: {
    color: '#1E293B',
  },
  settingLabelDark: {
    color: '#F1F5F9',
  },
  settingLabelDanger: {
    color: '#EF4444',
  },
  settingDescription: {
    fontSize: 13,
  },
  settingDescriptionLight: {
    color: '#64748B',
  },
  settingDescriptionDark: {
    color: '#94A3B8',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userNameLight: {
    color: '#1E293B',
  },
  userNameDark: {
    color: '#F1F5F9',
  },
  userEmail: {
    fontSize: 14,
  },
  userEmailLight: {
    color: '#64748B',
  },
  userEmailDark: {
    color: '#94A3B8',
  },
});

import { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { MoonIcon, SunIcon, BellIcon, MailIcon, ShieldIcon, BellIcon as BellIconAlt, InfoIcon, LogoutIcon as LogoutIconAlt, MailIcon as MailIconAlt, MoonIcon as MoonIconAlt, SunIcon as SunIconAlt, ShieldIcon as ShieldIconAlt } from '@/components/ui/Icons';