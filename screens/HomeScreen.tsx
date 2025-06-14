// Strona główna aplikacji – lista pojazdów, statystyki, ostatnie tankowania
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type Vehicle = {
  id: number;
  name: string;
  brand: string;
  plate: string;
  year: string;
  tankCapacity: string;
  insurance: string;
  fuelType: string;
  odometer?: number;
};

type FuelEntry = {
  id: number;
  vehicleId: number;
  liters: number;
  kilometers: number;
  date: string;
  cost?: number;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(Math.max(width * 0.84, 240), 350);

// Sprawdza czy polisa OC jest ważna
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

export default function HomeScreen({ navigation }: any) {
  // Stan użytkownika i pojazdów
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [logoutAnim] = useState(new Animated.Value(1));
  const [greeting, setGreeting] = useState<string>('Dzień dobry!');

  // Załaduj dane po wejściu na ekran
  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      setGreeting(
        hour < 6
          ? 'Nie śpisz?'
          : hour < 12
            ? 'Dzień dobry!'
            : hour < 18
              ? 'Miłego dnia!'
              : 'Dobry wieczór!',
      );
      (async () => {
        const userJson = await AsyncStorage.getItem('currentUser');
        if (userJson) {
          const user = JSON.parse(userJson);
          setUserEmail(user.email || '');
          setUserName(user.name || user.email || 'kierowco');
          await loadVehicles(user.email);
          await loadFuelEntries(user.email);
        }
      })();
      animatePulse();
    }, []),
  );

  // Animacja pulsu
  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  // Ładuje pojazdy z pamięci
  const loadVehicles = async (email: string) => {
    const vehiclesJson = await AsyncStorage.getItem(`vehicles_${email}`);
    setVehicles(vehiclesJson ? JSON.parse(vehiclesJson) : []);
  };

  // Ładuje wpisy tankowań z pamięci
  const loadFuelEntries = async (email: string) => {
    const entriesJson = await AsyncStorage.getItem(`fuelEntries_${email}`);
    setFuelEntries(entriesJson ? JSON.parse(entriesJson) : []);
  };

  // Oblicza ile razem przejechano km dla wszystkich pojazdów
  const totalKm = (() => {
    if (fuelEntries.length === 0 || vehicles.length === 0) return 0;
    let total = 0;
    vehicles.forEach((vehicle) => {
      const vehicleEntries = fuelEntries.filter((fe) => fe.vehicleId === vehicle.id);
      if (vehicleEntries.length === 0) return;

      const maxKm = Math.max(...vehicleEntries.map((fe) => fe.kilometers));

      let startKm = vehicle.odometer ?? 0;
      if (!startKm) {
        startKm = Math.min(...vehicleEntries.map((fe) => fe.kilometers));
      }

      const diff = maxKm > startKm ? maxKm - startKm : 0;
      total += diff;
    });
    return total;
  })();

  // Pozostałe statystyki (litry, wydatki)
  const totalLiters =
    fuelEntries.length > 0 ? fuelEntries.reduce((sum, entry) => sum + (entry.liters || 0), 0) : 0;
  const totalSpent =
    fuelEntries.length > 0 ? fuelEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0) : 0;
  const vehicleCount = vehicles.length;

  // Ostatnie 5 tankowań
  const lastRefuels =
    fuelEntries.length > 0
      ? [...fuelEntries]
          .filter(entry => !!entry.date)
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
      : [];

  // Szybki dostęp do pojazdu po id
  const vehicleById = vehicles.reduce(
    (map, v) => ({ ...map, [v.id]: v }),
    {} as { [key: number]: Vehicle },
  );

  // Wylogowanie użytkownika (animacja + czyszczenie danych)
  const handleLogout = async () => {
    Animated.sequence([
      Animated.timing(logoutAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(logoutAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(logoutAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start(async () => {
      await AsyncStorage.removeItem('currentUser');
      navigation.replace('Login');
    });
  };

  // Przejście do szczegółów pojazdu
  const handleVehicleDetails = (vehicle: Vehicle) => {
    navigation.navigate('VehicleDetails', { vehicleId: vehicle.id });
  };

  // Usuwa pojazd i jego tankowania
  const handleDeleteVehicle = (id: number) => {
    Alert.alert(
      'Usuń pojazd',
      'Czy na pewno chcesz usunąć ten pojazd? Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            const updated = vehicles.filter((v) => v.id !== id);
            await AsyncStorage.setItem(`vehicles_${userEmail}`, JSON.stringify(updated));
            setVehicles(updated);

            const updatedFuel = fuelEntries.filter((f) => f.vehicleId !== id);
            await AsyncStorage.setItem(`fuelEntries_${userEmail}`, JSON.stringify(updatedFuel));
            setFuelEntries(updatedFuel);
          },
        },
      ],
    );
  };

  // Statystyki do wyświetlenia na kafelkach
  const stats = [
    {
      icon: <MaterialCommunityIcons name="garage" size={32} color="#3478f6" />,
      value: vehicleCount,
      label: 'Pojazdów',
    },
    {
      icon: <MaterialCommunityIcons name="gas-station" size={32} color="#30d158" />,
      value: `${totalLiters} L`,
      label: 'Zatankowane',
    },
    {
      icon: <MaterialCommunityIcons name="road-variant" size={32} color="#ffa800" />,
      value: `${totalKm} km`,
      label: 'Przejechane',
    },
    {
      icon: <MaterialCommunityIcons name="cash" size={32} color="#19a7ce" />,
      value: `${totalSpent.toFixed(2)} zł`,
      label: 'Wydane',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6fa' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Nagłówek z powitaniem i wylogowaniem */}
        <LinearGradient
          colors={['#3478f6', '#39c3f7']}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.logo}></Text>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.title}>Cześć, {userName ? userName : 'kierowco'}!</Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ scale: logoutAnim }] }}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={22} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Statystyki 2x2 */}
        <View style={styles.statsGrid}>
          {[0, 2].map((row) => (
            <View style={styles.statsRow} key={row}>
              <View style={styles.statsCard}>
                {stats[row].icon}
                <Text style={styles.statsNumber}>{stats[row].value}</Text>
                <Text style={styles.statsLabel}>{stats[row].label}</Text>
              </View>
              <View style={styles.statsCard}>
                {stats[row + 1].icon}
                <Text style={styles.statsNumber}>{stats[row + 1].value}</Text>
                <Text style={styles.statsLabel}>{stats[row + 1].label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ostatnie tankowania */}
        <View style={styles.lastRefuelSection}>
          <Text style={styles.sectionTitle}>Ostatnie tankowania</Text>
          {lastRefuels.length > 0 ? (
            lastRefuels.map((entry) => {
              const v = vehicleById[entry.vehicleId];
              return (
                <View key={entry.id} style={styles.lastRefuelCard}>
                  <MaterialCommunityIcons name="fuel" size={28} color="#30d158" />
                  <View style={{ marginLeft: 16 }}>
                    <Text style={styles.lastRefuelText}>
                      {v ? `${v.brand} ${v.name} (${v.plate})` : 'Pojazd usunięty'}
                    </Text>
                    <Text style={styles.lastRefuelText}>
                      {entry.liters} L, {entry.kilometers} km
                      {entry.cost ? `, ${entry.cost.toFixed(2)} zł` : ''}
                      {' – '}
                      {new Date(entry.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>Brak tankowań</Text>
          )}
        </View>

        {/* Karty pojazdów */}
        <View style={styles.vehiclesSection}>
          <Text style={styles.sectionTitle}>Twoje Pojazdy</Text>
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 12 }}
            renderItem={({ item }) => {
              const ocValid = isOCValid(item.insurance);
              return (
                <View style={[styles.vehicleCard, { width: CARD_WIDTH }]}>
                  <View style={styles.rowBetween}>
                    <MaterialCommunityIcons name="car-info" size={32} color="#3478f6" />
                    <View
                      style={[
                        styles.insuranceTag,
                        ocValid ? styles.ocValidTag : styles.ocInvalidTag,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={ocValid ? 'shield-check' : 'alert-circle'}
                        size={18}
                        color={ocValid ? '#30d158' : '#d32f2f'}
                      />
                      <Text
                        style={[
                          styles.insuranceText,
                          { color: ocValid ? '#30d158' : '#d32f2f', marginLeft: 4 },
                        ]}
                      >
                        {item.insurance
                          ? ocValid
                            ? `OC do ${new Date(item.insurance).toLocaleDateString()}`
                            : `OC nieważne!`
                          : 'Brak OC'}
                      </Text>
                    </View>
                    {/* Przycisk usuń pojazd */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteVehicle(item.id)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                  {/* Kliknij na kartę by wejść w szczegóły pojazdu */}
                  <TouchableOpacity
                    style={{ flex: 1, width: '100%' }}
                    activeOpacity={0.85}
                    onPress={() => handleVehicleDetails(item)}
                  >
                    <Text style={styles.vehicleBrand}>{item.brand}</Text>
                    <Text style={styles.vehicleName}>{item.name}</Text>
                    <Text style={styles.vehiclePlate}>{item.plate}</Text>
                    <View style={styles.statsRowCard}>
                      <View style={styles.statBox}>
                        <MaterialCommunityIcons name="calendar" size={17} color="#888" />
                        <Text style={styles.statValue}>{item.year}</Text>
                      </View>
                      <View style={styles.statBox}>
                        <MaterialCommunityIcons name="gas-cylinder" size={17} color="#888" />
                        <Text style={styles.statValue}>{item.tankCapacity} L</Text>
                      </View>
                      <View style={styles.statBox}>
                        <MaterialCommunityIcons name="gas-station" size={17} color="#888" />
                        <Text style={styles.statValue}>{item.fuelType}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {/* Przycisk tankuj/statystyki */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.refuelBtn}
                      onPress={() => navigation.navigate('AddFuel', { vehicleId: item.id })}
                    >
                      <MaterialCommunityIcons name="gas-station" size={18} color="#fff" />
                      <Text style={styles.refuelBtnText}>Zatankuj</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.statsBtn}
                      onPress={() => navigation.navigate('Stats', { vehicleId: item.id })}
                    >
                      <MaterialCommunityIcons name="chart-bar" size={18} color="#fff" />
                      <Text style={styles.statsBtnText}>Statystyki</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>
                Nie masz jeszcze pojazdów
              </Text>
            }
          />
          <TouchableOpacity
            style={styles.addVehicleBtn}
            onPress={() => navigation.navigate('AddVehicle')}
          >
            <Text style={styles.addVehicleBtnText}>+ Dodaj pojazd</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 18,
    paddingBottom: 26,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    marginBottom: 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 32,
    lineHeight: 44,
    marginRight: 6,
  },
  greeting: {
    color: '#f1fffa',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: -2,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    backgroundColor: '#4c8ef7',
    padding: 10,
    borderRadius: 999,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    marginHorizontal: 6,
    elevation: 2,
    minWidth: 0,
  },
  statsNumber: {
    fontWeight: 'bold',
    fontSize: 19,
    marginTop: 7,
    color: '#23263b',
  },
  statsLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  lastRefuelSection: {
    paddingHorizontal: 18,
    marginBottom: 2,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    color: '#2c2d35',
  },
  lastRefuelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f7ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  lastRefuelText: {
    fontSize: 15,
    color: '#23263b',
    fontWeight: '500',
  },
  vehiclesSection: {
    flex: 1,
    paddingHorizontal: 18,
    marginTop: 6,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginRight: 18,
    padding: 22,
    elevation: 6,
    shadowColor: '#3478f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minWidth: 240,
    maxWidth: 350,
  },
  rowBetween: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  insuranceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 90,
    justifyContent: 'center',
  },
  ocValidTag: {
    backgroundColor: '#e7fbf0',
  },
  ocInvalidTag: {
    backgroundColor: '#fdebec',
  },
  insuranceText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  vehicleBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3478f6',
    marginBottom: 2,
    marginTop: 2,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#23263b',
    marginBottom: 1,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  statsRowCard: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 8,
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f6fc',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    minWidth: 68,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    color: '#23263b',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  refuelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30d158',
    borderRadius: 8,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
    minWidth: 0,
  },
  refuelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffa800',
    borderRadius: 8,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 6,
    minWidth: 0,
  },
  statsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  addVehicleBtn: {
    backgroundColor: '#3478f6',
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 18,
  },
  addVehicleBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 2,
    borderRadius: 14,
  },
});
