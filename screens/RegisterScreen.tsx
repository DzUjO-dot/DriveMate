import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ekran rejestracji użytkownika
export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  // Główna funkcja rejestracji
  const handleRegister = async () => {
    // Sprawdza czy wszystkie pola są wypełnione
    if (!email || !name || !password || !repeatPassword) {
      Alert.alert('Błąd', 'Wszystkie pola są wymagane!');
      return;
    }
    // Sprawdza poprawność emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Błąd', 'Nieprawidłowy format adresu email!');
      return;
    }
    // Sprawdza długość hasła
    if (password.length < 6) {
      Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków!');
      return;
    }
    // Sprawdza czy hasła są takie same
    if (password !== repeatPassword) {
      Alert.alert('Błąd', 'Hasła muszą być takie same!');
      return;
    }

    // Sprawdza czy użytkownik z tym emailem już istnieje
    const usersJson = await AsyncStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    if (users.find((u: any) => u.email === email)) {
      Alert.alert('Błąd', 'Użytkownik z tym emailem już istnieje!');
      return;
    }

    // Zapisuje nowego użytkownika w pamięci
    const userObj = { email, name, password };
    users.push(userObj);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    await AsyncStorage.setItem('currentUser', JSON.stringify({ email, name }));

    // Przechodzi od razu na stronę główną
    navigation.replace('Home');
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.logo}>DriveMate</Text>
        <Text style={styles.header}>Zarejestruj się</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Nazwa (jak mam się do Ciebie zwracać?)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Hasło"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Powtórz hasło"
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          secureTextEntry
        />
        {/* Przycisk rejestracji */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Zarejestruj się</Text>
        </TouchableOpacity>
        {/* Link do logowania */}
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={{ color: '#3478f6', marginTop: 22 }}>Masz już konto? Zaloguj się</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fe',
    padding: 18,
  },
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
});