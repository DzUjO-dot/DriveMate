import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

// Ekran do dodawania tankowania
export default function AddFuelScreen({ route, navigation }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { vehicleId } = route.params;
  const [liters, setLiters] = useState("");
  const [kilometers, setKilometers] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [vehicle, setVehicle] = useState<any>(null);
  const [maxPrevKm, setMaxPrevKm] = useState<number>(0);

  // Funkcja zamienia tekst na liczbę
  const parseNumber = (str: any): number => {
    if (typeof str === "number") return str;
    if (!str) return NaN;
    return Number(str.toString().replace(",", "."));
  };

  // Załaduj dane pojazdu i wpisów użytkownika po uruchomieniu ekranu
  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem("currentUser");
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserEmail(user.email);

        const vehiclesJson = await AsyncStorage.getItem(`vehicles_${user.email}`);
        const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
        const v = vehicles.find((car) => car.id === vehicleId);
        setVehicle(v);

        const entriesJson = await AsyncStorage.getItem(`fuelEntries_${user.email}`);
        const entries = entriesJson ? JSON.parse(entriesJson) : [];
        const vehicleEntries = entries.filter((e) => e.vehicleId === vehicleId);
        const maxTankKm = vehicleEntries.length
          ? Math.max(...vehicleEntries.map((e) => parseNumber(e.kilometers)))
          : 0;
        const startKm = v?.startKilometers ? parseNumber(v.startKilometers) : 0;
        setMaxPrevKm(maxTankKm > startKm ? maxTankKm : startKm);
      }
    })();
  }, [vehicleId]);

  // Sprawdza czy dane są poprawne
  const validate = () => {
    const litersNum = parseNumber(liters);
    const kmNum = parseNumber(kilometers);
    const costNum = cost ? parseNumber(cost) : 0;
    const tankCapacity = vehicle?.tankCapacity ? parseNumber(vehicle.tankCapacity) : NaN;
    const startKm = vehicle?.startKilometers ? parseNumber(vehicle.startKilometers) : NaN;

    if (isNaN(litersNum) || isNaN(kmNum) || litersNum <= 0 || kmNum <= 0) {
      setError("Podaj poprawną ilość litrów i przebieg (większe niż 0).");
      return false;
    }
    if (cost && (isNaN(costNum) || costNum < 0)) {
      setError("Podaj poprawny koszt lub pozostaw puste.");
      return false;
    }
    if (!isNaN(startKm) && kmNum < startKm) {
      setError(
        `Przebieg nie może być mniejszy niż przebieg początkowy pojazdu (${startKm} km)!`
      );
      return false;
    }
    if (!isNaN(maxPrevKm) && kmNum < maxPrevKm) {
      setError(
        `Przebieg nie może być mniejszy niż ostatni przebieg tankowania (${maxPrevKm} km)!`
      );
      return false;
    }
    if (!isNaN(tankCapacity) && tankCapacity > 0 && litersNum > tankCapacity) {
      setError(
        `Ilość paliwa nie może być większa niż pojemność baku (${tankCapacity} L)!`
      );
      return false;
    }
    setError(null);
    return true;
  };

  // Zapisuje nowe tankowanie do pamięci
  const handleAdd = async () => {
    if (!validate() || !userEmail) return;
    try {
      const entriesJson = await AsyncStorage.getItem(`fuelEntries_${userEmail}`);
      const entries = entriesJson ? JSON.parse(entriesJson) : [];
      const newEntry = {
        id: Date.now(),
        vehicleId,
        liters: parseNumber(liters),
        kilometers: parseNumber(kilometers),
        date: date.toISOString(),
        cost: cost ? parseNumber(cost) : undefined,
      };
      await AsyncStorage.setItem(
        `fuelEntries_${userEmail}`,
        JSON.stringify([...entries, newEntry])
      );
      Alert.alert("Sukces", "Tankowanie zapisane!", [
        {
          text: "OK",
          onPress: () => navigation.replace("VehicleDetails", { vehicleId }),
        },
      ]);
    } catch (e) {
      setError("Błąd podczas zapisu. Spróbuj ponownie.");
    }
  };

  // Wyświetla ekran z polami do wypełnienia
  const dynamicContainer = [
    styles.container,
    {
      width: isLandscape ? "60%" : "100%",
      alignSelf: "center" as const,
      paddingHorizontal: isLandscape ? 32 : 22,
      paddingVertical: isLandscape ? 30 : 22,
      marginTop: isLandscape ? 16 : 20,
      marginBottom: isLandscape ? 16 : 20,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f6f6fa" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={dynamicContainer}>
          <Text style={styles.title}>Dodaj tankowanie</Text>
          <TextInput
            style={styles.input}
            placeholder="Ilość paliwa (L)"
            keyboardType="decimal-pad"
            value={liters}
            onChangeText={(text) => setLiters(text.replace(/[^0-9.,]/g, ""))}
          />
          <TextInput
            style={styles.input}
            placeholder="Przebieg (km)"
            keyboardType="number-pad"
            value={kilometers}
            onChangeText={(text) => setKilometers(text.replace(/[^0-9]/g, ""))}
          />
          <TextInput
            style={styles.input}
            placeholder="Koszt (opcjonalnie, zł)"
            keyboardType="decimal-pad"
            value={cost}
            onChangeText={(text) => setCost(text.replace(/[^0-9.,]/g, ""))}
          />
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#23263b", textAlign: "center" }}>
              {date ? `Data: ${date.toLocaleDateString()}` : "Wybierz datę"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Dodaj tankowanie</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Style ekranu
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#3478f6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#3478f6",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 9,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f8f8fa",
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: "#3478f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  error: {
    color: "#d32f2f",
    textAlign: "center",
    marginVertical: 6,
    fontWeight: "bold",
  },
});