import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useUser } from '../context/UserContext.tsx';

type Props = {
  navigation: any;
};

// Ekran logowania użytkownika
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { login } = useUser();

  // Sprawdza czy dane wpisane przez użytkownika są poprawne
  const validate = () => {
    if (!email || !password) {
      setError('Podaj email i hasło');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Nieprawidłowy adres email');
      return false;
    }
    if (password.length < 6) {
      setError('Hasło musi mieć min. 6 znaków');
      return false;
    }
    setError(null);
    return true;
  };

  // Próbuje zalogować użytkownika
  const handleLogin = async () => {
    if (validate()) {
      try {
        // Pobiera listę użytkowników z pamięci
        const usersJson = await AsyncStorage.getItem('users');
        const users = usersJson ? JSON.parse(usersJson) : [];
        // Sprawdza czy użytkownik istnieje
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (user) {
          // Zapisuje aktualnego użytkownika w pamięci
          await AsyncStorage.setItem(
            'currentUser',
            JSON.stringify({ email: user.email, name: user.name }),
          );
          login({ email: user.email, name: user.name });
          // Przechodzi do strony głównej
          navigation.replace('Home');
        } else {
          setError('Nieprawidłowy email lub hasło');
        }
      } catch (e) {
        setError('Wystąpił błąd logowania.');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f7fe' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.logo}>DriveMate</Text>
        <Text style={styles.header}>Logowanie</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Hasło"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Przycisk logowania */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Zaloguj się</Text>
        </TouchableOpacity>

        {/* Przejście do rejestracji */}
        <TouchableOpacity onPress={() => navigation.replace('Register')}>
          <Text style={{ color: '#3478f6', marginTop: 22 }}>Nie masz konta? Zarejestruj się</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  logo: { fontSize: 34, fontWeight: 'bold', color: '#3478f6', marginBottom: 10 },
  header: { fontSize: 22, color: '#222', fontWeight: '600', marginBottom: 20 },
  input: {
    width: '100%',
    maxWidth: 380,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 13,
    fontSize: 16,
    elevation: 1,
  },
  button: {
    backgroundColor: '#3478f6',
    borderRadius: 16,
    padding: 15,
    minWidth: 200,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 8, marginBottom: -8 },
});

export default LoginScreen;