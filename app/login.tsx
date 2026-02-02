// Écran de connexion/inscription
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
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

  const { login, register, isAuthenticated } = useAuth();
  const { isDemo, isInitialized } = useDataMode();
  const router = useRouter();

  // Redirection en mode démo seulement si on est déjà authentifié
  // Sinon, on laisse l'utilisateur se connecter même en mode démo
  useEffect(() => {
    if (isInitialized && isDemo && isAuthenticated) {
      // Si on est en mode démo ET authentifié, rediriger vers les tabs
      router.replace('/(tabs)');
    }
  }, [isInitialized, isDemo, isAuthenticated, router]);

  // Attendre que le mode soit initialisé
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Ne plus bloquer l'accès à la page de login en mode démo
  // L'utilisateur doit pouvoir se connecter même en mode démo

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!isLogin && !secretCode) {
      Alert.alert('Erreur', 'Le code secret est requis pour l\'inscription');
      return;
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
      console.error('Registration/Login error:', error);
      const errorMessage = error?.message || error?.error || 'Une erreur est survenue';
      Alert.alert('Erreur', errorMessage);
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
            <Text style={styles.title}>Clé API Générée</Text>
            <Text style={styles.subtitle}>
              Veuillez copier votre clé API ci-dessous. Elle est nécessaire pour connecter vos modules et ne sera plus affichée.
            </Text>
          </View>

          <View style={styles.apiKeyContainer}>
            <Text style={styles.apiKeyLabel}>Clé API :</Text>
            <Pressable
              style={styles.apiKeyBox}
              onPress={() => {
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
          <Image
            source={require('../assets/logo_preventis_lg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Code secret</Text>
              <TextInput
                style={styles.input}
                placeholder="Code requis pour l'inscription (POC)"
                placeholderTextColor={colors.textMuted}
                value={secretCode}
                onChangeText={setSecretCode}
                secureTextEntry
              />
              <Text style={styles.hint}>Demandez le code à l'administrateur.</Text>
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
              <Text style={styles.buttonText}>{isLogin ? 'Se connecter' : 'S\'inscrire'}</Text>
            )}
          </Pressable>

          <Pressable style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
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
    color: colors.textPrimary,
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
