import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext.tsx';

const fuelTypes = ['GAZ + Benzyna', 'Benzyna', 'Diesel'];
const docLabels = [
  { key: 'ocPhoto', label: 'Polisa OC' },
  { key: 'regPhoto', label: 'Dowód rejestracyjny' },
];

// Ekran do dodawania nowego pojazdu
export default function AddVehicleScreen({ navigation }) {
  const { user } = useUser();
  const userEmail = user?.email || '';

  // Stan dla pól formularza
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [tankCapacity, setTankCapacity] = useState('');
  const [insurance, setInsurance] = useState(null);
  const [fuelType, setFuelType] = useState(fuelTypes[0]);
  const [odometer, setOdometer] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zdjęcia dokumentów
  const [docPhotos, setDocPhotos] = useState({
    ocPhoto: null,
    regPhoto: null,
  });

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Aktualizuje szerokość ekranu gdy zmienisz orientację
  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription?.remove();
    };
  }, []);

  // Otwiera aparat do zrobienia zdjęcia dokumentu
  const pickImage = async (key) => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Aby zrobić zdjęcie, zezwól aplikacji na użycie aparatu i dostępu do zdjęć.',
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      // Jeśli użytkownik zrobił zdjęcie, zapisuje link do zdjęcia
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocPhotos((prev) => ({
          ...prev,
          [key]: result.assets[0].uri,
        }));
      }
    } catch (e) {
      Alert.alert('Błąd aparatu', 'Nie udało się wykonać zdjęcia.');
    }
  };

  // Usuwa wybrane zdjęcie
  const removePhoto = (key) => {
    setDocPhotos((prev) => ({ ...prev, [key]: null }));
  };

  // Sprawdza czy wszystkie pola są dobrze wypełnione
  const validate = () => {
    if (!name || !brand || !plate || !year || !tankCapacity || !insurance || odometer === '') {
      setError('Uzupełnij wszystkie pola');
      return false;
    }
    if (plate.length < 4) {
      setError('Podaj poprawną rejestrację');
      return false;
    }
    if (!/^\d{4}$/.test(year) || parseInt(year) < 1980 || parseInt(year) > new Date().getFullYear()) {
      setError('Podaj poprawny rocznik (1980 - obecny rok)');
      return false;
    }
    if (isNaN(Number(tankCapacity)) || Number(tankCapacity) <= 10) {
      setError('Podaj poprawną pojemność baku (>10L)');
      return false;
    }
    if (isNaN(Number(odometer)) || Number(odometer) < 0) {
      setError('Podaj poprawny przebieg');
      return false;
    }
    setError(null);
    return true;
  };

  // Zwraca datę w formacie YYYY-MM-DD
  const formatDate = (date) => (date ? date.toISOString().split('T')[0] : '');

  // Dodaje pojazd do pamięci (AsyncStorage)
  const handleAdd = async () => {
    if (!validate()) return;
    if (!userEmail) {
      Alert.alert('Błąd', 'Nie znaleziono zalogowanego użytkownika');
      return;
    }

    try {
      const vehiclesJson = await AsyncStorage.getItem(`vehicles_${userEmail}`);
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      const newVehicle = {
        id: Date.now(),
        name,
        brand,
        plate,
        year,
        tankCapacity,
        insurance: formatDate(insurance),
        fuelType,
        startKilometers: Number(odometer),
        ...docPhotos,
      };
      await AsyncStorage.setItem(
        `vehicles_${userEmail}`,
        JSON.stringify([...vehicles, newVehicle])
      );
      Alert.alert('Sukces', 'Pojazd został dodany!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError('Błąd podczas zapisu. Spróbuj ponownie.');
    }
  };

  // Ustawia dynamicznie marginesy w zależności od szerokości ekranu
  const dynamicContainerStyle = {
    ...styles.container,
    marginHorizontal: screenWidth < 500 ? 16 : screenWidth < 800 ? 44 : 90,
    marginVertical: 20,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f6f6fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={dynamicContainerStyle}>
          <Text style={styles.title}>Dodaj pojazd</Text>
          {/* Pola tekstowe do wypełnienia */}
          <TextInput
            style={styles.input}
            placeholder="Nazwa pojazdu"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Marka"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            style={styles.input}
            placeholder="Nr rejestracyjny"
            value={plate}
            autoCapitalize="characters"
            onChangeText={setPlate}
          />
          <TextInput
            style={styles.input}
            placeholder="Rocznik (np. 2017)"
            value={year}
            keyboardType="numeric"
            onChangeText={setYear}
            maxLength={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Pojemność baku (L)"
            value={tankCapacity}
            keyboardType="numeric"
            onChangeText={setTankCapacity}
          />
          <TextInput
            style={styles.input}
            placeholder="Przebieg (km)"
            value={odometer}
            keyboardType="numeric"
            onChangeText={setOdometer}
          />
          {/* Data końca ubezpieczenia */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: insurance ? '#23263b' : '#888',
                textAlign: 'center',
              }}
            >
              {insurance
                ? `Ubezpieczenie do: ${formatDate(insurance)}`
                : 'Do kiedy ubezpieczenie? (kliknij aby wybrać)'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={insurance ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                if (selectedDate) setInsurance(selectedDate);
              }}
            />
          )}
          {/* Wybór rodzaju paliwa */}
          <View style={styles.fuelTypeRow}>
            {fuelTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.fuelTypeBtn, fuelType === type && styles.fuelTypeBtnActive]}
                onPress={() => setFuelType(type)}
                activeOpacity={0.8}
              >
                <View style={styles.centerFuelType}>
                  <Text
                    style={[
                      styles.fuelTypeBtnText,
                      fuelType === type && styles.fuelTypeBtnTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {/* Sekcja dokumentów - zdjęcia */}
          <View style={styles.docsSection}>
            <Text style={styles.docsTitle}>Dokumenty pojazdu</Text>
            {docLabels.map((doc) => (
              <View key={doc.key} style={styles.docRow}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <View style={styles.docBtnRow}>
                  <TouchableOpacity style={styles.docBtn} onPress={() => pickImage(doc.key)}>
                    <Text style={styles.docBtnText}>
                      {docPhotos[doc.key] ? 'Zmień zdjęcie' : 'Zrób zdjęcie'}
                    </Text>
                  </TouchableOpacity>
                  {docPhotos[doc.key] && (
                    <TouchableOpacity
                      onPress={() => removePhoto(doc.key)}
                      style={styles.docRemoveBtn}
                    >
                      <Text style={{ color: '#d32f2f' }}>Usuń</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {docPhotos[doc.key] && (
                  <Image source={{ uri: docPhotos[doc.key] }} style={styles.docImage} />
                )}
              </View>
            ))}
          </View>
          {/* Błędy, przyciski dodaj/anuluj */}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Dodaj pojazd</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Style ekranu
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#3478f6',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 9,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f8f8fa',
    fontSize: 16,
  },
  fuelTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  fuelTypeBtn: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    minHeight: 46,
    marginHorizontal: 2,
  },
  centerFuelType: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fuelTypeBtnActive: {
    backgroundColor: '#3478f6',
    borderColor: '#3478f6',
  },
  fuelTypeBtnText: {
    color: '#23263b',
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
  },
  fuelTypeBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  docsSection: { marginTop: 16, marginBottom: 10 },
  docsTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#23263b' },
  docRow: { marginBottom: 14 },
  docLabel: { fontWeight: '600', color: '#3478f6', marginBottom: 6 },
  docBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docBtn: {
    backgroundColor: '#eef4fd',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginRight: 6,
  },
  docBtnText: { color: '#3478f6', fontWeight: 'bold' },
  docRemoveBtn: {
    marginLeft: 3,
    backgroundColor: '#fde6e8',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  docImage: {
    width: 120,
    height: 80,
    borderRadius: 10,
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  addBtn: {
    backgroundColor: '#3478f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginVertical: 6,
    fontWeight: 'bold',
  },
});