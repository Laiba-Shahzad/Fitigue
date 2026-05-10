import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={Colors.accent}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!isLoading}
      />
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor={Colors.accent}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword(prev => !prev)}
          disabled={isLoading}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={Colors.accent}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btn, isLoading && styles.btnDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.btnText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')} disabled={isLoading}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.bg,
    justifyContent: 'center', alignItems: 'center',
    padding: 28, gap: 14,
  },
  back: { position: 'absolute', top: 58, left: 24 },
  backText: { fontSize: 16, color: Colors.deep, fontWeight: '700' },
  title: {
    fontSize: 40, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', marginBottom: 16,
  },
  input: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: 12, padding: 14, fontSize: 16,
    borderWidth: 1.5, borderColor: Colors.card, color: Colors.deep,
  },
  passwordRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 10,
  },
  passwordToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    width: '100%', backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.deep, marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  link: {
    color: Colors.deep, fontSize: 14,
    textDecorationLine: 'underline', marginTop: 6,
  },
});