import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Typ danych pojazdu
type Vehicle = {
  id: number;
  name: string;
  brand: string;
  plate: string;
  year: string;
  tankCapacity: string;
  insurance: string;
  fuelType: string;
  startKilometers?: number;
};

// Typ danych tankowania
type FuelEntry = {
  id: number;
  vehicleId: number;
  liters: number;
  kilometers: number;
  date: string;
  cost?: number;
};

// Sprawdza czy OC jest jeszcze ważne
function isOCValid(dateStr?: string) {
  if (!dateStr) return false;
  try {
    const now = new Date();
    const oc = new Date(dateStr);
    return oc >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } catch {
    return false;
  }
}

// Ekran szczegółów pojazdu
export default function VehicleDetailsScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');

  // Ładuje dane pojazdu i tankowań
  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserEmail(user.email);

        const vehiclesJson = await AsyncStorage.getItem(`vehicles_${user.email}`);
        const vehicles: Vehicle[] = vehiclesJson ? JSON.parse(vehiclesJson) : [];
        setVehicle(vehicles.find((v) => v.id === vehicleId) || null);

        const entriesJson = await AsyncStorage.getItem(`fuelEntries_${user.email}`);
        const entries: FuelEntry[] = entriesJson ? JSON.parse(entriesJson) : [];
        setFuelEntries(entries.filter((e) => e.vehicleId === vehicleId));
      }
    })();
  }, [vehicleId]);

  // Przechodzi do edycji pojazdu
  const handleEdit = () => {
    if (vehicle) navigation.navigate('EditVehicle', { vehicle });
  };

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Nie znaleziono pojazdu</Text>
      </View>
    );
  }

  // Podstawowe dane do statystyk
  const baseKm = vehicle.startKilometers ?? 0;
  const maxKmEntry =
    fuelEntries.length > 0 ? Math.max(...fuelEntries.map((entry) => entry.kilometers)) : 0;
  const currentKm = maxKmEntry > 0 ? maxKmEntry : baseKm;
  const totalKm = maxKmEntry > baseKm ? maxKmEntry - baseKm : 0;
  const totalLiters = fuelEntries.length
    ? fuelEntries.reduce((sum, entry) => sum + (entry.liters || 0), 0)
    : 0;
  const totalCost = fuelEntries.length
    ? fuelEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0)
    : 0;

  const ocValid = isOCValid(vehicle.insurance);

  // Tankowania od najnowszego
  const sortedEntries = [...fuelEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Karta z danymi pojazdu */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="car-info" size={40} color="#3478f6" />
          <Text style={styles.vehicleTitle}>
            {vehicle.brand} {vehicle.name}
          </Text>
        </View>
        {/* Informacja o OC */}
        <View
          style={[
            styles.ocRow,
            { backgroundColor: ocValid ? "#e7fbf0" : "#fde9e8" },
          ]}
        >
          <MaterialCommunityIcons
            name={ocValid ? "shield-check" : "alert-circle"}
            size={22}
            color={ocValid ? "#30d158" : "#d32f2f"}
          />
          <Text
            style={[
              styles.insuranceText,
              { color: ocValid ? "#30d158" : "#d32f2f" },
            ]}
          >
            {vehicle.insurance
              ? ocValid
                ? `OC do ${new Date(vehicle.insurance).toLocaleDateString()}`
                : `OC nieważne!`
              : "Brak OC"}
          </Text>
        </View>
        {/* Szczegóły pojazdu */}
        <Text style={styles.detailLabel}>
          Rejestracja: <Text style={styles.detailValue}>{vehicle.plate}</Text>
        </Text>
        <Text style={styles.detailLabel}>
          Rocznik: <Text style={styles.detailValue}>{vehicle.year}</Text>
        </Text>
        <Text style={styles.detailLabel}>
          Pojemność baku: <Text style={styles.detailValue}>{vehicle.tankCapacity} L</Text>
        </Text>
        <Text style={styles.detailLabel}>
          Paliwo: <Text style={styles.detailValue}>{vehicle.fuelType}</Text>
        </Text>
        <Text style={styles.detailLabel}>
          Przebieg: <Text style={styles.detailValue}>{currentKm} km</Text>
        </Text>
        {/* Statystyki pojazdu */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statystyki tego auta</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="gas-station" size={19} color="#30d158" />
              <Text style={styles.statValue}>{totalLiters} L</Text>
              <Text style={styles.statLabel}>Zatankowano</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="road-variant" size={19} color="#ffa800" />
              <Text style={styles.statValue}>{totalKm} km</Text>
              <Text style={styles.statLabel}>Przejechane</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="cash" size={19} color="#3478f6" />
              <Text style={styles.statValue}>{totalCost ? `${totalCost.toFixed(2)} zł` : "-"}</Text>
              <Text style={styles.statLabel}>Wydane</Text>
            </View>
          </View>
        </View>
        {/* Przycisk do edycji */}
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          <Text style={styles.editBtnText}>Edytuj pojazd</Text>
        </TouchableOpacity>
      </View>
      {/* Historia tankowań */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Historia tankowań</Text>
        {sortedEntries.length === 0 ? (
          <Text style={styles.emptyHistory}>Brak tankowań</Text>
        ) : (
          sortedEntries.map((item) => (
            <View style={styles.historyItem} key={item.id}>
              <MaterialCommunityIcons
                name="fuel"
                size={22}
                color="#30d158"
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyLiters}>{item.liters} L</Text>
                <Text style={styles.historyDetails}>
                  {item.kilometers} km · {new Date(item.date).toLocaleDateString()}
                  {item.cost ? ` · ${item.cost.toFixed(2)} zł` : ""}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f6f6fa',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#3478f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'flex-start',
    marginTop: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  vehicleTitle: { fontSize: 24, fontWeight: 'bold', color: '#3478f6', marginLeft: 14 },
  detailLabel: { fontSize: 16, color: '#888', marginVertical: 2, fontWeight: '500' },
  detailValue: { color: '#23263b', fontWeight: 'bold' },
  ocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  insuranceText: { fontSize: 15, fontWeight: 'bold', marginLeft: 7 },
  statsContainer: { marginTop: 16, marginBottom: 10, width: '100%' },
  statsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#23263b' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f6fc',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#23263b', marginTop: 4 },
  statLabel: { fontSize: 13, color: '#888', marginTop: 1 },
  editBtn: {
    backgroundColor: '#3478f6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    alignSelf: 'flex-end',
  },
  editBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  historySection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 30,
    padding: 20,
    shadowColor: '#3478f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#2c2d35' },
  emptyHistory: { color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  historyLiters: { fontSize: 15, color: '#23263b', fontWeight: 'bold' },
  historyDetails: { fontSize: 13, color: '#888' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6fa' },
  notFound: { fontSize: 20, color: '#888' },
});
