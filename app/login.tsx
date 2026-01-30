// Écran de connexion/inscription
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useDataMode } from '../src/context/DataModeContext';
import { colors } from '../src/theme/colors';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const { login, register } = useAuth();
  const { isDemo } = useDataMode();
  const router = useRouter();

  // En mode démo, pas besoin d'authentification
  if (isDemo) {
    return null; // Ne pas afficher l'écran de login en mode démo
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin) {
      if (password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (!secretCode) {
        Alert.alert('Erreur', 'Le code secret est requis pour l\'inscription');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.replace('/(tabs)');
      } else {
        const result = await register(email, password, name || undefined, secretCode);
        setApiKey(result.apiKey);
        setShowApiKey(true);
        Alert.alert(
          'Compte créé !',
          'Votre clé API a été générée. Notez-la, elle ne sera plus affichée.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowApiKey(false);
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setName('');
                setSecretCode('');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (showApiKey && apiKey) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="key" size={64} color={colors.primary} />
            <Text style={styles.title}>Votre clé API</Text>
            <Text style={styles.subtitle}>
              Cette clé vous permettra de connecter vos devices à l'API
            </Text>
          </View>

          <View style={styles.apiKeyContainer}>
            <Text style={styles.apiKeyLabel}>Clé API :</Text>
            <Pressable
              style={styles.apiKeyBox}
              onPress={() => {
                // Copier dans le presse-papier (nécessite expo-clipboard)
                Alert.alert('Info', 'Copiez cette clé et conservez-la en lieu sûr');
              }}
            >
              <Text style={styles.apiKeyText} selectable>
                {apiKey}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
              setShowApiKey(false);
              setIsLogin(true);
            }}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
          <Text style={styles.title}>Preventis</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Code secret</Text>
              <TextInput
                style={styles.input}
                placeholder="Code d'accès POC"
                placeholderTextColor={colors.textMuted}
                value={secretCode}
                onChangeText={setSecretCode}
                autoCapitalize="characters"
                autoComplete="off"
              />
              <Text style={styles.hint}>
                Code requis pour l'inscription (POC)
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Se connecter' : 'Créer le compte'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setEmail('');
              setPassword('');
              setName('');
              setSecretCode('');
            }}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: colors.primary,
    fontSize: 14,
  },
  apiKeyContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  apiKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  apiKeyBox: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  apiKeyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
