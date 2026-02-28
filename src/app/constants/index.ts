import type { AccountConfig, UserRole, PageType } from '../types';

// Default accounts: Lyu with admin/reviewer/collector roles
export const DEFAULT_ACCOUNTS: AccountConfig[] = [
  { username: 'Lyu', password: '', name: '吕', roles: ['admin', 'reviewer', 'collector'] },
];

// Role to workspace page: each role can only enter their own page
export const ROLE_TO_PAGE: Record<UserRole, PageType> = {
  collector: 'collect',
  reviewer: 'chain',
  admin: 'platform',
};

// Page to required role (test is admin-only)
export const PAGE_TO_ROLE: Record<PageType, UserRole> = {
  collect: 'collector',
  chain: 'reviewer',
  platform: 'admin',
  test: 'admin',
};

// Fixed tab order: 数据采集 -> 数据标注 -> 数据中台 -> 测试
export const PAGE_ORDER: PageType[] = ['collect', 'chain', 'platform', 'test'];

// Step 1: what type to add (robot arm or controller)
export const DEVICE_CATEGORIES = [
  { id: 'robot' as const, name: '机械臂' },
  { id: 'controller' as const, name: '控制器' },
];

// Step 2 for robot: single arm, dual arm, or add new robot type
export const ROBOT_SUBTYPE_OPTIONS = [
  { id: 'single', name: '单臂' },
  { id: 'dual', name: '双臂' },
  { id: '__new__', name: '添加新的机械臂类型' },
];

// Step 2 for controller: VR, GELLO, gamepad, or add new controller type
export const CONTROLLER_SUBTYPE_OPTIONS = [
  { id: 'VR', name: 'VR' },
  { id: 'GELLOW', name: 'GELLO' },
  { id: 'GAMEPAD', name: '手柄' },
  { id: '__new__', name: '添加新的控制器类型' },
];

// Connection types for device pairing (extensible: usb first, others later)
export const CONNECTION_TYPES = [
  { id: 'usb' as const, name: 'USB 串口', available: true },
  { id: 'network' as const, name: '网络 (TCP)', available: false },
  { id: 'bluetooth' as const, name: '蓝牙', available: false },
];

// 会话超时时间（毫秒） - 1小时
export const SESSION_TIMEOUT = 60 * 60 * 1000;

// 会话续期确认超时时间（毫秒） - 1分钟
export const SESSION_RENEWAL_TIMEOUT = 60 * 1000;

// 会话存储键
export const SESSION_STORAGE_KEY = 'robodata_session';

// 角色名称映射
export const ROLE_NAMES: Record<UserRole, string> = {
  collector: '采集员',
  reviewer: '标注员',
  admin: '管理员',
};

// 页面标题映射
export const PAGE_TITLES = {
  collect: '数据采集',
  chain: '数据标注',
  platform: '数据中台',
  test: '测试',
} as const;