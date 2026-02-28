/**
 * Reusable panel for real-time device joint/state display.
 * Supports robot arms, GELLO, grippers, robot hands, and custom manipulators.
 */
import { ReactNode } from 'react';
import { Cpu, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import type { DeviceStateConfig } from './types';

interface DeviceStatePanelProps {
  config: DeviceStateConfig;
  /** Joint values (rad or units). Length should match jointLabels or be padded. */
  jointValues: number[];
  /** Extra params: arrays or scalars */
  extraValues?: Record<string, number[] | number>;
  isConnected?: boolean;
  /** Poll interval in ms; 0 = no auto-refresh */
  pollIntervalMs?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  error?: string;
  /** Actions before refresh button (e.g. scan, id selector) */
  headerActions?: ReactNode;
  /** Description text */
  description?: string;
}

export default function DeviceStatePanel({
  config,
  jointValues,
  extraValues = {},
  isConnected,
  pollIntervalMs = 0,
  onRefresh,
  isRefreshing = false,
  error,
  headerActions,
  description,
}: DeviceStatePanelProps) {
  const labels = config.jointLabels.length > 0
    ? config.jointLabels
    : Array.from({ length: Math.max(jointValues.length, 7) }, (_, i) =>
        i < 6 ? `关节${i + 1}` : '夹爪'
      );
  const displayValues = jointValues.length > 0
    ? jointValues
    : Array(labels.length).fill(0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
        <Cpu size={20} />
        {config.label} - 各关节 / 状态参数
      </h2>
      {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {headerActions}
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span className="ml-1">刷新</span>
          </Button>
        )}
        {pollIntervalMs > 0 && (
          <span className="text-xs text-gray-500">每 {pollIntervalMs / 1000} 秒自动更新</span>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mb-2 bg-red-50 px-2 py-1 rounded">{error}</p>
      )}
      {/* Joint slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {labels.slice(0, Math.max(labels.length, displayValues.length)).map((label, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="font-mono text-sm bg-gray-50 border rounded px-3 py-2 min-h-[2.5rem]">
              {displayValues[i] != null
                ? Number(displayValues[i]).toFixed(4)
                : isConnected ? '等待数据…' : '—'}
            </div>
          </div>
        ))}
      </div>
      {/* Extra params (for robot_arm: joint_positions, ee_pos_quat, etc.) */}
      {config.extraParams && config.extraParams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          {config.extraParams.map(({ key, label: paramLabel, isArray }) => {
            const v = extraValues[key];
            const str = isArray && Array.isArray(v)
              ? `[ ${v.map((x) => Number(x).toFixed(4)).join(', ')} ]`
              : typeof v === 'number'
                ? v.toFixed(4)
                : '—';
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{paramLabel}</label>
                <div className="font-mono text-sm bg-gray-50 border rounded px-3 py-2 min-h-[2.5rem] break-all">
                  {str}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
