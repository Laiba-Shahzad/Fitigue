import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function MainScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Gingham grid background */}
      <View style={styles.grid}>
        {Array.from({ length: 96 }).map((_, i) => (
          <View
            key={i}
            style={[styles.cell, { opacity: i % 2 === 0 ? 0.35 : 0.12 }]}
          />
        ))}
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.logo}>Fitigue</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.btnText}>Signup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '12.5%',
    height: 90,
    backgroundColor: Colors.card,
  },
  card: {
    width: '78%',
    backgroundColor: Colors.bg,
    borderRadius: 32,
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    gap: 18,
    elevation: 8,
    shadowColor: Colors.deep,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.deep,
    fontStyle: 'italic',
    marginBottom: 30,
    letterSpacing: -1,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.deep,
  },
  btnText: {
    color: Colors.bg,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
});