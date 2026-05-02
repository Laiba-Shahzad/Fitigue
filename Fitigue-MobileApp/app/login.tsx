import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={Colors.accent}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={styles.btnText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')}>
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
  btn: {
    width: '100%', backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.deep, marginTop: 8,
  },
  btnText: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  link: {
    color: Colors.deep, fontSize: 14,
    textDecorationLine: 'underline', marginTop: 6,
  },
});