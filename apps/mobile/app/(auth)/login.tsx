'use client';

import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setError('');
      await login(email, password);
      router.replace('/(app)/inbox');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setError('');
      const url = await initiateSocialLogin(provider);
      // Handle social login redirect
    } catch (err: any) {
      setError(err.message || `${provider} login failed`);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <Logo size="large" />
        <Text style={{
          marginTop: 16,
          fontSize: 28,
          fontWeight: '700',
          color: theme === 'dark' ? '#FFFFFF' : '#1E3A8A',
        }}>
          Welcome back
        </Text>
        <Text style={{
          marginTop: 8,
          fontSize: 16,
          color: theme === 'dark' ? '#94A3B8' : '#64748B',
        }}>
          Sign in to your VINBOX account
        </Text>
      </View>

      {error && (
        <View style={{
          backgroundColor: '#FEF2F2',
          borderWidth: 1,
          borderColor: '#FECACA',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}>
          <Text style={{ color: '#DC2626', fontSize: 14 }}>{error}</Text>
        </View>
      )}

      <View style={{ width: '100%', gap: 16 }}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={{ alignSelf: 'flex-end' }}
        >
          <Text style={{
            color: '#3B82F6',
            fontSize: 14,
            fontWeight: '500',
          }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          variant="primary"
          fullWidth
        />

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginVertical: 8,
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0' }} />
          <Text style={{ color: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 14 }}>
            or continue with
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0' }} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            title="Google"
            onPress={() => handleSocialLogin('google')}
            variant="outline"
            icon="google"
            flex={1}
          />
          <Button
            title="Microsoft"
            onPress={() => handleSocialLogin('microsoft')}
            variant="outline"
            icon="microsoft"
            flex={1}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        style={{ marginTop: 24, alignItems: 'center' }}
      >
        <Text style={{
          color: theme === 'dark' ? '#94A3B8' : '#64748B',
          fontSize: 14,
        }}>
          Don't have an account?{' '}
          <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}