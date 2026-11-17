'use client';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ItemProps {
  children: React.ReactNode;
  style?: any;
}

export function Item({ children, style }: ItemProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : styles.containerLight,
      style,
    ]}>
      {children}
    </View>
  );
}

interface ItemContentProps {
  children: React.ReactNode;
  style?: any;
}

export function ItemContent({ children, style }: ItemContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

interface ItemTitleProps {
  children: React.ReactNode;
  style?: any;
}

export function ItemTitle({ children, style }: ItemTitleProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Text style={[
      styles.title,
      isDark ? styles.titleDark : styles.titleLight,
      style,
    ]}>
      {children}
    </Text>
  );
}

interface ItemDescriptionProps {
  children: React.ReactNode;
  style?: any;
}

export function ItemDescription({ children, style }: ItemDescriptionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Text style={[
      styles.description,
      isDark ? styles.descriptionDark : styles.descriptionLight,
      style,
    ]}>
      {children}
    </Text>
  );
}

interface ItemActionsProps {
  children: React.ReactNode;
  style?: any;
}

export function ItemActions({ children, style }: ItemActionsProps) {
  return (
    <View style={[styles.actions, style]}>
      {children}
    </View>
  );
}

interface ItemSeparatorProps {
  style?: any;
}

export function ItemSeparator({ style }: ItemSeparatorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[
      styles.separator,
      isDark ? styles.separatorDark : styles.separatorLight,
      style,
    ]} />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleLight: {
    color: '#1E293B',
  },
  titleDark: {
    color: '#F1F5F9',
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
  descriptionLight: {
    color: '#64748B',
  },
  descriptionDark: {
    color: '#94A3B8',
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
  separatorLight: {
    backgroundColor: '#F1F5F9',
  },
  separatorDark: {
    backgroundColor: '#334155',
  },
});