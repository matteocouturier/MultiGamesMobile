import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, toggleTheme } from '../theme';

/** Ambient coloured glow orbs that float behind the content. */
function Ambiance() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.orb, { backgroundColor: theme.colors.glow1, top: -140, left: -110 }]} />
      <View style={[styles.orb, { backgroundColor: theme.colors.glow2, top: 180, right: -150 }]} />
      <View style={[styles.orb, { backgroundColor: theme.colors.glow3, bottom: -160, left: -60, opacity: 0.16 }]} />
    </View>
  );
}

export function Screen({ children, style, ...rest }: ViewProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 60 }),
    ]).start();
  }, [fade, rise, scale]);

  return (
    <LinearGradient colors={theme.colors.bgGradient} style={styles.screen}>
      <Ambiance />
      <Animated.View
        style={[styles.screenInner, { opacity: fade, transform: [{ translateY: rise }, { scale }] }, style]}
        {...rest}
      >
        {children}
      </Animated.View>
    </LinearGradient>
  );
}

/** Small round sun/moon button that switches between light and dark mode. */
export function ThemeToggle() {
  return (
    <Pressable
      onPress={toggleTheme}
      style={({ pressed }) => [styles.toggle, { opacity: pressed ? 0.7 : 1 }]}
      hitSlop={8}
    >
      <Text style={styles.toggleIcon}>{theme.mode === 'dark' ? '☀️' : '🌙'}</Text>
    </Pressable>
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

// Glassmorphism: frosted blur behind translucent surfaces (web). Cast to any
// because backdropFilter isn't in RN's style types but works on react-native-web.
export const glass: any = { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, glass, style]} {...rest}>
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
  style?: StyleProp<ViewStyle>;
}
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  color,
  style,
}: ButtonProps) {
  const isGhost = variant === 'ghost';
  const usesGradient = variant === 'primary' && !color;
  const solid =
    color ??
    {
      primary: theme.colors.primary,
      ghost: 'transparent',
      danger: theme.colors.danger,
      success: theme.colors.success,
      warning: theme.colors.warning,
    }[variant];

  const textNode = loading ? (
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
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        usesGradient && styles.btnGlow,
        {
          backgroundColor: usesGradient ? 'transparent' : isGhost ? 'rgba(255,255,255,0.04)' : solid,
          borderColor: isGhost ? theme.colors.borderStrong : 'transparent',
          borderWidth: isGhost ? 1 : 0,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.975 : 1 }],
        },
        style,
      ]}
    >
      {usesGradient ? (
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btnGradient, small && styles.btnSmall]}
        >
          {textNode}
        </LinearGradient>
      ) : (
        textNode
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
          backgroundColor: filled ? color : 'rgba(255,255,255,0.04)',
          borderColor: filled ? color : color + '66',
        },
      ]}
    >
      <Text style={[styles.pillText, { color: filled ? theme.colors.white : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  screenInner: { flex: 1, paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(7) },
  orb: { position: 'absolute', width: 320, height: 320, borderRadius: 320, opacity: 0.22 },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.h1,
    fontFamily: theme.fonts.display,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.font.body, fontFamily: theme.fonts.body, marginTop: theme.spacing(0.5) },
  body: { color: theme.colors.text, fontSize: theme.font.body, fontFamily: theme.fonts.body },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopColor: 'rgba(255,255,255,0.20)',
    ...theme.shadow.card,
  },
  btn: {
    height: 58,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing(2.5),
    overflow: 'hidden',
  },
  btnSmall: { height: 44, borderRadius: theme.radius.sm, paddingHorizontal: theme.spacing(2) },
  btnGlow: theme.shadow.glow,
  btnGradient: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  btnText: { color: theme.colors.white, fontSize: theme.font.h3, fontFamily: theme.fonts.display, fontWeight: '700', letterSpacing: 0.3 },
  pill: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: theme.font.small, fontFamily: theme.fonts.body, fontWeight: '800', letterSpacing: 0.3 },
  toggle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleIcon: { fontSize: 20 },
});
