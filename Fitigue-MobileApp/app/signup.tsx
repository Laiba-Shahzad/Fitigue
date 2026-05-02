import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors } from '../constants/Colors';

export default function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '',
  });
  const update = (key: keyof typeof form, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const fields: { key: keyof typeof form; label: string; secure?: boolean }[] = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'E-mail' },
    { key: 'password', label: 'Password', secure: true },
    { key: 'confirm', label: 'Confirm Password', secure: true },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sign Up</Text>

      {fields.map(f => (
        <TextInput
          key={f.key}
          style={styles.input}
          placeholder={f.label}
          placeholderTextColor={Colors.accent}
          secureTextEntry={f.secure}
          autoCapitalize="none"
          value={form[f.key]}
          onChangeText={v => update(f.key, v)}
        />
      ))}

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: Colors.bg,
    justifyContent: 'center', alignItems: 'center',
    padding: 28, gap: 14, paddingTop: 80,
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