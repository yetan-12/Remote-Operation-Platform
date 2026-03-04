/**
 * Testing connection: test robot and/or GELLO independently.
 * Extensible design for robot arms, GELLO, grippers, robot hands, etc.
 */
import { useState, useEffect, useCallback } from 'react';
import { Radio, Loader2, RefreshCw, Usb, Play, Square, Cable } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DeviceStatePanel from './DeviceStatePanel';
import { DEVICE_STATE_CONFIGS } from './types';

const API_BASE = import.meta.env.VITE_TEST_API_URL || 'http://localhost:8000';
const ROBOT_STATE_POLL_INTERVAL_MS = 20;   // 0.02s real-time
const GELLO_JOINT_POLL_INTERVAL_MS = 20;   // 0.02s real-time

interface ConnectionStateParams {
  joint_positions: number[];
  joint_velocities: number[];
  ee_pos_quat: number[];
  gripper_position: number;
}

const DEFAULT_PARAMS: ConnectionStateParams = {
  joint_positions: [],
  joint_velocities: [],
  ee_pos_quat: [],
  gripper_position: 0,
};

function parseObsToStateParams(obs: Record<string, unknown>): ConnectionStateParams {
  const toArr = (v: unknown): number[] =>
    Array.isArray(v) ? v.map((x) => Number(x)) : typeof v === 'number' ? [v] : [];
  const toNum = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
  return {
    joint_positions: toArr(obs.joint_positions ?? []),
    joint_velocities: toArr(obs.joint_velocities ?? []),
    ee_pos_quat: toArr(obs.ee_pos_quat ?? []),
    gripper_position: toNum(obs.gripper_position ?? 0),
  };
}

export default function TestingConnection() {
  const [robotConnected, setRobotConnected] = useState<boolean | null>(null);
  const [gelloConnected, setGelloConnected] = useState<boolean | null>(null);
  const [robotTesting, setRobotTesting] = useState(false);
  const [gelloTesting, setGelloTesting] = useState(false);
  const [robotError, setRobotError] = useState('');
  const [gelloError, setGelloError] = useState('');
  const [robotNumDofs, setRobotNumDofs] = useState<number | null>(null);
  const [stateParams, setStateParams] = useState<ConnectionStateParams>(DEFAULT_PARAMS);

  const [robotHost, setRobotHost] = useState('127.0.0.1');
  const [robotPort, setRobotPort] = useState(6001);
  const [gelloPort, setGelloPort] = useState('COM3');
  const [detectedPorts, setDetectedPorts] = useState<string[]>([]);
  const [detectingPorts, setDetectingPorts] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [stateRefreshLoading, setStateRefreshLoading] = useState(false);
  const [gelloJointParams, setGelloJointParams] = useState<number[]>([]);
  const [gelloStateLoading, setGelloStateLoading] = useState(false);
  const [gelloStateError, setGelloStateError] = useState('');
  const [gelloIdsOption, setGelloIdsOption] = useState<'auto' | '1-7' | '1-6'>('auto');
  const [gelloScannedIds, setGelloScannedIds] = useState<number[]>([]);
  const [gelloScanning, setGelloScanning] = useState(false);

  // Robot CAN (机械臂 CAN 总线)
  const [robotCanConnected, setRobotCanConnected] = useState<boolean | null>(null);
  const [robotCanTesting, setRobotCanTesting] = useState(false);
  const [robotCanError, setRobotCanError] = useState('');
  const [robotCanChannel, setRobotCanChannel] = useState('can_follower');
  const [robotCanChannels, setRobotCanChannels] = useState<string[]>([]);
  const [robotCanDetecting, setRobotCanDetecting] = useState(false);
  const [robotCanJoints, setRobotCanJoints] = useState<number[]>([]);
  const [robotCanStateLoading, setRobotCanStateLoading] = useState(false);
  const [robotCanResetting, setRobotCanResetting] = useState(false);

  // Teleop: GELLO controls robot
  const [teleopRunning, setTeleopRunning] = useState(false);
  const [teleopStarting, setTeleopStarting] = useState(false);
  const [teleopUseCan, setTeleopUseCan] = useState(true);
  const [teleopLeaderJoints, setTeleopLeaderJoints] = useState<number[]>([]);
  const [teleopFollowerObs, setTeleopFollowerObs] = useState<Record<string, unknown>>({});
  const [teleopError, setTeleopError] = useState('');

  const fetchRobotState = useCallback(async (): Promise<Record<string, unknown> | null> => {
    try {
      const res = await fetch(
        `${API_BASE}/api/test/robot/state?host=${encodeURIComponent(robotHost)}&port=${robotPort}`
      );
      if (res.ok) return (await res.json()) as Record<string, unknown>;
    } catch {
      // ignore
    }
    return null;
  }, [robotHost, robotPort]);

  // Auto-poll robot state when connected for real-time updates
  useEffect(() => {
    if (robotConnected !== true) return;
    const t = setInterval(async () => {
      const obs = await fetchRobotState();
      if (obs) setStateParams(parseObsToStateParams(obs));
    }, ROBOT_STATE_POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [robotConnected, fetchRobotState]);

  // Auto-poll GELLO joints when we have data (real-time updates)
  const fetchGelloJointStateSilent = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/test/gello/state?port=${encodeURIComponent(gelloPort)}&ids=${encodeURIComponent(gelloIdsOption)}`
      );
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.joints) && data.joints.length > 0) {
        setGelloJointParams(data.joints);
        setGelloStateError('');
      }
    } catch {
      // ignore during background poll
    }
  }, [gelloPort, gelloIdsOption]);

  useEffect(() => {
    if (gelloJointParams.length === 0) return;
    const t = setInterval(fetchGelloJointStateSilent, GELLO_JOINT_POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [gelloJointParams.length, fetchGelloJointStateSilent]);

  // Fetch teleop state (leader GELLO + follower robot) when teleop is running
  const fetchTeleopState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/test/teleop/state`);
      if (!res.ok) return;
      const data = await res.json();
      setTeleopRunning(data.running === true);
      if (Array.isArray(data.leader_joints)) setTeleopLeaderJoints(data.leader_joints);
      if (data.follower_obs && typeof data.follower_obs === 'object') {
        setTeleopFollowerObs(data.follower_obs);
      }
      setTeleopError(data.error || '');
    } catch {
      // ignore during poll
    }
  }, []);

  useEffect(() => {
    if (!teleopRunning) return;
    const t = setInterval(fetchTeleopState, ROBOT_STATE_POLL_INTERVAL_MS);
    fetchTeleopState(); // initial fetch
    return () => clearInterval(t);
  }, [teleopRunning, fetchTeleopState]);

  const refreshRobotState = async () => {
    setStateRefreshLoading(true);
    try {
      const obs = await fetchRobotState();
      if (obs) setStateParams(parseObsToStateParams(obs));
    } finally {
      setStateRefreshLoading(false);
    }
  };

  const scanGelloIds = async () => {
    setGelloScanning(true);
    setGelloStateError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/test/gello/scan?port=${encodeURIComponent(gelloPort)}`
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.ids)) {
        setGelloScannedIds(data.ids);
        if (data.ids.length === 6) setGelloIdsOption('1-6');
        else if (data.ids.length >= 7) setGelloIdsOption('1-7');
      } else {
        setGelloScannedIds([]);
        setGelloStateError(data.error || '扫描失败');
      }
    } catch (e) {
      setGelloScannedIds([]);
      setGelloStateError(e instanceof Error ? e.message : '扫描失败');
    } finally {
      setGelloScanning(false);
    }
  };

  const fetchGelloJointState = async () => {
    setGelloStateLoading(true);
    setGelloStateError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/test/gello/state?port=${encodeURIComponent(gelloPort)}&ids=${encodeURIComponent(gelloIdsOption)}`
      );
      let data: { ok?: boolean; joints?: number[]; error?: string; detail?: string } = {};
      try {
        data = await res.json();
      } catch {
        setGelloStateError(`请求异常 (${res.status})，请确认后端已启动`);
        setGelloJointParams([]);
        return;
      }
      if (res.ok && data.ok && Array.isArray(data.joints)) {
        setGelloJointParams(data.joints);
      } else {
        setGelloJointParams([]);
        const is404 = res.status === 404;
        const msg = is404
          ? '接口未找到 (404)：请确认已重启测试后端（重新运行 npm run dev:all 或 python main.py）'
          : (data.error || (typeof data.detail === 'string' ? data.detail : '') || '读取失败');
        setGelloStateError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
    } catch (e) {
      setGelloJointParams([]);
      setGelloStateError(e instanceof Error ? e.message : '获取 GELLO 关节状态失败');
    } finally {
      setGelloStateLoading(false);
    }
  };

  const testRobot = async () => {
    setRobotTesting(true);
    setRobotError('');
    setRobotConnected(null);
    setRobotNumDofs(null);
    setStateParams(DEFAULT_PARAMS);
    try {
      const res = await fetch(`${API_BASE}/api/test/robot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: robotHost, port: robotPort }),
      });
      const data = await res.json();
      if (data.ok) {
        setRobotConnected(true);
        setRobotNumDofs(data.num_dofs ?? null);
        try {
          const obs = await fetchRobotState();
          if (obs) setStateParams(parseObsToStateParams(obs));
        } catch {
          // state optional
        }
      } else {
        setRobotConnected(false);
        setRobotError(data.error || '连接失败');
      }
    } catch (e) {
      setRobotConnected(false);
      setRobotError(e instanceof Error ? e.message : '请求失败，请确认测试后端已启动 (端口 8000)');
    } finally {
      setRobotTesting(false);
    }
  };

  const testGelloBackend = async () => {
    setGelloTesting(true);
    setGelloError('');
    setGelloConnected(null);
    try {
      const res = await fetch(`${API_BASE}/api/test/gello`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: gelloPort }),
      });
      const data = await res.json();
      if (data.ok) {
        setGelloConnected(true);
      } else {
        setGelloConnected(false);
        setGelloError(data.error || '连接失败');
      }
    } catch (e) {
      setGelloConnected(false);
      setGelloError(e instanceof Error ? e.message : '请求失败，请确认测试后端已启动');
    } finally {
      setGelloTesting(false);
    }
  };

  // CAN 通道检测
  const detectCanChannels = async () => {
    setRobotCanDetecting(true);
    setRobotCanError('');
    try {
      const res = await fetch(`${API_BASE}/api/test/robot/can/channels`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.channels)) {
        setRobotCanChannels(data.channels);
        if (data.channels.length > 0) {
          // 优先选择 can_follower
          const follower = data.channels.find((c: string) => c.includes('follower'));
          setRobotCanChannel(follower || data.channels[0]);
        } else {
          setRobotCanError('未检测到 CAN 通道');
        }
      } else {
        setRobotCanChannels([]);
        setRobotCanError(data.error || '检测 CAN 通道失败');
      }
    } catch (e) {
      setRobotCanChannels([]);
      setRobotCanError(e instanceof Error ? e.message : '请求失败，请确认测试后端已启动');
    } finally {
      setRobotCanDetecting(false);
    }
  };

  // 测试 CAN 连接
  const testRobotCan = async () => {
    setRobotCanTesting(true);
    setRobotCanError('');
    setRobotCanConnected(null);
    try {
      const res = await fetch(`${API_BASE}/api/test/robot/can`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: robotCanChannel }),
      });
      const data = await res.json();
      if (data.ok) {
        setRobotCanConnected(true);
        // 获取初始状态
        await fetchRobotCanState();
      } else {
        setRobotCanConnected(false);
        setRobotCanError(data.error || '连接失败');
      }
    } catch (e) {
      setRobotCanConnected(false);
      setRobotCanError(e instanceof Error ? e.message : '请求失败，请确认测试后端已启动');
    } finally {
      setRobotCanTesting(false);
    }
  };

  // 获取 CAN 机械臂状态
  const fetchRobotCanState = async () => {
    setRobotCanStateLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/test/robot/can/state?channel=${encodeURIComponent(robotCanChannel)}`
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.joint_positions)) {
        setRobotCanJoints(data.joint_positions);
      }
    } catch {
      // ignore
    } finally {
      setRobotCanStateLoading(false);
    }
  };

  // 机械臂复位（归零）
  const resetRobotCan = async () => {
    setRobotCanResetting(true);
    setRobotCanError('');
    try {
      const res = await fetch(`${API_BASE}/api/test/robot/can/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: robotCanChannel,
          // 不传 home_position，使用后端默认的校准归零位置
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // 复位后刷新状态 (等待2.5秒，因为复位需要2秒)
        setTimeout(() => fetchRobotCanState(), 2500);
      } else {
        setRobotCanError(data.error || '复位失败');
      }
    } catch (e) {
      setRobotCanError(e instanceof Error ? e.message : '复位请求失败');
    } finally {
      setRobotCanResetting(false);
    }
  };

  // 实时轮询 CAN 机械臂状态
  useEffect(() => {
    if (robotCanConnected !== true || robotCanJoints.length === 0) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/test/robot/can/state?channel=${encodeURIComponent(robotCanChannel)}`
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.joint_positions)) {
          setRobotCanJoints(data.joint_positions);
        }
      } catch {
        // ignore
      }
    }, ROBOT_STATE_POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [robotCanConnected, robotCanJoints.length, robotCanChannel]);

  const detectSerialPorts = async () => {
    setDetectingPorts(true);
    setGelloError('');
    try {
      const res = await fetch(`${API_BASE}/api/test/usb/identify`);
      const data = await res.json();
      setBackendAvailable(true);
      if (data.ok && Array.isArray(data.devices)) {
        const gelloDevices = data.devices.filter((d: { is_gello: boolean }) => d.is_gello);
        const allPorts = data.devices.map((d: { port: string }) => d.port);
        setDetectedPorts(allPorts);
        if (gelloDevices.length > 0) {
          setGelloPort(gelloDevices[0].port);
        } else if (allPorts.length > 0) {
          setGelloPort(allPorts[0]);
          setGelloError('未识别到 GELLO（Dynamixel 无响应），当前为全部串口，请手动选择');
        } else {
          setGelloError('未检测到串口');
        }
      } else {
        const portsRes = await fetch(`${API_BASE}/api/test/gello/ports`);
        const portsData = await portsRes.json();
        if (portsData.ok && Array.isArray(portsData.ports)) {
          setDetectedPorts(portsData.ports);
          if (portsData.ports.length > 0) setGelloPort(portsData.ports[0]);
        } else {
          setDetectedPorts([]);
          setGelloError(data.error || portsData.error || '未检测到串口');
        }
      }
    } catch {
      setBackendAvailable(false);
      setDetectedPorts([]);
      setGelloError('无法连接后端，请先启动：cd testing-connection/backend && python main.py');
    } finally {
      setDetectingPorts(false);
    }
  };

  const startTeleop = async () => {
    setTeleopStarting(true);
    setTeleopError('');
    try {
      const body: Record<string, unknown> = {
        gello_port: gelloPort,
        robot_host: robotHost,
        robot_port: robotPort,
      };
      if (teleopUseCan) {
        body.robot_can_channel = robotCanChannel;
      }
      const res = await fetch(`${API_BASE}/api/test/teleop/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTeleopRunning(true);
      } else {
        const msg = typeof data.detail === 'string' ? data.detail : data.error || '启动失败';
        setTeleopError(msg);
      }
    } catch (e) {
      setTeleopError(e instanceof Error ? e.message : '请求失败');
    } finally {
      setTeleopStarting(false);
    }
  };

  const stopTeleop = async () => {
    try {
      await fetch(`${API_BASE}/api/test/teleop/stop`, { method: 'POST' });
      setTeleopRunning(false);
      setTeleopError('');
    } catch {
      setTeleopRunning(false);
    }
  };

  const testGelloWebSerial = async () => {
    const nav = navigator as typeof navigator & {
      serial?: { requestPort: (options?: { filters?: unknown[] }) => Promise<{ open: (opts: { baudRate: number }) => Promise<void>; close: () => Promise<void> }> };
    };
    if (!nav.serial) {
      setGelloError('当前浏览器不支持 Web Serial，请使用 Chrome 或 Edge 打开本页');
      setGelloConnected(false);
      return;
    }
    // Web Serial only works in secure context (https or localhost)
    if (!window.isSecureContext) {
      setGelloError('Web Serial 仅支持安全上下文，请用 http://localhost 访问本页');
      setGelloConnected(false);
      return;
    }
    setGelloTesting(true);
    setGelloError('');
    setGelloConnected(null);
    try {
      const port = await nav.serial!.requestPort();
      await port.open({ baudRate: 57600 });
      await port.close();
      setGelloConnected(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGelloConnected(false);
      if (msg.includes('No port selected') || msg.includes('No device selected') || msg.includes('cancel')) {
        setGelloError('未选择串口：请再次点击按钮，在弹窗中选中 GELLO 对应的 COM 口后点击「连接」，不要点取消或直接关掉弹窗。若列表为空，可勾选「显示所有串口」或检查 GELLO 驱动。');
      } else if (msg.includes('Access denied') || msg.includes('Permission')) {
        setGelloError('权限被拒绝。请确认在弹窗中选择了正确的 USB 设备。');
      } else if (msg.includes('in use') || msg.includes('busy') || msg.includes('Error opening')) {
        setGelloError('串口被占用。请关闭占用 GELLO 的其他程序（如 gello_software、串口助手、Arduino IDE）后再试。');
      } else {
        setGelloError(`USB 连接失败: ${msg}`);
      }
    } finally {
      setGelloTesting(false);
    }
  };

  const hasWebSerial = typeof (navigator as unknown as { serial?: unknown }).serial !== 'undefined';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">测试连接</h1>
        <p className="text-sm text-gray-500 mb-6">
          可单独测试机械臂或 GELLO。机械臂支持 USB 直连或 ZMQ 网络；GELLO 为 USB 串口 (57600)。机械臂 USB 与 GELLO 布局一致，均可「自动检测串口」或「通过浏览器选择」。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Robot test - ZMQ */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Radio size={20} />
              机械臂 (ZMQ)
            </h2>
            <p className="text-xs text-gray-500 mb-3">网络连接，需启动 gello_software 机器人节点</p>
            <div className="space-y-2 mb-4">
              <label className="block text-sm text-gray-700">主机</label>
              <Input
                value={robotHost}
                onChange={(e) => setRobotHost(e.target.value)}
                placeholder="127.0.0.1"
                className="font-mono"
              />
              <label className="block text-sm text-gray-700">端口</label>
              <Input
                type="number"
                value={robotPort}
                onChange={(e) => setRobotPort(Number(e.target.value) || 6001)}
                placeholder="6001"
                className="font-mono"
              />
            </div>
            {robotError && (
              <p className="text-sm text-red-600 mb-2 bg-red-50 px-2 py-1 rounded">{robotError}</p>
            )}
            {robotConnected === true && (
              <p className="text-sm text-green-700 mb-2">
                已连接 {robotNumDofs != null && `· ${robotNumDofs} 自由度`}
              </p>
            )}
            <Button
              onClick={testRobot}
              disabled={robotTesting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {robotTesting ? (
                <Loader2 size={18} className="animate-spin mx-auto" />
              ) : (
                <>
                  <RefreshCw size={18} className="mr-2" />
                  测试机械臂连接
                </>
              )}
            </Button>
          </div>

          {/* Robot CAN - 机械臂 CAN 总线 (Piper) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Cable size={20} />
              机械臂 (CAN)
            </h2>
            <p className="text-xs text-gray-500 mb-3">CAN 总线直连 (Piper 机械臂)</p>
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-4">
              <strong>CAN 连接</strong>：Piper 机械臂使用 CAN 总线通信。<strong>can_follower</strong> 为从臂（跟随 GELLO），<strong>can_master</strong> 为主臂。
            </div>
            <div className="space-y-2 mb-4">
              <label className="block text-sm text-gray-700">CAN 通道</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectCanChannels}
                  disabled={robotCanDetecting}
                >
                  {robotCanDetecting ? <Loader2 size={14} className="animate-spin" /> : '检测 CAN 通道'}
                </Button>
                {robotCanChannels.length > 0 && (
                  <select
                    className="border rounded px-2 py-1.5 text-sm font-mono bg-white"
                    value={robotCanChannel}
                    onChange={(e) => setRobotCanChannel(e.target.value)}
                  >
                    {robotCanChannels.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                <Input
                  value={robotCanChannel}
                  onChange={(e) => setRobotCanChannel(e.target.value)}
                  placeholder="can_follower"
                  className="font-mono flex-1 min-w-[120px]"
                />
              </div>
            </div>
            {robotCanError && (
              <p className="text-sm text-red-600 mb-2 bg-red-50 px-2 py-1 rounded">{robotCanError}</p>
            )}
            {robotCanConnected === true && (
              <p className="text-sm text-green-700 mb-2">机械臂 CAN 已连接</p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={testRobotCan}
                disabled={robotCanTesting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {robotCanTesting ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  <>
                    <RefreshCw size={18} className="mr-2" />
                    测试 CAN 连接
                  </>
                )}
              </Button>
              {robotCanConnected === true && (
                <Button
                  onClick={fetchRobotCanState}
                  disabled={robotCanStateLoading}
                  variant="outline"
                  className="w-full"
                >
                  {robotCanStateLoading ? <Loader2 size={14} className="animate-spin" /> : '刷新关节状态'}
                </Button>
              )}
              {robotCanConnected === true && (
                <Button
                  onClick={resetRobotCan}
                  disabled={robotCanResetting}
                  variant="outline"
                  className="w-full bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700"
                >
                  {robotCanResetting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>一键复位 (归零)</>
                  )}
                </Button>
              )}
            </div>
            {robotCanJoints.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <p className="text-sm font-medium text-gray-700 mb-2">关节位置 (弧度)</p>
                <div className="font-mono text-sm space-y-1">
                  {robotCanJoints.map((v, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{i < robotCanJoints.length - 1 ? `关节${i + 1}` : '夹爪'}</span>
                      <span>{v.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* GELLO test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Usb size={20} />
              GELLO 控制器 (USB)
            </h2>
            <p className="text-xs text-gray-500 mb-3">Dynamixel 串口，默认 57600 (gello_software)</p>
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
              <strong>仅连 GELLO</strong>：<strong>通过浏览器选择 USB 设备</strong> 不需要后端。<strong>通过后端测试</strong> 需先启动后端；可用 <code className="bg-amber-100 px-1">npm run dev:all</code> 一键启动前端+测试后端（打开页面即自动带起后端）。
            </div>
            <div className="space-y-2 mb-4">
              <label className="block text-sm text-gray-700">串口（后端测试时使用）</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectSerialPorts}
                  disabled={detectingPorts}
                >
                  {detectingPorts ? <Loader2 size={14} className="animate-spin" /> : '自动检测串口'}
                </Button>
                {detectedPorts.length > 0 && (
                  <select
                    className="border rounded px-2 py-1.5 text-sm font-mono bg-white"
                    value={gelloPort}
                    onChange={(e) => setGelloPort(e.target.value)}
                  >
                    {detectedPorts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
                <Input
                  value={gelloPort}
                  onChange={(e) => setGelloPort(e.target.value)}
                  placeholder="COM3 或 /dev/ttyUSB0"
                  className="font-mono flex-1 min-w-[120px]"
                />
              </div>
              {backendAvailable === false && (
                <p className="text-xs text-amber-600">未检测到后端，仅「通过浏览器选择 USB 设备」可用</p>
              )}
            </div>
            {gelloError && (
              <p className="text-sm text-red-600 mb-2 bg-red-50 px-2 py-1 rounded">{gelloError}</p>
            )}
            {gelloConnected === true && (
              <p className="text-sm text-green-700 mb-2">串口已就绪</p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={testGelloBackend}
                disabled={gelloTesting}
                variant="outline"
                className="w-full"
              >
                {gelloTesting ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  <>通过后端测试 (指定串口)</>
                )}
              </Button>
              {hasWebSerial && (
                <>
                  <p className="text-xs text-gray-500 -mt-1">弹窗出现后请选择 GELLO 的 COM 口并点「连接」，不要取消</p>
                  <Button
                    onClick={testGelloWebSerial}
                    disabled={gelloTesting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    通过浏览器选择 USB 设备（仅连接 GELLO）
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Robot state - extensible DeviceStatePanel */}
        <div className="mb-6">
          <DeviceStatePanel
            config={{
              ...DEVICE_STATE_CONFIGS.robot_arm,
              label: '机械臂',
              jointLabels:
                stateParams.joint_positions.length > 0
                  ? stateParams.joint_positions.map((_, i) =>
                      i < stateParams.joint_positions.length - 1 ? `关节${i + 1}` : '夹爪'
                    )
                  : ['关节1', '关节2', '关节3', '关节4', '关节5', '关节6', '夹爪'],
            }}
            jointValues={stateParams.joint_positions}
            extraValues={{
              joint_velocities: stateParams.joint_velocities,
              ee_pos_quat: stateParams.ee_pos_quat,
              gripper_position: stateParams.gripper_position,
            }}
            isConnected={robotConnected === true}
            pollIntervalMs={ROBOT_STATE_POLL_INTERVAL_MS}
            onRefresh={refreshRobotState}
            isRefreshing={stateRefreshLoading}
            description={`get_observations 协议，每 ${ROBOT_STATE_POLL_INTERVAL_MS / 1000} 秒实时更新`}
          />
        </div>

        {/* GELLO connection status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Usb size={20} />
            GELLO - 连接状态
          </h2>
          <p className="text-sm text-gray-500 mb-4">USB 串口连接状态</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">连接状态</label>
              <div className="font-mono text-sm bg-gray-50 border rounded px-3 py-2 min-h-[2.5rem]">
                {gelloConnected === true ? '已连接' : gelloConnected === false ? '未连接' : '—'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前串口</label>
              <div className="font-mono text-sm bg-gray-50 border rounded px-3 py-2 min-h-[2.5rem]">
                {gelloPort || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* GELLO joint params - extensible DeviceStatePanel with real-time polling */}
        <DeviceStatePanel
          config={{ ...DEVICE_STATE_CONFIGS.gello, label: 'GELLO' }}
          jointValues={gelloJointParams}
          isConnected={gelloConnected === true || gelloJointParams.length > 0}
          pollIntervalMs={gelloJointParams.length > 0 ? GELLO_JOINT_POLL_INTERVAL_MS : 0}
          onRefresh={fetchGelloJointState}
          isRefreshing={gelloStateLoading}
          error={gelloStateError}
          description={`Dynamixel 各关节（弧度），${gelloJointParams.length > 0 ? `每 ${GELLO_JOINT_POLL_INTERVAL_MS / 1000} 秒实时更新` : '连接后点击刷新'}；可扩展机械手等设备`}
          headerActions={
            <>
              <label className="text-sm font-medium text-gray-700">ID 范围：</label>
              <select
                className="border rounded px-2 py-1.5 text-sm bg-white"
                value={gelloIdsOption}
                onChange={(e) => setGelloIdsOption((e.target.value as 'auto' | '1-7' | '1-6'))}
              >
                <option value="auto">自动</option>
                <option value="1-7">1–7</option>
                <option value="1-6">1–6</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={scanGelloIds}
                disabled={gelloScanning}
              >
                {gelloScanning ? <Loader2 size={14} className="animate-spin" /> : '扫描 ID'}
              </Button>
              {gelloScannedIds.length > 0 && (
                <span className="text-sm text-green-700">ID: {gelloScannedIds.join(', ')}</span>
              )}
            </>
          }
        />

        {/* GELLO 控制机械臂 (Teleop) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Cable size={20} />
            GELLO 控制机械臂
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            使用 GELLO 控制器作为主手 (leader)，Piper 机械臂作为从手 (follower)。通过 CAN 总线控制机械臂。
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="teleopMode"
                checked={teleopUseCan}
                onChange={() => { setTeleopUseCan(true); }}
                className="rounded"
              />
              <span className="text-sm font-medium">CAN 总线 (Piper)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="teleopMode"
                checked={!teleopUseCan}
                onChange={() => { setTeleopUseCan(false); }}
                className="rounded"
              />
              <span className="text-sm font-medium">ZMQ 模式</span>
            </label>
          </div>
          {teleopUseCan ? (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
              <strong>CAN 模式</strong>：使用 CAN 总线控制 Piper 机械臂。当前通道：<code className="bg-green-100 px-1 rounded">{robotCanChannel}</code>
              {robotCanConnected !== true && <span className="text-amber-600 ml-2">（请先在上方测试 CAN 连接）</span>}
            </div>
          ) : (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
              <strong>ZMQ 模式</strong>：需先运行 <code className="bg-amber-100 px-1 rounded">quick_run.py</code>。机械臂为 xArm(网线) 或 sim_ur(仿真)。
            </div>
          )}
          {teleopRunning && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
              遥操作运行中，GELLO 串口被占用，上方「GELLO 各关节参数」无法同时读取，此处将显示 Leader/Follower 实时数据。
            </p>
          )}
          {teleopError && (
            <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded">{teleopError}</p>
          )}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={startTeleop}
              disabled={
                teleopStarting ||
                teleopRunning ||
                (teleopUseCan && !robotCanChannel)
              }
              className="bg-green-600 hover:bg-green-700 text-white"
              title={
                teleopUseCan && !robotCanChannel
                  ? '请先检测 CAN 通道'
                  : undefined
              }
            >
              {teleopStarting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Play size={18} className="mr-2" />}
              启动 GELLO 控制
            </Button>
            <Button
              onClick={stopTeleop}
              disabled={!teleopRunning}
              variant="outline"
            >
              <Square size={18} className="mr-2" />
              停止
            </Button>
          </div>
          {teleopRunning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4 bg-amber-50/50">
                <h3 className="font-medium text-amber-800 mb-2">Leader (GELLO)</h3>
                <div className="font-mono text-sm space-y-1">
                  {(teleopLeaderJoints.length ? teleopLeaderJoints : [0, 0, 0, 0, 0, 0, 0]).map((v, i) => (
                    <div key={i} className="flex justify-between">
                      <span>关节{i + 1}</span>
                      <span>{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">每 {ROBOT_STATE_POLL_INTERVAL_MS / 1000}s 刷新</p>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <h3 className="font-medium text-blue-800 mb-2">Follower (机械臂)</h3>
                {(() => {
                  const obs = teleopFollowerObs;
                  const jp = Array.isArray(obs?.joint_positions) ? obs.joint_positions : [];
                  const gp = typeof obs?.gripper_position === 'number' ? obs.gripper_position : 0;
                  return (
                    <>
                      <div className="font-mono text-sm space-y-1">
                        {jp.map((v: number, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>关节{i + 1}</span>
                            <span>{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t mt-1 pt-1">
                          <span>夹爪</span>
                          <span>{typeof gp === 'number' ? gp.toFixed(4) : String(gp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">每 {ROBOT_STATE_POLL_INTERVAL_MS / 1000}s 刷新</p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          推荐 <code className="bg-gray-100 px-1 rounded">npm run dev:all</code> 一键启动前端与测试后端；或仅前端 <code className="bg-gray-100 px-1 rounded">npm run dev</code>，后端单独运行：<code className="bg-gray-100 px-1 rounded ml-1">cd testing-connection/backend && pip install -r requirements.txt && python main.py</code>
        </p>
      </div>
    </div>
  );
}
