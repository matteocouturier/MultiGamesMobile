import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Button, Screen, Subtitle, Title } from '../components/ui';
import { theme } from '../theme';
import { useStore } from '../state/store';

export function NameScreen() {
  const { setPlayerName, connected, savedName } = useStore();
  const [name, setName] = useState('');
  const valid = name.trim().length >= 2;

  // Pre-fill with the pseudo saved from a previous session.
  useEffect(() => {
    if (savedName) setName((cur) => (cur ? cur : savedName));
  }, [savedName]);

  return (
    <Screen style={styles.center}>
      <Title style={styles.logo}>🎲 MultiGames</Title>
      <Subtitle style={styles.tag}>Des mini-jeux à plusieurs, en temps réel</Subtitle>

      <View style={styles.form}>
        <Body style={styles.label}>Choisis ton pseudo</Body>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton nom..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          maxLength={20}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => valid && setPlayerName(name.trim())}
        />
        <Button label="Entrer" onPress={() => setPlayerName(name.trim())} disabled={!valid} />
        <Body style={styles.status}>
          {connected ? '● Connecté au serveur' : '○ Connexion au serveur...'}
        </Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', paddingBottom: theme.spacing(10) },
  logo: { fontSize: 40, textAlign: 'center' },
  tag: { textAlign: 'center', marginBottom: theme.spacing(5) },
  form: { gap: theme.spacing(1.5) },
  label: { color: theme.colors.textMuted, marginBottom: theme.spacing(0.5) },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: theme.font.h3,
    paddingHorizontal: theme.spacing(2),
    height: 56,
    marginBottom: theme.spacing(1),
  },
  status: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: theme.font.small,
    marginTop: theme.spacing(1),
  },
});
