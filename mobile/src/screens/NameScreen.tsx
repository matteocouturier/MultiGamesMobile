import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Screen, ThemeToggle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';

export function NameScreen() {
  const { setPlayerName, connected, savedName, pendingJoin } = useStore();
  const [name, setName] = useState('');
  const valid = name.trim().length >= 2;

  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [float]);

  useEffect(() => {
    if (savedName) setName((cur) => (cur ? cur : savedName));
  }, [savedName]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <Screen style={styles.center}>
      <View style={styles.toggleWrap}>
        <ThemeToggle />
      </View>
      <Animated.View style={[styles.logoWrap, { transform: [{ translateY }] }]}>
        <View style={styles.logoGlow}>
          <Body style={styles.dice}>🎲</Body>
        </View>
      </Animated.View>

      <Title style={styles.logo}>MultiGames</Title>
      <Body style={styles.tag}>Des mini-jeux à plusieurs, en temps réel ✨</Body>

      {pendingJoin && (
        <View style={styles.invite}>
          <Body style={styles.inviteText}>🎮 Tu rejoins le salon</Body>
          <Body style={styles.inviteCode}>{pendingJoin}</Body>
        </View>
      )}

      <View style={styles.form}>
        <Body style={styles.label}>TON PSEUDO</Body>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Entre ton nom..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => valid && setPlayerName(name.trim())}
        />
        <Button
          label={pendingJoin ? 'Rejoindre la partie →' : "C'est parti →"}
          onPress={() => setPlayerName(name.trim())}
          disabled={!valid}
        />
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: connected ? theme.colors.success : theme.colors.warning }]} />
          <Body style={styles.status}>{connected ? 'Connecté au serveur' : 'Connexion...'}</Body>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', paddingBottom: theme.spacing(8) },
  toggleWrap: { position: 'absolute', top: theme.spacing(3), right: theme.spacing(1) },
  logoWrap: { alignItems: 'center', marginBottom: theme.spacing(2) },
  logoGlow: {
    width: 110,
    height: 110,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(139,92,246,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  dice: { fontSize: 60 },
  logo: { fontSize: 46, textAlign: 'center', letterSpacing: -1 },
  tag: { textAlign: 'center', color: theme.colors.textMuted, marginTop: theme.spacing(0.5), marginBottom: theme.spacing(5) },
  invite: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  inviteText: { color: theme.colors.textMuted, fontSize: theme.font.small },
  inviteCode: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    marginTop: theme.spacing(0.5),
    textShadowColor: 'rgba(139,92,246,0.6)',
    textShadowRadius: 14,
  },
  form: { gap: theme.spacing(1.25) },
  label: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 3, marginLeft: 4 },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.h3,
    paddingHorizontal: theme.spacing(2),
    height: 60,
    marginBottom: theme.spacing(0.5),
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: theme.spacing(1) },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { color: theme.colors.textMuted, fontSize: theme.font.small },
});
