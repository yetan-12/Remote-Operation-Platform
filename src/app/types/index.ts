// 用户角色类型
export type UserRole = 'reviewer' | 'admin' | 'collector';

// 用户接口
export interface User {
  username: string;
  name: string;
  roles: UserRole[];
  currentRole: UserRole;
  loginTime: string;
  sessionId: string;
}

// 账户配置
export interface AccountConfig {
  username: string;
  password: string;
  name: string;
  roles: UserRole[];
}

// 页面类型
export type PageType = 'collect' | 'chain' | 'platform' | 'test';

// 会话数据
export interface SessionData {
  user: User;
  currentPage: PageType;
  loginTime: string;
}

// Device category: add one device at a time, either robot or controller
export type DeviceCategory = 'robot' | 'controller';

// Connection type for device pairing (extensible: usb now, network/bluetooth later)
export type ConnectionType = 'usb' | 'network' | 'bluetooth' | 'custom';

export interface DeviceConnection {
  type: ConnectionType;
  address: string; // e.g. COM3, 127.0.0.1:6001, or device id
}

// Device: one device = one item. category + subType + name; optional pairing with connected hardware
export interface DeviceRecord {
  id: string;
  category: DeviceCategory;
  subType: string; // e.g. 'single'|'dual' for robot; 'VR'|'GELLOW'|'GAMEPAD' or custom for controller
  name: string;
  status: 'available' | 'in-use' | 'disabled';
  createdAt: string;
  /** Paired connection (optional). Enables "scan connected devices" when adding. */
  connection?: DeviceConnection;
}
