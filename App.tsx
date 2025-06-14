import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AddVehicleScreen from './screens/AddVehicleScreen';
import AddFuelScreen from './screens/AddFuelScreen';
import StatsScreen from './screens/StatsScreen';
import RegisterScreen from './screens/RegisterScreen';
import VehicleDetailsScreen from './screens/VehicleDetailsScreen';
import EditVehicleScreen from './screens/EditVehicleScreen';
import { UserProvider } from './context/UserContext';
import { VehicleProvider } from './context/VehicleContext';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  AddVehicle: undefined;
  AddFuel: { vehicleId: number };
  Stats: { vehicleId: number };
  EditVehicle: { vehicleId: number };
  VehicleDetails: { vehicleId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <UserProvider>
      <VehicleProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, orientation: 'all' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ orientation: 'all' }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Twoje Pojazdy', orientation: 'all' }}
            />
            <Stack.Screen
              name="AddVehicle"
              component={AddVehicleScreen}
              options={{ title: 'Dodaj pojazd', orientation: 'all' }}
            />
            <Stack.Screen
              name="AddFuel"
              component={AddFuelScreen}
              options={{ title: 'Dodaj Tankowanie', orientation: 'all' }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{ title: 'Statystyki', orientation: 'all' }}
            />
            <Stack.Screen
              name="EditVehicle"
              component={EditVehicleScreen}
              options={{ title: 'Edytuj pojazd', orientation: 'all' }}
            />
            <Stack.Screen
              name="VehicleDetails"
              component={VehicleDetailsScreen}
              options={{ title: 'Szczegóły pojazdu', orientation: 'all' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </VehicleProvider>
    </UserProvider>
  );
}
