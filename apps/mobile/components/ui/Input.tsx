'use client';

import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onIconPress?: () => void;
  style?: any;
  inputStyle?: any;
  labelStyle?: any;
  placeholderTextColor?: string;
  autoComplete?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  error,
  disabled = false,
  icon,
  iconPosition = 'left',
  onIconPress,
  style,
  inputStyle,
  labelStyle,
  placeholderTextColor,
  returnKeyType = 'done',
  onSubmitEditing,
  multiline = false,
  numberOfLines,
}: InputProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);

  const handleIconPress = () => {
    if (icon === 'eye' && onIconPress) {
      onIconPress();
    } else if (icon === 'eye') {
      setShowPassword(!showPassword);
    }
  };

  const effectiveSecure = secureTextEntry && !showPassword;
  const effectiveIcon = secureTextEntry ? (showPassword ? 'eye-off' : 'eye') : icon;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[
          styles.label,
          isDark ? styles.labelDark : styles.labelLight,
          labelStyle,
        ]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        isDark ? styles.inputContainerDark : styles.inputContainerLight,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        {effectiveIcon && iconPosition === 'left' && (
          <TouchableOpacity onPress={handleIconPress} style={styles.iconLeft}>
            <Icon name={effectiveIcon} size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || (isDark ? '#64748B' : '#94A3B8')}
          secureTextEntry={effectiveSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          disabled={disabled}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            isDark ? styles.inputDark : styles.inputLight,
            disabled && styles.inputDisabled,
            inputStyle,
          ]}
          onChangeText={onChangeText}
          value={value}
          underlineColorAndroid="transparent"
        />
        {effectiveIcon && iconPosition === 'right' && (
          <TouchableOpacity onPress={handleIconPress} style={styles.iconRight}>
            <Icon name={effectiveIcon} size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    'eye-off': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ),
    google: (
      <svg width={20} height={20} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    microsoft: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    mail: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    lock: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    person: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    'eye-off': (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ),
  };

  return icons[name] || null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  labelLight: {
    color: '#334155',
  },
  labelDark: {
    color: '#E2E8F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  inputContainerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  inputLight: {
    color: '#1E293B',
  },
  inputDark: {
    color: '#F1F5F9',
  },
  inputDisabled: {
    color: '#94A3B8',
  },
  iconLeft: {
    marginRight: 10,
    paddingVertical: 14,
  },
  iconRight: {
    marginLeft: 10,
    paddingVertical: 14,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EF4444',
  },
  disabled: {
    opacity: 0.5,
  },
});