import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <LinearGradient colors={theme.colors.bgGradient} style={styles.screen}>
      <View style={[styles.screenInner, style]} {...rest}>
        {children}
      </View>
    </LinearGradient>
  );
}

export function Title({ style, ...rest }: TextProps) {
  return <Text style={[styles.title, style]} {...rest} />;
}
export function Subtitle({ style, ...rest }: TextProps) {
  return <Text style={[styles.subtitle, style]} {...rest} />;
}
export function Body({ style, ...rest }: TextProps) {
  return <Text style={[styles.body, style]} {...rest} />;
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  color?: string;
}
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  color,
}: ButtonProps) {
  const bg =
    color ??
    {
      primary: theme.colors.primary,
      ghost: 'transparent',
      danger: theme.colors.danger,
      success: theme.colors.success,
      warning: theme.colors.warning,
    }[variant];
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        {
          backgroundColor: isGhost ? 'transparent' : bg,
          borderColor: isGhost ? theme.colors.border : 'transparent',
          borderWidth: isGhost ? 1 : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} />
      ) : (
        <Text
          style={[
            styles.btnText,
            small && { fontSize: theme.font.small },
            isGhost && { color: theme.colors.text },
            variant === 'warning' && { color: '#3A2D00' },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  color = theme.colors.primary,
  filled,
}: {
  label: string;
  color?: string;
  filled?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: filled ? color : 'transparent',
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: filled ? theme.colors.white : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenInner: { flex: 1, paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(7) },
  title: { color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.body, marginTop: theme.spacing(0.5) },
  body: { color: theme.colors.text, fontSize: theme.font.body },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  btn: {
    height: 56,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(2.5),
  },
  btnSmall: { height: 42, borderRadius: theme.radius.sm },
  btnText: { color: theme.colors.white, fontSize: theme.font.h3, fontWeight: '700' },
  pill: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: theme.font.small, fontWeight: '700' },
});
