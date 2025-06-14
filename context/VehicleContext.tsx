import React, { createContext, useState, useContext } from 'react';

type Vehicle = {
  id: string;
  name: string;
  mileage: number;
  fuelType: string;
};

type VehicleContextType = {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  updateVehicle: (vehicle: Vehicle) => void;
};

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: React.ReactNode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const addVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
  };

  const removeVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVehicle = (vehicle: Vehicle) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicle.id ? vehicle : v))
    );
  };

  return (
    <VehicleContext.Provider
      value={{ vehicles, addVehicle, removeVehicle, updateVehicle }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicles must be used within a VehicleProvider');
  return context;
};
