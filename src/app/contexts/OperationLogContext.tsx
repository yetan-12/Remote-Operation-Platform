import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import { appEventBus } from '../core/events/AppEventBus';

export type OperationRole = 'Admin' | 'Reviewer' | 'Collector';
export type OperationType =
  | 'Login'
  | 'DataCollection'
  | 'DataReview'
  | 'DeviceManagement'
  | 'UserManagement'
  | 'SystemConfig'
  | 'Export';

export type OperationStatus = 'Success' | 'Failed';

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  username: string;
  fullName: string;
  role: OperationRole;
  operationType: OperationType;
  description: string;
  ipAddress: string;
  status: OperationStatus;
  details?: string;
}

interface OperationLogContextValue {
  logs: OperationLogEntry[];
  appendLog: (entry: Omit<OperationLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  clearLogs: () => void;
}

const STORAGE_KEY_OPERATION_LOGS = 'robodata_operation_logs';

const OperationLogContext = createContext<OperationLogContextValue | undefined>(undefined);

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function loadLogs(): OperationLogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OPERATION_LOGS);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: OperationLogEntry[]) {
  localStorage.setItem(STORAGE_KEY_OPERATION_LOGS, JSON.stringify(logs));
}

export function OperationLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<OperationLogEntry[]>(loadLogs);

  const appendLog = useCallback(
    (entry: Omit<OperationLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
      setLogs((prev) => {
        const next: OperationLogEntry[] = [
          {
            ...entry,
            id: entry.id ?? generateId('log'),
            timestamp: entry.timestamp ?? nowTimestamp(),
          },
          ...prev,
        ];
        saveLogs(next);
        return next;
      });
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs(() => {
      saveLogs([]);
      return [];
    });
  }, []);

  useEffect(() => {
    const unsubCollect = appEventBus.subscribe('CLIPS_COLLECTED', (payload) => {
      appendLog({
        username: payload.collector,
        fullName: payload.collector,
        role: 'Collector',
        operationType: 'DataCollection',
        description: '提交了新的Clips数据',
        ipAddress: '—',
        status: 'Success',
        details: `Session ID: ${payload.sessionId}，包含${payload.clipCount}条Clip数据；设备: ${payload.device}`,
      });
    });
    const unsubAssign = appEventBus.subscribe('CLIP_ASSIGNED', (payload) => {
      appendLog({
        username: payload.assignedBy,
        fullName: payload.assignedBy,
        role: 'Admin',
        operationType: 'DataReview',
        description: `将Clip ${payload.clipId} 分配给 ${payload.assigneeName}`,
        ipAddress: '—',
        status: 'Success',
        details: `Clip ID: ${payload.clipId}；分配给: ${payload.assigneeName} (${payload.assigneeUsername})`,
      });
    });
    const unsubReview = appEventBus.subscribe('CLIP_REVIEWED', (payload) => {
      const validity = payload.dataValidity === 'valid' ? '有效' : '无效';
      const completeness = payload.dataCompleteness === 'complete' ? '完整' : '不完整';
      const resultLine = `结果: 数据${validity}、${completeness}`;
      const tagsLine = payload.errorTags.length ? `；无效标签: ${payload.errorTags.join(', ')}` : '';
      const commentLine = payload.reviewComment ? `；备注: ${payload.reviewComment}` : '';
      appendLog({
        username: payload.reviewer,
        fullName: payload.reviewer,
        role: 'Reviewer',
        operationType: 'DataReview',
        description: `标注/审核了Clip ${payload.clipId}`,
        ipAddress: '—',
        status: 'Success',
        details: `${resultLine}${tagsLine}${commentLine}`,
      });
    });
    const unsubUserCreate = appEventBus.subscribe('USER_CREATED', (payload) => {
      appendLog({
        username: payload.createdBy,
        fullName: payload.createdBy,
        role: 'Admin',
        operationType: 'UserManagement',
        description: '创建了新用户账号',
        ipAddress: '—',
        status: 'Success',
        details: `用户名: ${payload.newUsername}, 姓名: ${payload.newName}, 角色: ${payload.roles.join('、')}`,
      });
    });
    const unsubRoles = appEventBus.subscribe('USER_ROLES_UPDATED', (payload) => {
      appendLog({
        username: payload.operator,
        fullName: payload.operator,
        role: 'Admin',
        operationType: 'UserManagement',
        description: `为用户 ${payload.targetName} 分配了角色`,
        ipAddress: '—',
        status: 'Success',
        details: `用户: ${payload.targetName} (${payload.targetUsername})；角色: ${payload.newRoles.join('、')}`,
      });
    });
    return () => {
      unsubCollect();
      unsubAssign();
      unsubReview();
      unsubUserCreate();
      unsubRoles();
    };
  }, [appendLog]);

  const value = useMemo<OperationLogContextValue>(() => ({ logs, appendLog, clearLogs }), [logs, appendLog, clearLogs]);

  return <OperationLogContext.Provider value={value}>{children}</OperationLogContext.Provider>;
}

export function useOperationLogs() {
  const ctx = useContext(OperationLogContext);
  if (!ctx) throw new Error('useOperationLogs must be used within OperationLogProvider');
  return ctx;
}

