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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minFuelKm, setMinFuelKm] = useState<number | null>(null);

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
    if (
      !/^\d{4}$/.test(year) ||
      parseInt(year) < 1980 ||
      parseInt(year) > new Date().getFullYear()
    ) {
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
      setError(
        `Przebieg początkowy nie może być większy niż najniższy przebieg z tankowań (${minFuelKm} km)!`
      );
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
      // Aktualizujemy dane pojazdu
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
            }
          : v
      );
      // Zapisujemy nową listę pojazdów do pamięci
      await AsyncStorage.setItem(`vehicles_${user.email}`, JSON.stringify(vehicles));
      // Pokazujemy informację o sukcesie
      Alert.alert('Sukces', 'Zmiany zapisane!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError('Błąd podczas zapisu. Spróbuj ponownie.');
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

  // Tutaj rysujemy cały formularz na ekranie
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f6f6fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={dynamicContainer}>
          <Text style={styles.title}>Edytuj pojazd</Text>
          <TextInput style={styles.input} placeholder="Nazwa pojazdu" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Marka" value={brand} onChangeText={setBrand} />
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
            placeholder="Przebieg początkowy (km)"
            value={startKilometers}
            keyboardType="numeric"
            onChangeText={setStartKilometers}
          />
          {/* Wybieranie daty ubezpieczenia */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={{ color: insurance ? '#23263b' : '#888', textAlign: 'center' }}>
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
          {/* Wybieranie typu paliwa */}
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
                    style={[styles.fuelTypeBtnText, fuelType === type && styles.fuelTypeBtnTextActive]}
                  >
                    {type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          {/* Przycisk zapisu zmian */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Zapisz zmiany</Text>
          </TouchableOpacity>
          {/* Przycisk anulowania i powrotu */}
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
