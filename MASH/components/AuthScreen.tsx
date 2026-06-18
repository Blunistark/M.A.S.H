import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Theme } from '../theme';
import { api } from '../services/api';

interface AuthScreenProps {
  onAuthSuccess: (sessionData: { user: any; profile: any; session: any }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onAuthSuccess(data);
      } else {
        const data = await api.signUp(email, password, fullName, contactNumber);
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => onAuthSuccess(data) }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Auth Error', err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🏥</Text>
            <Text style={styles.logoText}>M.A.S.H</Text>
            <Text style={styles.logoTagline}>Mobile AI Security Healthcare</Text>
          </View>

          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to access your clinic companion' : 'Register to manage appointments and prescriptions'}
          </Text>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={Theme.colors.onSurfaceVariant + '80'}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={Theme.colors.onSurfaceVariant + '80'}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={Theme.colors.onSurfaceVariant + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Theme.colors.onSurfaceVariant + '80'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Register'}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.7}>
                <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = Theme.createStyleSheet(() => ({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.containerPadding,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.cardPadding * 1.5,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 42,
    marginBottom: 6,
  },
  logoText: {
    fontSize: 22,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
    letterSpacing: 0.5,
  },
  logoTagline: {
    fontSize: 11,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  title: {
    fontSize: Theme.typography.headlineMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: Theme.spacing.inputHeight,
    backgroundColor: Theme.colors.superLightGray,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    paddingHorizontal: 16,
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  button: {
    height: Theme.spacing.buttonHeight,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  toggleLink: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 13,
    color: Theme.colors.secondary,
  },
}));
