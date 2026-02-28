import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DeviceRecord, DeviceConnection } from '../types';

interface DevicesContextValue {
  devices: DeviceRecord[];
  addDevice: (device: Omit<DeviceRecord, 'id' | 'createdAt' | 'status'>) => void;
  updateDevice: (id: string, partial: Partial<Pick<DeviceRecord, 'name' | 'status' | 'category' | 'subType' | 'connection'>>) => void;
  deleteDevice: (id: string) => void;
  updateDeviceStatus: (id: string, status: DeviceRecord['status']) => void;
  /** Robot devices for 机械臂选择 in data collection */
  getRobotDevices: () => { id: string; name: string; subType: string; status: 'available' | 'in-use' }[];
  /** Unique controller subTypes that have at least one device */
  getControllerSubTypes: () => string[];
  /** Controller devices for 选择设备 in data collection, by subType */
  getControllerDevices: (subType: string) => { id: string; name: string; status: 'available' | 'in-use' }[];
}

const DevicesContext = createContext<DevicesContextValue | undefined>(undefined);

function generateId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DevicesProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);

  const addDevice = useCallback(
    (device: Omit<DeviceRecord, 'id' | 'createdAt' | 'status'>) => {
      const newDevice: DeviceRecord = {
        ...device,
        id: generateId(),
        status: 'available',
        createdAt: nowDateString(),
      };
      setDevices((prev) => [...prev, newDevice]);
    },
    []
  );

  const updateDevice = useCallback(
    (id: string, partial: Partial<Pick<DeviceRecord, 'name' | 'status' | 'category' | 'subType' | 'connection'>>) => {
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...partial } : d)));
    },
    []
  );

  const deleteDevice = useCallback((id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDeviceStatus = useCallback((id: string, status: DeviceRecord['status']) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }, []);

  const getRobotDevices = useCallback(() => {
    return devices
      .filter((d) => d.category === 'robot' && d.status !== 'disabled')
      .map((d) => ({ id: d.id, name: d.name, subType: d.subType, status: d.status as 'available' | 'in-use' }));
  }, [devices]);

  const getControllerSubTypes = useCallback(() => {
    const subTypes = new Set(devices.filter((d) => d.category === 'controller' && d.status !== 'disabled').map((d) => d.subType));
    return [...subTypes];
  }, [devices]);

  const getControllerDevices = useCallback(
    (subType: string) => {
      return devices
        .filter((d) => d.category === 'controller' && d.subType === subType && d.status !== 'disabled')
        .map((d) => ({ id: d.id, name: d.name, status: d.status as 'available' | 'in-use' }));
    },
    [devices]
  );

  const value: DevicesContextValue = {
    devices,
    addDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus,
    getRobotDevices,
    getControllerSubTypes,
    getControllerDevices,
  };

  return <DevicesContext.Provider value={value}>{children}</DevicesContext.Provider>;
}

export function useDevices() {
  const context = useContext(DevicesContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DevicesProvider');
  }
  return context;
}
