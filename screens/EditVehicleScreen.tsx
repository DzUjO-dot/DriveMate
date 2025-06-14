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
  ScrollView,
  useWindowDimensions,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext.tsx';

// Lista dostępnych rodzajów paliwa
const fuelTypes = ['GAZ + Benzyna', 'Benzyna', 'Diesel'];

export default function EditVehicleScreen({ route, navigation }: any) {
  const { vehicle } = route.params;
  const { user } = useUser();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

   // Stany do przechowywania wartości pól formularza
  const [name, setName] = useState(vehicle.name);
  const [brand, setBrand] = useState(vehicle.brand);
  const [plate, setPlate] = useState(vehicle.plate);
  const [year, setYear] = useState(vehicle.year);
  const [tankCapacity, setTankCapacity] = useState(vehicle.tankCapacity);
  const [insurance, setInsurance] = useState<Date | null>(
    vehicle.insurance ? new Date(vehicle.insurance) : null
  );
  const [fuelType, setFuelType] = useState(vehicle.fuelType);
  const [startKilometers, setStartKilometers] = useState(
    vehicle.startKilometers !== undefined ? String(vehicle.startKilometers) : '0'
  );
  const [ocPhoto, setOcPhoto] = useState(vehicle.ocPhoto || null);
  const [regPhoto, setRegPhoto] = useState(vehicle.regPhoto || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minFuelKm, setMinFuelKm] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Po załadowaniu ekranu pobieramy minimalny przebieg z wpisów tankowań
  useEffect(() => {
    if (user?.email) {
      (async () => {
        const entriesJson = await AsyncStorage.getItem(`fuelEntries_${user.email}`);
        const entries = entriesJson ? JSON.parse(entriesJson) : [];
        const myEntries = entries.filter((e: any) => e.vehicleId === vehicle.id);
        if (myEntries.length) {
          const minKm = Math.min(...myEntries.map((e: any) => Number(e.kilometers)));
          setMinFuelKm(minKm);
        }
      })();
    }
  }, [user]);

  // Funkcja sprawdzająca czy dane w formularzu są poprawne
  const validate = () => {
    if (!name || !brand || !plate || !year || !tankCapacity || !insurance) {
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
    if (!/^\d+$/.test(startKilometers) || Number(startKilometers) < 0) {
      setError('Podaj poprawny przebieg początkowy (0 lub więcej)');
      return false;
    }
    if (minFuelKm !== null && Number(startKilometers) > minFuelKm) {
      setError(`Przebieg początkowy nie może być większy niż najniższy przebieg z tankowań (${minFuelKm} km)!`);
      return false;
    }
    setError(null);
    return true;
  };

   // Funkcja zamieniająca datę na prosty tekst
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Funkcja wywoływana po kliknięciu "Zapisz zmiany"
  const handleSave = async () => {
    if (!validate() || !user?.email) return;

    try {
      // Pobieramy listę pojazdów z pamięci
      const vehiclesJson = await AsyncStorage.getItem(`vehicles_${user.email}`);
      let vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      vehicles = vehicles.map((v: any) =>
        v.id === vehicle.id
          ? {
              ...v,
              name,
              brand,
              plate,
              year,
              tankCapacity,
              insurance: formatDate(insurance!),
              fuelType,
              startKilometers: Number(startKilometers),
              ocPhoto,
              regPhoto,
            }
          : v
      );
      // Zapisujemy nową listę pojazdów do pamięci
      await AsyncStorage.setItem(`vehicles_${user.email}`, JSON.stringify(vehicles));
      Alert.alert('Sukces', 'Zmiany zapisane!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError('Błąd podczas zapisu. Spróbuj ponownie.');
    }
  };

  // Funkcja usuwająca zdjęcie dokumentu
  const removePhoto = (key: 'ocPhoto' | 'regPhoto') => {
    if (key === 'ocPhoto') setOcPhoto(null);
    else if (key === 'regPhoto') setRegPhoto(null);
  };

  // Funkcja do robienia zdjęcia aparatem
  const pickImage = async (key: 'ocPhoto' | 'regPhoto') => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Sprawdzamy, czy użytkownik udzielił wymaganych uprawnień
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Aby zrobić zdjęcie, zezwól aplikacji na użycie aparatu i dostępu do zdjęć.'
      );
      return;
    }

    // Uruchamiamy aparat i pozwalamy użytkownikowi zrobić zdjęcie
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      // Sprawdzamy, czy użytkownik nie anulował robienia zdjęcia i czy zdjęcie zostało zrobione
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (key === 'ocPhoto') setOcPhoto(uri);
        else if (key === 'regPhoto') setRegPhoto(uri);
      }
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zrobić zdjęcia.');
    }
  };

  // Dostosowujemy wygląd formularza w zależności od orientacji ekranu
  const dynamicContainer = [
    styles.container,
    {
      width: isLandscape ? '60%' : '100%',
      alignSelf: 'center' as const,
      paddingHorizontal: isLandscape ? 32 : 22,
      paddingVertical: isLandscape ? 30 : 22,
      marginTop: isLandscape ? 16 : 20,
      marginBottom: isLandscape ? 16 : 20,
    },
  ];

  // Funkcja do wyświetlania pełnego zdjęcia w modalnym oknie
  const showFullImage = (uri: string) => {
    setModalImage(uri);
    setModalVisible(true);
  };

  // Tutaj rysujemy cały formularz na ekranie
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f6f6fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={dynamicContainer}>
          <Text style={styles.title}>Edytuj pojazd</Text>

          <TextInput style={styles.input} placeholder="Nazwa pojazdu" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Marka" value={brand} onChangeText={setBrand} />
          <TextInput style={styles.input} placeholder="Nr rejestracyjny" value={plate} autoCapitalize="characters" onChangeText={setPlate} />
          <TextInput style={styles.input} placeholder="Rocznik (np. 2017)" value={year} keyboardType="numeric" onChangeText={setYear} maxLength={4} />
          <TextInput style={styles.input} placeholder="Pojemność baku (L)" value={tankCapacity} keyboardType="numeric" onChangeText={setTankCapacity} />
          <TextInput style={styles.input} placeholder="Przebieg początkowy (km)" value={startKilometers} keyboardType="numeric" onChangeText={setStartKilometers} />

          {/* Wybieranie daty ubezpieczenia */}
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker((prev) => !prev)} activeOpacity={0.8}>
            <Text style={{ color: insurance ? '#23263b' : '#888', textAlign: 'center' }}>
              {insurance ? `Ubezpieczenie do: ${formatDate(insurance)}` : 'Do kiedy ubezpieczenie? (kliknij aby wybrać)'}
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
        
          <View style={styles.fuelTypeRow}>
            {fuelTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.fuelTypeBtn, fuelType === type && styles.fuelTypeBtnActive]}
                onPress={() => setFuelType(type)}
                activeOpacity={0.8}
              >
                <View style={styles.centerFuelType}>
                  <Text style={[styles.fuelTypeBtnText, fuelType === type && styles.fuelTypeBtnTextActive]}>
                    {type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: '#23263b' }}>
              Dokumenty pojazdu
            </Text>

            {ocPhoto && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.docLabel}>Polisa OC</Text>
                <TouchableOpacity onPress={() => showFullImage(ocPhoto)}>
                  <Image source={{ uri: ocPhoto }} style={styles.docImage} />
                </TouchableOpacity>
                <View style={styles.docBtnRow}>
                  <TouchableOpacity onPress={() => pickImage('ocPhoto')} style={styles.docBtn}>
                    <Text style={styles.docBtnText}>Zmień zdjęcie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePhoto('ocPhoto')} style={styles.docRemoveBtn}>
                    <Text style={{ color: '#d32f2f' }}>Usuń</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {regPhoto && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.docLabel}>Dowód rejestracyjny</Text>
                <TouchableOpacity onPress={() => showFullImage(regPhoto)}>
                  <Image source={{ uri: regPhoto }} style={styles.docImage} />
                </TouchableOpacity>
                <View style={styles.docBtnRow}>
                  <TouchableOpacity onPress={() => pickImage('regPhoto')} style={styles.docBtn}>
                    <Text style={styles.docBtnText}>Zmień zdjęcie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePhoto('regPhoto')} style={styles.docRemoveBtn}>
                    <Text style={{ color: '#d32f2f' }}>Usuń</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Zapisz zmiany</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Image source={{ uri: modalImage! }} style={styles.fullscreenImage} resizeMode="contain" />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
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
  saveBtn: {
    backgroundColor: '#3478f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
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
  docLabel: {
    fontWeight: '600',
    color: '#3478f6',
    marginBottom: 6,
  },
  docImage: {
    width: 140,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  docBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  docBtn: {
    backgroundColor: '#eef4fd',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  docBtnText: {
    color: '#3478f6',
    fontWeight: 'bold',
  },
  docRemoveBtn: {
    backgroundColor: '#fde6e8',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
  },
  modalCloseBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#3478f6',
    borderRadius: 10,
  },
});
+