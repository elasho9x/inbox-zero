'use client';

import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AvatarProps {
  name: string;
  email: string;
  size?: number;
  theme?: 'light' | 'dark';
  source?: { uri: string };
}

export function Avatar({ name, email, size = 40, theme, source }: AvatarProps) {
  const currentTheme = useTheme();
  const isDark = theme === 'dark' || (theme === undefined && currentTheme === 'dark');
  const initials = getInitials(name);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const backgroundColor = colors[colorIndex];

  if (source?.uri) {
    return (
      <Image
        source={source}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor },
      ]}
    >
      <Text style={[
        styles.text,
        { fontSize: size * 0.4, color: '#FFFFFF' },
      ]}>
        {initials}
      </Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '600',
  },
});