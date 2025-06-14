import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Liczy średnie spalanie (L/100km)
function calcAvgConsumption(entries) {
  if (entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => a.kilometers - b.kilometers);
  let totalKm = 0,
    totalLiters = 0;
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].kilometers - sorted[i - 1].kilometers;
    const liters = sorted[i].liters;
    if (km > 0 && liters > 0) {
      totalKm += km;
      totalLiters += liters;
    }
  }
  return totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
}

// Szacuje koszt paliwa na cały miesiąc
function estimateMonthCost(entries) {
  if (!entries.length) return null;
  const now = new Date();
  const month = now.getMonth(),
    year = now.getFullYear();
  const thisMonth = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  if (!thisMonth.length) return null;
  if (thisMonth.length > 1) {
    const sorted = [...thisMonth].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDay = new Date(sorted[0].date).getDate();
    const lastDay = new Date(sorted[sorted.length - 1].date).getDate();
    const days = Math.max(1, lastDay - firstDay);
    const cost = thisMonth.reduce((s, e) => s + (Number(e.cost) || 0), 0);
    const avgPerDay = cost / days;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.round(avgPerDay * daysInMonth);
  } else {
    const today = now.getDate();
    const cost = Number(thisMonth[0].cost) || 0;
    const avgPerDay = cost / today;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.round(avgPerDay * daysInMonth);
  }
}

// Liczy emisję CO2 i ile drzew "potrzeba"
function calcCO2(entries) {
  if (!entries.length) return { totalCO2: '0', savedTrees: 0 };
  const totalFuel = entries.reduce((sum, e) => sum + (Number(e.liters) || 0), 0);
  const totalCO2 = totalFuel * 2.31;
  const savedTrees = Math.max(1, Math.round(totalCO2 / 22));
  return { totalCO2: totalCO2.toFixed(1), savedTrees };
}

// Pasek animowany do pokazania spalania
function AnimatedFuelBar({ value }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.min(value, 20),
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <View style={styles.barBg}>
      <Animated.View
        style={{
          width: width.interpolate({
            inputRange: [0, 20],
            outputRange: ['0%', '100%'],
          }),
          height: '100%',
          backgroundColor:
            value === 0 ? '#e0e0e0' : value <= 7 ? '#44dd88' : value <= 11 ? '#e7be21' : '#fd5050',
        }}
      />
    </View>
  );
}

// Główny ekran statystyk pojazdu
export default function StatsScreen({ route }) {
  const vehicleId = route?.params?.vehicleId;
  const [userEmail, setUserEmail] = useState('');
  type RefuelEntry = {
    cost: number;
    liters: number;
    kilometers: number;
    date: string;
    vehicleId: string;
    [key: string]: any;
  };
  const [refuels, setRefuels] = useState<RefuelEntry[]>([]);
  type Vehicle = { id: string; name: string; [key: string]: any };
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  // Stan z podsumowaniem, liczony na podstawie tankowań
  const [summary, setSummary] = useState<{
    totalCost: number;
    totalKm: number;
    totalLiters: number;
    avgPrice: number;
    avgConsumption: number;
    monthCost: number | null;
    eco: { totalCO2: string; savedTrees: number };
  }>({
    totalCost: 0,
    totalKm: 0,
    totalLiters: 0,
    avgPrice: 0,
    avgConsumption: 0,
    monthCost: null,
    eco: { totalCO2: '0', savedTrees: 0 },
  });

  // Ładuje tankowania i pojazd, wylicza statystyki
  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) return;
      const user = JSON.parse(userJson);
      setUserEmail(user.email);

      const vehiclesJson = await AsyncStorage.getItem(`vehicles_${user.email}`);
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      const v = vehicles.find((car) => car.id === vehicleId);
      setVehicle(v);

      const entriesJson = await AsyncStorage.getItem(`fuelEntries_${user.email}`);
      const allEntries = entriesJson ? JSON.parse(entriesJson) : [];
      const carEntries = allEntries.filter((e) => e.vehicleId === vehicleId);
      setRefuels(carEntries);

      if (carEntries.length) {
        const sorted = [...carEntries].sort((a, b) => a.kilometers - b.kilometers);
        const km = sorted[sorted.length - 1].kilometers - sorted[0].kilometers;
        const liters = carEntries.reduce((sum, x) => sum + (x.liters || 0), 0);
        const totalCost = carEntries.reduce((sum, x) => sum + (x.cost || 0), 0);
        const prices = carEntries.filter((x) => x.liters && x.cost).map((x) => x.cost / x.liters);
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const avgConsumption = calcAvgConsumption(carEntries);
        const monthCost = estimateMonthCost(carEntries);
        const eco = calcCO2(carEntries);

        setSummary({
          totalCost,
          totalKm: km,
          totalLiters: liters,
          avgPrice,
          avgConsumption,
          monthCost,
          eco,
        });
      } else {
        setSummary((s) => ({
          ...s,
          totalCost: 0,
          totalKm: 0,
          totalLiters: 0,
          avgPrice: 0,
          avgConsumption: 0,
          monthCost: null,
          eco: { totalCO2: '0', savedTrees: 0 },
        }));
      }
    })();
  }, [vehicleId]);

  // Przygotowuje dane do wykresów
  const chartLabels = refuels.map((_, i) => (i + 1).toString());
  const priceData = refuels.map((r) => r.cost || 0);
  const litersData = refuels.map((r) => r.liters || 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f6f6fa' }}>
      {/* HEADER – nazwa pojazdu, podsumowania */}
      <View style={styles.summaryGradient}>
        <Text style={styles.title}>
          Statystyki: <Text style={styles.vehicleName}>{vehicle?.name || 'Pojazd'}</Text>
        </Text>
        <View style={styles.dashRow}>
          <View style={styles.dashBoxLeft}>
            <MaterialCommunityIcons name="fuel" size={30} color="#30d158" />
            <Text style={styles.dashValue}>{summary.totalLiters.toFixed(1)} L</Text>
            <Text style={styles.dashLabel}>Zatankowane</Text>
          </View>
          <View style={styles.dashBoxCenter}>
            <MaterialCommunityIcons name="road-variant" size={30} color="#ffa800" />
            <Text style={styles.dashValue}>{summary.totalKm} km</Text>
            <Text style={styles.dashLabel}>Przejechane</Text>
          </View>
          <View style={styles.dashBoxRight}>
            <MaterialCommunityIcons name="cash" size={30} color="#3478f6" />
            <Text style={styles.dashValue}>{summary.totalCost.toFixed(2)} zł</Text>
            <Text style={styles.dashLabel}>Wydane</Text>
          </View>
        </View>
        <View style={styles.specialBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="speedometer" size={26} color="#7c3aed" />
            <Text style={styles.specialLabel}>Średnie spalanie</Text>
          </View>
          <Text style={styles.specialValue}>
            {summary.avgConsumption ? summary.avgConsumption.toFixed(2) : '-'} L/100km
          </Text>
          <AnimatedFuelBar value={summary.avgConsumption} />
        </View>
      </View>

      {/* Wykres: koszt tankowań */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Koszt tankowań</Text>
        {priceData.length ? (
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [{ data: priceData }],
            }}
            width={Dimensions.get('window').width - 24}
            height={170}
            yAxisSuffix=" zł"
            chartConfig={chartConfig}
            fromZero
            style={styles.chart} yAxisLabel={''}          />
        ) : (
          <Text style={styles.noData}>Brak danych do wyświetlenia</Text>
        )}
      </View>

      {/* Wykres: ilość paliwa */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ilość zatankowanego paliwa</Text>
        {litersData.length ? (
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [{ data: litersData }],
            }}
            width={Dimensions.get('window').width - 24}
            height={150}
            yAxisSuffix=" L"
            chartConfig={chartConfig}
            fromZero
            style={styles.chart} yAxisLabel={''}          />
        ) : (
          <Text style={styles.noData}>Brak danych do wyświetlenia</Text>
        )}
      </View>

      {/* Prognoza kosztów do końca miesiąca */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prognoza wydatków do końca miesiąca</Text>
        <View style={[styles.statBox, { backgroundColor: '#e6f7fe', marginTop: 8 }]}>
          <MaterialCommunityIcons name="calendar-clock" size={25} color="#12b0e8" />
          <Text style={[styles.statValue, { color: '#12b0e8' }]}>
            {summary.monthCost !== null ? `${summary.monthCost} zł` : '-'}
          </Text>
          <Text style={[styles.statLabel, { color: '#12b0e8' }]}>
            Estymacja wg. aktualnego tempa
          </Text>
        </View>
      </View>

      {/* Ekologia */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ekologiczny licznik CO₂</Text>
        <View style={[styles.statBox, { backgroundColor: '#e0f7ec', marginTop: 8 }]}>
          <MaterialCommunityIcons name="leaf" size={25} color="#0ca678" />
          <Text style={[styles.statValue, { color: '#009966' }]}>
            {summary.eco.totalCO2} kg CO₂
          </Text>
          <Text style={[styles.statLabel, { color: '#009966' }]}>
            Twoje tankowania = {summary.eco.savedTrees}{' '}
            {summary.eco.savedTrees === 1 ? 'drzewo' : 'drzewa'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#f8f6ff',
  backgroundGradientTo: '#e8e6ff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(44, 38, 66, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(50,50,60,${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#7c3aed' },
};

const styles = StyleSheet.create({
  summaryGradient: {
    margin: 10,
    padding: 20,
    backgroundColor: '#f5f6fa',
    borderRadius: 24,
    elevation: 4,
    marginBottom: 16,
    shadowColor: '#99aaff',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
  },
  vehicleName: {
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23263b',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dashRow: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  dashBoxLeft: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e6fbef',
    borderRadius: 14,
    paddingVertical: 18,
    marginRight: 3,
    elevation: 2,
  },
  dashBoxCenter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff6e8',
    borderRadius: 14,
    paddingVertical: 18,
    marginHorizontal: 3,
    elevation: 2,
  },
  dashBoxRight: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#eef4fd',
    borderRadius: 14,
    paddingVertical: 18,
    marginLeft: 3,
    elevation: 2,
  },
  dashValue: {
    fontWeight: 'bold',
    fontSize: 19,
    color: '#23263b',
    marginTop: 6,
  },
  dashLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  specialBox: {
    marginTop: 12,
    backgroundColor: '#f6f1ff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 1,
    marginBottom: 8,
  },
  specialLabel: {
    fontSize: 17,
    color: '#7c3aed',
    fontWeight: '600',
  },
  specialValue: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#7c3aed',
    marginVertical: 8,
  },
  barBg: {
    height: 20,
    backgroundColor: '#e7e7f3',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 9,
  },
  section: { marginTop: 18, marginBottom: 7 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2d35',
    marginLeft: 12,
    marginBottom: 8,
    letterSpacing: 0.15,
  },
  chart: { borderRadius: 18, alignSelf: 'center' },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 13,
    paddingVertical: 16,
    marginHorizontal: 2,
    marginBottom: 10,
    elevation: 1,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#23263b',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 1,
    textAlign: 'center',
  },
  noData: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
    fontSize: 15,
  },
});
