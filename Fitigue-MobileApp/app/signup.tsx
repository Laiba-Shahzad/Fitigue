import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../src/context/AuthContext';

const GENDER_OPTIONS = ['Male', 'Female'];

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    gender: '',
    age: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: keyof typeof form, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSignup = async () => {
    // Validate all fields
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirm ||
      !form.gender ||
      !form.age
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if(form.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    if(form.username.length >50) {
      Alert.alert('Error', 'Username must be at most 50 characters');
      return;
    }

    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if(form.password.length > 20) {
      Alert.alert('Error', 'Password must be at most 20 characters');
      return;
    }

    if(form.email.length > 100) {
      Alert.alert('Error', 'Email must be at most 100 characters');
      return;
    }

    if(form.email.length < 5) {
      Alert.alert('Error', 'Email must be at least 5 characters');
      return;
    }

    



    const age = parseInt(form.age, 10);
    if (isNaN(age) || age < 13 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age (13-120)');
      return;
    }

    setIsLoading(true);
    try {
      await register(
        form.username,
        form.email,
        form.password,
        form.gender,
        age
      );
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        'Signup Failed!!',
        error.message || 'An error occurred during registration'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectGender = (gender: string) => {
    update('gender', gender);
    setShowGenderModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sign Up</Text>

      {/* Existing fields */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={Colors.accent}
        autoCapitalize="none"
        value={form.username}
        onChangeText={v => update('username', v)}
        editable={!isLoading}
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor={Colors.accent}
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={v => update('email', v)}
        editable={!isLoading}
      />

      {/* Gender dropdown */}
      <TouchableOpacity
        style={[styles.input, styles.dropdown]}
        onPress={() => setShowGenderModal(true)}
        disabled={isLoading}
      >
        <Text
          style={{
            color: form.gender ? Colors.deep : Colors.accent,
            fontSize: 16,
          }}
        >
          {form.gender || 'Gender'}
        </Text>
      </TouchableOpacity>

      {/* Age input */}
      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor={Colors.accent}
        keyboardType="numeric"
        maxLength={3}
        value={form.age}
        onChangeText={v => update('age', v)}
        editable={!isLoading}
      />

      {/* Password fields */}
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Password"
          placeholderTextColor={Colors.accent}
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={v => update('password', v)}
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
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Confirm Password"
          placeholderTextColor={Colors.accent}
          secureTextEntry={!showPassword}
          value={form.confirm}
          onChangeText={v => update('confirm', v)}
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
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.btnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
        <Text style={styles.link}>Already have an account? Log In</Text>
      </TouchableOpacity>

      {/* Gender selection modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map(gender => (
              <TouchableOpacity
                key={gender}
                style={styles.optionItem}
                onPress={() => selectGender(gender)}
              >
                <Text style={styles.optionText}>{gender}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    dropdown: {
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.deep,
    marginBottom: 18,
  },
  optionItem: {
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  optionText: {
    fontSize: 16,
    color: Colors.deep,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 18,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
});
