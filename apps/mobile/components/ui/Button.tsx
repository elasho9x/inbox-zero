'use client';

import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const baseStyles = [styles.container, styles[size], fullWidth && styles.fullWidth];

  const variantStyles = variant === 'outline' 
    ? [styles.outline, isDark ? styles.outlineDark : styles.outlineLight]
    : variant === 'ghost'
    ? styles.ghost
    : variant === 'destructive'
    ? styles.destructive
    : [styles.primary, isDark ? styles.primaryDark : styles.primaryLight];

  const disabledStyles = disabled || loading ? styles.disabled : [];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...baseStyles, ...variantStyles, ...disabledStyles, style]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : '#3B82F6'}
          size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'small'}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color={getIconColor(variant, isDark)} style={styles.iconLeft} />}
          <Text style={[
            styles.text,
            styles[size + 'Text'],
            isDark ? styles.textDark : styles.textLight,
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textGhost,
            variant === 'destructive' && styles.textDestructive,
          ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color={getIconColor(variant, isDark)} style={styles.iconRight} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

function getIconColor(variant: string, isDark: boolean): string {
  if (variant === 'primary' || variant === 'destructive') return '#FFFFFF';
  if (variant === 'outline') return isDark ? '#3B82F6' : '#3B82F6';
  if (variant === 'ghost') return isDark ? '#94A3B8' : '#64748B';
  return '#3B82F6';
}

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  // Simple inline icons - in production, use a proper icon library
  const icons: Record<string, React.ReactNode> = {
    google: (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    microsoft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    draft: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    star: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    attachment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05a12.12 12.12 0 0 1-14 0"/>
        <path d="M15.55 9.55a12.12 12.12 0 0 1 0 14"/>
        <path d="M9.55 15.45a12.12 12.12 0 0 1-14 0"/>
        <path d="M13 3l4 4 2-2"/>
        <path d="M13 21l-4-4 2-2"/>
      </svg>
    ),
  };

  return icons[name] || null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primary: {
    backgroundColor: '#3B82F6',
  },
  primaryLight: {
    backgroundColor: '#3B82F6',
  },
  primaryDark: {
    backgroundColor: '#2563EB',
  },
  outline: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  outlineLight: {
    borderColor: '#3B82F6',
  },
  outlineDark: {
    borderColor: '#60A5FA',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#EF4444',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 17,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: '#3B82F6',
  },
  textGhost: {
    color: '#3B82F6',
  },
  textDestructive: {
    color: '#FFFFFF',
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
});