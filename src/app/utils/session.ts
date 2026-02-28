import type { SessionData } from '../types';
import { SESSION_STORAGE_KEY, SESSION_TIMEOUT } from '../constants';

/**
 * 生成会话ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * 获取当前时间戳
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 保存会话到localStorage
 */
export const saveSession = (sessionData: SessionData): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('保存会话失败:', error);
  }
};

/**
 * 从localStorage恢复会话
 */
export const restoreSession = (): SessionData | null => {
  try {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSession) return null;

    const session: SessionData = JSON.parse(storedSession);
    const loginTime = new Date(session.loginTime).getTime();
    const currentTime = Date.now();

    // 检查会话是否过期
    if (currentTime - loginTime < SESSION_TIMEOUT) {
      return session;
    } else {
      // 会话过期，清除localStorage
      clearSession();
      console.log('会话已过期，请重新登录');
      return null;
    }
  } catch (error) {
    console.error('恢复会话失败:', error);
    clearSession();
    return null;
  }
};

/**
 * 清除会话
 */
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

/**
 * 检查会话是否超时
 */
export const isSessionExpired = (loginTime: string): boolean => {
  const loginTimestamp = new Date(loginTime).getTime();
  const currentTime = Date.now();
  return currentTime - loginTimestamp >= SESSION_TIMEOUT;
};

/**
 * 计算会话时长（分钟）
 */
export const getSessionMinutes = (loginTime: string): number => {
  const loginTimestamp = new Date(loginTime).getTime();
  const currentTime = Date.now();
  const durationMs = currentTime - loginTimestamp;
  return Math.floor(durationMs / 60000);
};

/**
 * 格式化会话时长
 */
export const formatSessionDuration = (loginTime: string): string => {
  const minutes = getSessionMinutes(loginTime);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  return `${minutes}分钟`;
};
