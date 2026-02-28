import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Check, AlertCircle, Cpu, User, Calendar, Paperclip, BarChart2, TrendingUp, Gamepad, ChevronLeft, ChevronRight, Eye, Circle, ChevronDown, Trash2, AlertOctagon, RotateCcw, Home, Move } from 'lucide-react';
import { Button } from './ui/button';
import SessionSetup from './SessionSetup';
import { roboticArmView, handCameraView } from '../assets/placeholders';
import { useDevices } from '../contexts/DevicesContext';
import { useClipAssignments, type NewClipInput } from '../contexts/ClipAssignmentsContext';
import { useAuth } from '../contexts/AuthContext';
import { createRobotSelectionStrategy } from '../strategies/robotSelection';

interface SessionInfo {
  id: string;
  status: 'active' | 'history';
  device: string;
  controller: string;
  clipCount: number;
  time?: string;
  date?: string;
}

interface ClipInfo {
  id: string;
  description: string;
  time: string;
  duration: string;
  frames: number;
}

interface DeviceInfo {
  id: string;
  name: string;
  type: 'robot' | 'controller';
  status: 'available' | 'in-use';
  category: string;
}

export default function CollectorDashboard() {
  const { devices, getRobotDevices, getControllerSubTypes, getControllerDevices } = useDevices();
  const { addCollectedClips } = useClipAssignments();
  const { currentUser } = useAuth();
  const [recordingState, setRecordingState] = useState<'idle' | 'recording'>('idle');
  const [showCoverPage, setShowCoverPage] = useState(true);
  const [showDeviceSelection, setShowDeviceSelection] = useState(true);
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  const [arm1Robot, setArm1Robot] = useState<string>('');
  const [arm1Controller, setArm1Controller] = useState<string>('');
  const [arm2Robot, setArm2Robot] = useState<string>('');
  const [arm2Controller, setArm2Controller] = useState<string>('');
  const [showClipDetail, setShowClipDetail] = useState(false);
  const [selectedClip, setSelectedClip] = useState<ClipInfo | null>(null);
  const [showHistorySessionDialog, setShowHistorySessionDialog] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<SessionInfo | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);

  const [arm1Device, setArm1Device] = useState<string>('');
  const [arm2Device, setArm2Device] = useState<string>('');
  
  // 录制流程控制状态
  const [taskPrompt, setTaskPrompt] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // 播放速度状态
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // 画中画展开状态
  const [expandedPip, setExpandedPip] = useState<string | null>(null); // null | 'left' | 'right' | 'hand' | 'both'

  // 画中画位置和大小状态
  const [pipPositions, setPipPositions] = useState<{[key: string]: {x: number, y: number}}>({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    hand: { x: 0, y: 0 }
  });
  const [pipSizes, setPipSizes] = useState<{[key: string]: {width: number, height: number}}>({
    left: { width: 0, height: 0 },
    right: { width: 0, height: 0 },
    hand: { width: 0, height: 0 }
  });
  const [draggingPip, setDraggingPip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingPip, setResizingPip] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragged, setIsDragged] = useState(false); // 标记是否进行了拖动操作
  const [isResized, setIsResized] = useState(false); // 标记是否进行了调整大小操作

  // 处理画中画点击事件（双臂模式）
  const handlePipClick = (side: 'left' | 'right') => {
    // 如果刚刚拖动过或调整过大小，不执行点击操作
    if (isDragged || isResized) {
      setIsDragged(false);
      setIsResized(false);
      return;
    }

    // 清除该画中画的自定义位置和大小，恢复到正常的 expandedPip 控制
    setPipPositions(prev => ({
      ...prev,
      [side]: { x: 0, y: 0 }
    }));
    setPipSizes(prev => ({
      ...prev,
      [side]: { width: 0, height: 0 }
    }));

    if (expandedPip === null) {
      // 没有放大 → 放大点击的这个
      setExpandedPip(side);
    } else if (expandedPip === side) {
      // 点击已放大的 → 缩小它
      setExpandedPip(null);
    } else if (expandedPip === 'both') {
      // 两个都放大 → 只保留另一个放大
      setExpandedPip(side === 'left' ? 'right' : 'left');
    } else {
      // 另一个已放大 → 两都放大
      setExpandedPip('both');
    }
  };

  // 重置画中画位置和大小
  const resetPipPosition = (pipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPipPositions(prev => ({
      ...prev,
      [pipId]: { x: 0, y: 0 }
    }));
    setPipSizes(prev => ({
      ...prev,
      [pipId]: { width: 0, height: 0 }
    }));
  };

  // 开始拖拽
  const handleDragStart = (e: React.MouseEvent, pipId: string) => {
    // 只有在点击视频本身时才拖拽，不包括按钮
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragged(false); // 开始时标记为未拖动
    setDraggingPip(pipId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // 记录当前实际大小，以便在拖动后保持固定大小
    setPipSizes(prev => ({
      ...prev,
      [pipId]: {
        width: rect.width,
        height: rect.height
      }
    }));
  };

  // 开始调整大小
  const handleResizeStart = (e: React.MouseEvent, pipId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResized(false); // 开始时标记为未调整大小
    setResizingPip(pipId);
    const rect = (e.currentTarget as HTMLElement).closest('.pip-container')?.getBoundingClientRect();
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      });
    }
  };

  // 处理鼠标移动（拖拽和调整大小）
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingPip) {
        setIsDragged(true); // 标记为已拖动
        // 使用视口坐标，允许移动到屏幕任意位置
        setPipPositions(prev => ({
          ...prev,
          [draggingPip]: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        }));
      }
      
      if (resizingPip) {
        setIsResized(true); // 标记为已调整大小
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(150, resizeStart.width + deltaX);
        const newHeight = Math.max(100, resizeStart.height + deltaY);
        
        setPipSizes(prev => ({
          ...prev,
          [resizingPip]: {
            width: newWidth,
            height: newHeight
          }
        }));
      }
    };

    const handleMouseUp = () => {
      setDraggingPip(null);
      setResizingPip(null);
    };

    if (draggingPip || resizingPip) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingPip, resizingPip, dragOffset, resizeStart]);

  // 录制计时器
  const [recordingTime, setRecordingTime] = useState<number>(0); // 秒数

  // 录制计时器效果
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Robot devices (each added in device management as 机械臂 + 单臂/双臂/新类型 + 名称)
  const availableRobots = getRobotDevices().map((d) => ({
    id: d.id,
    name: d.name,
    status: d.status,
    isDual: d.subType === 'dual',
  }));

  // Controller subTypes that have at least one device (VR / GELLOW / 手柄 / custom)
  const availableControllers = getControllerSubTypes().map((id) => ({
    id,
    name: id === 'GAMEPAD' ? '手柄' : id === 'GELLOW' ? 'GELLO' : id,
  }));

  const selectedRobot = availableRobots.find((r) => r.id === arm1Robot);
  const isDualArm = selectedRobot?.isDual ?? false;

  // Strategy Pattern: different selection logic for single vs dual arm
  const selectionStrategy = useMemo(
    () => createRobotSelectionStrategy(isDualArm, arm1Controller),
    [isDualArm, arm1Controller]
  );

  const getCurrentDeviceList = () => {
    if (!arm1Controller) return [];
    return getControllerDevices(arm1Controller);
  };

  const selectionState = {
    arm1Robot,
    arm1Controller,
    arm1Device,
    arm2Device,
  };

  const canCreateSession = () => selectionStrategy.validateSelection(selectionState);

  const currentSession: SessionInfo = {
    id: 'SE-20251217-003',
    status: 'active',
    device: 'FRANKA-01',
    controller: 'GELLOW',
    clipCount: 8,
  };

  const historySessions: SessionInfo[] = [
    {
      id: 'SE-20251217-002',
      status: 'history',
      device: 'FRANKA-01',
      controller: 'GELLOW',
      clipCount: 12,
      date: '今天',
      time: '16:23',
    },
    {
      id: 'SE-20251216-001',
      status: 'history',
      device: 'UR5-02',
      controller: '3D Mouse',
      clipCount: 23,
      date: '昨天',
      time: '15:47',
    },
  ];

  const completedClips: ClipInfo[] = [
    {
      id: 'C1225-09',
      description: '将机械臂移到至指定的置0度',
      time: '14:32',
      duration: '00:42',
      frames: 1608,
    },
    {
      id: 'C1225-07',
      description: '将夹住方形积木移至色盘上方',
      time: '14:28',
      duration: '00:35',
      frames: 21,
    },
    {
      id: 'C1225-06',
      description: '夹取摆放干磁吸组件并扫描片',
      time: '14:21',
      duration: '00:51',
      frames: 30,
    },
    {
      id: 'C1225-05',
      description: '机械臂回到初始位置',
      time: '14:15',
      duration: '00:28',
      frames: 17,
    },
    {
      id: 'C1225-04',
      description: '抓取蓝色方块放置到指定位置',
      time: '14:10',
      duration: '00:45',
      frames: 27,
    },
    {
      id: 'C1225-03',
      description: '检测并校准机械臂位置',
      time: '14:05',
      duration: '00:38',
      frames: 23,
    },
    {
      id: 'C1225-02',
      description: '打开夹爪并准备抓取',
      time: '14:00',
      duration: '00:32',
      frames: 19,
    },
    {
      id: 'C1225-01',
      description: '机械臂初始化测试',
      time: '13:55',
      duration: '00:25',
      frames: 15,
    },
  ];

  // 生成新的Clip ID（基于当前日期和序号）
  const generateClipId = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const nextNumber = String(completedClips.length + 1).padStart(2, '0');
    return `C${month}${day}-${nextNumber}`;
  };
  
  // 当前正在录制的Clip信息
  const currentClip: ClipInfo = {
    id: generateClipId(),
    description: '等待录制...',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    duration: '00:00',
    frames: 1608,
  };

  // 历史session的clips数据
  const getHistorySessionClips = (sessionId: string): ClipInfo[] => {
    if (sessionId === 'SE-20251217-002') {
      return [
        { id: 'Clip-012', description: '复位机��臂到初始位置', time: '16:20', duration: '00:38', frames: 23 },
        { id: 'Clip-011', description: '拾取红色立方并放置', time: '16:15', duration: '00:52', frames: 31 },
        { id: 'Clip-010', description: '调整夹爪角度进行抓取', time: '16:10', duration: '00:41', frames: 25 },
        { id: 'Clip-009', description: '移动到指定工作区域', time: '16:05', duration: '00:35', frames: 21 },
        { id: 'Clip-008', description: '扫描工作台上的物', time: '16:00', duration: '00:48', frames: 29 },
        { id: 'Clip-007', description: '精确定位目标位置', time: '15:55', duration: '00:33', frames: 20 },
        { id: 'Clip-006', description: '缓慢接近抓取目标', time: '15:50', duration: '00:44', frames: 26 },
        { id: 'Clip-005', description: '张开夹爪准备抓取', time: '15:45', duration: '00:29', frames: 17 },
        { id: 'Clip-004', description: '检夹爪状态', time: '15:40', duration: '00:36', frames: 22 },
        { id: 'Clip-003', description: '移动到观察点', time: '15:35', duration: '00:42', frames: 25 },
        { id: 'Clip-002', description: '校准机械臂姿态', time: '15:30', duration: '00:39', frames: 23 },
        { id: 'Clip-001', description: '机械臂系统初始化', time: '15:25', duration: '00:31', frames: 19 },
      ];
    } else if (sessionId === 'SE-20251216-001') {
      return [
        { id: 'Clip-023', description: '完成整个工作流程', time: '15:45', duration: '00:55', frames: 33 },
        { id: 'Clip-022', description: '将工具放回工具架', time: '15:40', duration: '00:47', frames: 28 },
        { id: 'Clip-021', description: '组装最后一个部件', time: '15:35', duration: '00:51', frames: 31 },
        { id: 'Clip-020', description: '精确对齐组件', time: '15:30', duration: '00:43', frames: 26 },
        { id: 'Clip-019', description: '拾取第三个部件', time: '15:25', duration: '00:39', frames: 23 },
        { id: 'Clip-018', description: '放置第二个组件', time: '15:20', duration: '00:46', frames: 28 },
        { id: 'Clip-017', description: '调整组件方向', time: '15:15', duration: '00:42', frames: 25 },
        { id: 'Clip-016', description: '抓取第二个部件', time: '15:10', duration: '00:38', frames: 23 },
        { id: 'Clip-015', description: '放置第一个组件到位', time: '15:05', duration: '00:44', frames: 26 },
        { id: 'Clip-014', description: '移动到装配位置', time: '15:00', duration: '00:40', frames: 24 },
        { id: 'Clip-013', description: '检查组完整性', time: '14:55', duration: '00:36', frames: 22 },
        { id: 'Clip-012', description: '拾取第一个组件', time: '14:50', duration: '00:48', frames: 29 },
        { id: 'Clip-011', description: '扫描���有工作部件', time: '14:45', duration: '00:52', frames: 31 },
        { id: 'Clip-010', description: '调整工作台高度', time: '14:40', duration: '00:35', frames: 21 },
        { id: 'Clip-009', description: '移动到工作起始点', time: '14:35', duration: '00:41', frames: 25 },
        { id: 'Clip-008', description: '测试夹爪力度', time: '14:30', duration: '00:33', frames: 20 },
        { id: 'Clip-007', description: '校准传感器读数', time: '14:25', duration: '00:38', frames: 23 },
        { id: 'Clip-006', description: '检测环境光照', time: '14:20', duration: '00:29', frames: 17 },
        { id: 'Clip-005', description: '设置工作区边界', time: '14:15', duration: '00:45', frames: 27 },
        { id: 'Clip-004', description: '测试关节活动范围', time: '14:10', duration: '00:42', frames: 25 },
        { id: 'Clip-003', description: '校准各轴位置', time: '14:05', duration: '00:37', frames: 22 },
        { id: 'Clip-002', description: '运行统自检', time: '14:00', duration: '00:40', frames: 24 },
        { id: 'Clip-001', description: '机械臂上电初始化', time: '13:55', duration: '00:34', frames: 20 },
      ];
    }
    return [];
  };

  // 禁用背景滚动
  useEffect(() => {
    if (showHistorySessionDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showHistorySessionDialog]);

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* 设备选择页面 */}
      {showCoverPage && showDeviceSelection && !showSessionSetup && (
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden p-4 flex items-center justify-center">
          <div className="max-w-6xl w-full mx-auto h-full flex flex-col justify-center py-2">
            {/* 标题 */}
            <div className="text-center mb-2 md:mb-3 flex-shrink-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                设备配置
              </h1>
              <p className="text-xs text-gray-600">
                请选择机械臂和控制器
              </p>
            </div>

            {/* 配置内容区域 */}
            <div className="flex-1 overflow-y-auto px-1 min-h-0">
              {/* 机械臂配置 */}
              <div className="mb-3 md:mb-4">
                <h2 className="text-xs md:text-sm font-semibold text-gray-900 mb-1.5">
                  机械臂选择
                </h2>
                
                {/* 机械臂选择 */}
                <div className="mb-2 md:mb-3">
                  <h3 className="text-xs font-medium text-gray-700 mb-1">选择机械臂类型</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 md:gap-2">
                    {availableRobots.map((robot) => (
                      <button
                        key={robot.id}
                        onClick={() => robot.status === 'available' && setArm1Robot(robot.id)}
                        disabled={robot.status === 'in-use'}
                        className={`group relative bg-white rounded-lg p-1.5 md:p-2 border-2 transition-all duration-300 ${
                          robot.status === 'in-use'
                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                            : arm1Robot === robot.id
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 md:w-10 md:h-10 mb-1 rounded-full flex items-center justify-center ${
                            robot.status === 'in-use'
                              ? 'bg-gray-100'
                              : arm1Robot === robot.id
                              ? 'bg-blue-500'
                              : 'bg-gray-100 group-hover:bg-blue-100'
                          }`}>
                            {robot.isDual ? (
                              <div className="flex items-center gap-0.5">
                                <Cpu size={12} className={`${
                                  robot.status === 'in-use'
                                    ? 'text-gray-400'
                                    : arm1Robot === robot.id
                                    ? 'text-white'
                                    : 'text-gray-600 group-hover:text-blue-600'
                                }`} />
                                <Cpu size={12} className={`${
                                  robot.status === 'in-use'
                                    ? 'text-gray-400'
                                    : arm1Robot === robot.id
                                    ? 'text-white'
                                    : 'text-gray-600 group-hover:text-blue-600'
                                }`} />
                              </div>
                            ) : (
                              <Cpu size={16} className={`md:w-5 md:h-5 ${
                                robot.status === 'in-use'
                                  ? 'text-gray-400'
                                  : arm1Robot === robot.id
                                  ? 'text-white'
                                  : 'text-gray-600 group-hover:text-blue-600'
                              }`} />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-0.5 text-xs">{robot.name}</h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            robot.status === 'in-use'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {robot.status === 'in-use' ? '使用中' : '空闲'}
                          </span>
                        </div>
                        {arm1Robot === robot.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
              </div>

                {/* 控制器选择 */}
                {arm1Robot && (
                <div>
                  <h3 className="text-xs font-medium text-gray-700 mb-1">选择控制方式</h3>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {availableControllers.map((controller) => (
                      <button
                        key={controller.id}
                        onClick={() => {
                          setArm1Controller(controller.id);
                          // 切换控制器时清空设备选择
                          setArm1Device('');
                          setArm2Device('');
                        }}
                        className={`group relative bg-white rounded-lg p-1.5 md:p-2 border-2 transition-all duration-300 ${
                          arm1Controller === controller.id
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-green-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 md:w-10 md:h-10 mb-1 rounded-full flex items-center justify-center ${
                            arm1Controller === controller.id
                              ? 'bg-green-500'
                              : 'bg-gray-100 group-hover:bg-green-100'
                          }`}>
                            <Gamepad size={16} className={`md:w-5 md:h-5 ${
                              arm1Controller === controller.id
                                ? 'text-white'
                                : 'text-gray-600 group-hover:text-green-600'
                            }`} />
                          </div>
                          <h4 className="font-semibold text-gray-900 text-xs">{controller.name}</h4>
                        </div>
                        {arm1Controller === controller.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* 设备选择（选择控制器后显示） */}
                {arm1Robot && arm1Controller && (
                <div className="mt-3">
                  {!selectionStrategy.requiresDualDeviceSelection ? (
                    // 单臂系统 或 双臂+VR/GELLOW：只显示一行设备选择（VR和GELLOW本身支持双手）
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-1">选择设备</h3>
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                        {getCurrentDeviceList().map((device) => (
                          <button
                            key={device.id}
                            onClick={() => device.status === 'available' && setArm1Device(device.id)}
                            disabled={device.status === 'in-use'}
                            className={`group relative bg-white rounded-lg p-1.5 md:p-2 border-2 transition-all duration-300 ${
                              device.status === 'in-use'
                                ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                : arm1Device === device.id
                                ? 'border-purple-500 bg-purple-50 shadow-lg'
                                : 'border-gray-200 hover:border-purple-400 hover:shadow-md'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 md:w-10 md:h-10 mb-1 rounded-full flex items-center justify-center ${
                                device.status === 'in-use'
                                  ? 'bg-gray-100'
                                  : arm1Device === device.id
                                  ? 'bg-purple-500'
                                  : 'bg-gray-100 group-hover:bg-purple-100'
                              }`}>
                                <Gamepad size={16} className={`md:w-5 md:h-5 ${
                                  device.status === 'in-use'
                                    ? 'text-gray-400'
                                    : arm1Device === device.id
                                    ? 'text-white'
                                    : 'text-gray-600 group-hover:text-purple-600'
                                }`} />
                              </div>
                              <h4 className="font-semibold text-gray-900 text-xs">{device.name}</h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                device.status === 'in-use'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {device.status === 'in-use' ? '使用中' : '空闲'}
                              </span>
                            </div>
                            {arm1Device === device.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                <Check size={10} className="text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // 双臂系统+手柄：显示左臂和右臂两行设备选择
                    <div className="space-y-3">
                      {/* 左臂设备选择 */}
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-700 mb-2">左臂手柄</h3>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {getCurrentDeviceList().map((device) => (
                            <button
                              key={device.id}
                              onClick={() => device.status === 'available' && device.id !== arm2Device && setArm1Device(device.id)}
                              disabled={device.status === 'in-use' || device.id === arm2Device}
                              className={`group relative bg-white rounded-lg p-1.5 md:p-2 border-2 transition-all duration-300 ${
                                device.status === 'in-use' || device.id === arm2Device
                                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                  : arm1Device === device.id
                                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                                  : 'border-gray-200 hover:border-purple-400 hover:shadow-md'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 md:w-10 md:h-10 mb-1 rounded-full flex items-center justify-center ${
                                  device.status === 'in-use' || device.id === arm2Device
                                    ? 'bg-gray-100'
                                    : arm1Device === device.id
                                    ? 'bg-purple-500'
                                    : 'bg-gray-100 group-hover:bg-purple-100'
                                }`}>
                                  <Gamepad size={14} className={`${
                                    device.status === 'in-use' || device.id === arm2Device
                                      ? 'text-gray-400'
                                      : arm1Device === device.id
                                      ? 'text-white'
                                      : 'text-gray-600 group-hover:text-purple-600'
                                  }`} />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-xs">{device.name}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  device.status === 'in-use' || device.id === arm2Device
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {device.status === 'in-use' ? '使用中' : device.id === arm2Device ? '已选' : '空闲'}
                                </span>
                              </div>
                              {arm1Device === device.id && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 右臂设备选择 */}
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h3 className="text-xs font-medium text-gray-700 mb-2">右臂手柄</h3>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {getCurrentDeviceList().map((device) => (
                            <button
                              key={device.id}
                              onClick={() => device.status === 'available' && device.id !== arm1Device && setArm2Device(device.id)}
                              disabled={device.status === 'in-use' || device.id === arm1Device}
                              className={`group relative bg-white rounded-lg p-1.5 md:p-2 border-2 transition-all duration-300 ${
                                device.status === 'in-use' || device.id === arm1Device
                                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                                  : arm2Device === device.id
                                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                  : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 md:w-10 md:h-10 mb-1 rounded-full flex items-center justify-center ${
                                  device.status === 'in-use' || device.id === arm1Device
                                    ? 'bg-gray-100'
                                    : arm2Device === device.id
                                    ? 'bg-indigo-500'
                                    : 'bg-gray-100 group-hover:bg-indigo-100'
                                }`}>
                                  <Gamepad size={14} className={`${
                                    device.status === 'in-use' || device.id === arm1Device
                                      ? 'text-gray-400'
                                      : arm2Device === device.id
                                      ? 'text-white'
                                      : 'text-gray-600 group-hover:text-indigo-600'
                                  }`} />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-xs">{device.name}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  device.status === 'in-use' || device.id === arm1Device
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {device.status === 'in-use' ? '使用中' : device.id === arm1Device ? '已选' : '空闲'}
                                </span>
                              </div>
                              {arm2Device === device.id && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-center gap-3 mt-2 md:mt-3 flex-shrink-0">
              <Button
                onClick={() => {
                  setArm1Robot('');
                  setArm1Controller('');
                  setArm1Device('');
                  setArm2Device('');
                }}
                className="px-4 md:px-6 py-1.5 md:py-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-medium text-sm"
              >
                重置
              </Button>
              <Button
                onClick={() => {
                  setShowDeviceSelection(false);
                  setShowSessionSetup(true);
                }}
                disabled={!canCreateSession()}
                className={`px-4 md:px-6 py-1.5 md:py-2 rounded-lg font-medium text-sm ${
                  canCreateSession()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                下一步
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session 设置页面 */}
      {showSessionSetup && (
        <SessionSetup
          onBack={() => {
            setShowSessionSetup(false);
            setShowDeviceSelection(true);
            // 返回到设备选择页面，保留showCoverPage为true
          }}
          onProceed={(prompt: string) => {
            setTaskPrompt(prompt);
            setIsReady(true);
            setShowSessionSetup(false);
            setShowCoverPage(false);
          }}
          clipInfo={{
            clipId: currentClip.id,
            ...selectionStrategy.buildSessionPayload(selectionState),
          }}
        />
      )}

      {/* 主采集界面 */}
      {!showCoverPage && !showSessionSetup && (
        <>
      {/* 历史Session的Clips列表弹窗 */}
      {showHistorySessionDialog && selectedHistorySession && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {/* 弹窗标题 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedHistorySession.id} - Clips表</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Cpu size={14} className="text-blue-600" />
                    <span>{selectedHistorySession.device}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Gamepad size={14} className="text-blue-600" />
                    <span>{selectedHistorySession.controller}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <BarChart2 size={14} className="text-blue-600" />
                    <span>{selectedHistorySession.clipCount} 条Clips</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHistorySessionDialog(false);
                  setSelectedHistorySession(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div 
              className="overflow-y-scroll px-6 py-5" 
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#cbd5e1 #f1f5f9',
                maxHeight: '560px'
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                {getHistorySessionClips(selectedHistorySession.id).map((clip) => (
                  <div
                    key={clip.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    onClick={() => {
                      setSelectedClip(clip);
                      setIsFromHistory(true);
                      setShowClipDetail(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{clip.id}</span>
                      <span className="text-xs text-gray-500">{clip.duration}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{clip.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{clip.time}</span>
                      <span className="text-xs text-gray-500">{clip.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 弹窗底部操作按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                采集时间: {selectedHistorySession.date} {selectedHistorySession.time}
              </div>
              <Button
                onClick={() => {
                  setShowHistorySessionDialog(false);
                  setSelectedHistorySession(null);
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clip详情弹窗 */}
      {showClipDetail && selectedClip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* 弹窗标题 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedClip.id} - 详细信息</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedClip.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowClipDetail(false);
                  setSelectedClip(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
              {/* 摄���头视图 - 画中画模式 */}
              <div className="relative mb-4" style={{ height: 'calc(75vh - 180px)' }}>
                {/* 主摄像头 - 全屏显示 */}
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg w-full h-full">
                  <img
                    src={roboticArmView}
                    alt="Clip回放"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Play size={14} />
                        <span>主摄像头</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm">
                        {selectedClip.duration}
                      </div>
                    </div>
                  </div>

                  {/* 画中画 - 根据模式显示不同的摄像头 */}
                  {isDualArm ? (
                    <>
                      {/* 左臂画中画 */}
                      <div 
                        className={`absolute transition-all duration-300 bg-black rounded-lg overflow-hidden shadow-xl cursor-pointer border-2 border-white/20 hover:border-white/40 ${
                          expandedPip === 'both' 
                            ? 'bottom-4 right-[calc(33.33%+2rem)]'
                            : 'bottom-4 right-4'
                        }`}
                        style={{
                          width: (expandedPip === 'left' || expandedPip === 'both') ? '33.33%' : '16.67%',
                          aspectRatio: '4/3',
                          ...(expandedPip === null && { transform: 'translateY(calc(-100% - 0.5rem))' }),
                          ...(expandedPip === 'right' && { transform: 'translateY(calc(-200% - 1rem))' })
                        }}
                        onClick={() => handlePipClick('left')}
                      >
                        <img
                          src={handCameraView}
                          alt="左臂视角"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-white text-xs font-medium">左臂视角</div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1 rounded">
                          <Maximize2 size={12} />
                        </div>
                      </div>

                      {/* 右臂画中画 */}
                      <div 
                        className={`absolute transition-all duration-300 bg-black rounded-lg overflow-hidden shadow-xl cursor-pointer border-2 border-white/20 hover:border-white/40 bottom-4 right-4`}
                        style={{
                          width: (expandedPip === 'right' || expandedPip === 'both') ? '33.33%' : '16.67%',
                          aspectRatio: '4/3',
                          ...(expandedPip === 'left' && { transform: 'translateY(calc(-200% - 1rem))' })
                        }}
                        onClick={() => handlePipClick('right')}
                      >
                        <img
                          src={handCameraView}
                          alt="右臂视角"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-white text-xs font-medium">右臂视角</div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1 rounded">
                          <Maximize2 size={12} />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* 单臂模式 - 手部姿态画中画 */
                    <div 
                      className={`absolute transition-all duration-300 bg-black rounded-lg overflow-hidden shadow-xl cursor-pointer border-2 border-white/20 hover:border-white/40 bottom-4 right-4`}
                      style={{
                        width: expandedPip === 'hand' ? '33.33%' : '16.67%',
                        aspectRatio: '4/3'
                      }}
                      onClick={() => setExpandedPip(expandedPip === 'hand' ? null : 'hand')}
                    >
                      <img
                        src={handCameraView}
                        alt="右臂视角"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="text-white text-xs font-medium">手部摄像头</div>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1 rounded">
                        <Maximize2 size={12} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 弹窗底部操作按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  onClick={() => {
                    console.log('播放Clip:', selectedClip.id);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-2"
                >
                  <Play size={16} />
                  播放
                </Button>
                
                {/* 视频进度条 */}
                <div className="flex-1 max-w-md flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative" style={{ overflow: 'visible' }}>
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(1024 / 1608) * 100}%` }}
                    />
                    {/* 关键帧标记 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // 跳转到关键帧位置（假设关键帧在50%位置，即804帧）
                        console.log('跳转到关键帧: 804');
                      }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 hover:scale-110 transition-transform cursor-pointer z-10"
                      style={{ pointerEvents: 'auto' }}
                      title="关键帧 (804帧)"
                    >
                      {/* 向下箭头 */}
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg" />
                        <div className="w-1.5 h-2.5 bg-gradient-to-b from-orange-500 to-orange-600 -mt-0.5 drop-shadow-lg rounded-b-sm" />
                      </div>
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-medium min-w-[80px]">
                    1024 / 1608 帧
                  </span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                  </select>
                </div>
                
                <div className="text-xs text-gray-500">
                  录制于 {selectedClip.time}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setShowClipDetail(false);
                    setSelectedClip(null);
                    setIsFromHistory(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md"
                >
                  返回
                </Button>
                {!isFromHistory && (
                  <Button
                    onClick={() => {
                      console.log('删除Clip:', selectedClip.id);
                      setShowClipDetail(false);
                      setSelectedClip(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                  >
                    删除此Clip
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部控制栏 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            {/* 左侧：急停和复位按钮 */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setArm1Robot('');
                  setArm1Controller('');
                  setArm2Robot('');
                  setArm2Controller('');
                  setShowCoverPage(true);
                  setRecordingState('idle');
                  setIsReady(false);
                  setTaskPrompt('');
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all"
              >
                <X size={18} />
                <span>返回选择设备</span>
              </Button>
              
            </div>
          </div>
        </div>

        {/* 主视图区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="h-full flex gap-4">
            {/* 左侧：摄像头显示区域 - 画中画模式（占3/5） */}
            <div className="relative flex-[3] camera-container" style={{ height: 'calc(100vh - 200px)' }}>
              {/* 主摄像头 - 全屏显示 */}
              <div className="relative bg-black rounded-xl overflow-hidden shadow-lg w-full h-full">
                <img
                  src={roboticArmView}
                  alt="主摄像头"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      <span>主摄像头</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm">
                      <span>1080p 30fps</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="bg-black/50 backdrop-blur-md hover:bg-black/70 text-white p-2 rounded-lg transition-all">
                    <Eye size={18} />
                  </button>
                  <button className="bg-black/50 backdrop-blur-md hover:bg-black/70 text-white p-2 rounded-lg transition-all">
                    <Maximize2 size={18} />
                  </button>
                </div>

                {/* 画中画 - 根据模式显示不同的摄像头 */}
                {isDualArm ? (
                  <>
                    {/* 左臂画中画 */}
                    <div 
                      className={`pip-container bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/40 ${
                        draggingPip === 'left' ? 'cursor-grabbing' : 'cursor-grab'
                      } ${
                        pipPositions.left.x === 0 && pipPositions.left.y === 0 
                          ? 'absolute ' + (
                              (expandedPip === 'both' && pipPositions.right.x === 0 && pipPositions.right.y === 0)
                                ? 'bottom-4 left-4'
                                : 'bottom-4 right-4'
                            )
                          : 'fixed'
                      }`}
                      style={{
                        width: pipSizes.left.width > 0 ? `${pipSizes.left.width}px` : (expandedPip === 'left' || expandedPip === 'both') ? '33.33%' : '16.67%',
                        height: pipSizes.left.height > 0 ? `${pipSizes.left.height}px` : undefined,
                        aspectRatio: pipSizes.left.height > 0 ? undefined : '4/3',
                        ...(pipPositions.left.x !== 0 || pipPositions.left.y !== 0 
                          ? { left: `${pipPositions.left.x}px`, top: `${pipPositions.left.y}px`, zIndex: 1000 }
                          : {
                              ...(expandedPip === null && pipPositions.right.x === 0 && pipPositions.right.y === 0 && { transform: 'translateY(calc(-100% - 0.5rem))' }),
                              ...(expandedPip === 'right' && pipPositions.right.x === 0 && pipPositions.right.y === 0 && { transform: 'translateY(calc(-200% - 1rem))' })
                            }
                        ),
                        transition: draggingPip === 'left' || resizingPip === 'left' ? 'none' : 'all 300ms'
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'left')}
                      onClick={() => handlePipClick('left')}
                    >
                      <img
                        src={handCameraView}
                        alt="左臂视角"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                        <div className="text-white text-xs font-medium flex items-center gap-1">
                          <Move size={12} />
                          左臂视角
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button 
                          className="bg-black/50 backdrop-blur-md text-white p-1 rounded hover:bg-black/70 transition-colors"
                          onClick={(e) => resetPipPosition('left', e)}
                          title="重置位置"
                        >
                          <Home size={12} />
                        </button>
                        <div className="bg-black/50 backdrop-blur-md text-white p-1 rounded pointer-events-none">
                          <Maximize2 size={12} />
                        </div>
                      </div>
                      {/* 调整大小手柄 */}
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                        style={{
                          background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.5) 100%)'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                      />
                    </div>

                    {/* 右臂画中画 */}
                    <div 
                      className={`pip-container bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/40 ${
                        draggingPip === 'right' ? 'cursor-grabbing' : 'cursor-grab'
                      } ${
                        pipPositions.right.x === 0 && pipPositions.right.y === 0 
                          ? 'absolute bottom-4 right-4'
                          : 'fixed'
                      }`}
                      style={{
                        width: pipSizes.right.width > 0 ? `${pipSizes.right.width}px` : (expandedPip === 'right' || expandedPip === 'both') ? '33.33%' : '16.67%',
                        height: pipSizes.right.height > 0 ? `${pipSizes.right.height}px` : undefined,
                        aspectRatio: pipSizes.right.height > 0 ? undefined : '4/3',
                        ...(pipPositions.right.x !== 0 || pipPositions.right.y !== 0 
                          ? { left: `${pipPositions.right.x}px`, top: `${pipPositions.right.y}px`, zIndex: 1000 }
                          : {
                              ...(expandedPip === 'left' && pipPositions.left.x === 0 && pipPositions.left.y === 0 && { transform: 'translateY(calc(-200% - 1rem))' })
                            }
                        ),
                        transition: draggingPip === 'right' || resizingPip === 'right' ? 'none' : 'all 300ms'
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'right')}
                      onClick={() => handlePipClick('right')}
                    >
                      <img
                        src={handCameraView}
                        alt="右臂视角"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                        <div className="text-white text-xs font-medium flex items-center gap-1">
                          <Move size={12} />
                          右臂视角
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button 
                          className="bg-black/50 backdrop-blur-md text-white p-1 rounded hover:bg-black/70 transition-colors"
                          onClick={(e) => resetPipPosition('right', e)}
                          title="重置位置"
                        >
                          <Home size={12} />
                        </button>
                        <div className="bg-black/50 backdrop-blur-md text-white p-1 rounded pointer-events-none">
                          <Maximize2 size={12} />
                        </div>
                      </div>
                      {/* 调整大小手柄 */}
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                        style={{
                          background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.5) 100%)'
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                      />
                    </div>
                  </>
                ) : (
                  /* 单臂模式 - 手部姿态画中画 */
                  <div 
                    className={`pip-container bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/40 ${
                      draggingPip === 'hand' ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      pipPositions.hand.x === 0 && pipPositions.hand.y === 0 
                        ? 'absolute bottom-4 right-4'
                        : 'fixed'
                    }`}
                    style={{
                      width: pipSizes.hand.width > 0 ? `${pipSizes.hand.width}px` : expandedPip === 'hand' ? '33.33%' : '16.67%',
                      height: pipSizes.hand.height > 0 ? `${pipSizes.hand.height}px` : undefined,
                      aspectRatio: pipSizes.hand.height > 0 ? undefined : '4/3',
                      ...(pipPositions.hand.x !== 0 || pipPositions.hand.y !== 0 
                        ? { left: `${pipPositions.hand.x}px`, top: `${pipPositions.hand.y}px`, zIndex: 1000 }
                        : {}
                      ),
                      transition: draggingPip === 'hand' || resizingPip === 'hand' ? 'none' : 'all 300ms'
                    }}
                    onMouseDown={(e) => handleDragStart(e, 'hand')}
                    onClick={() => {
                      // 如果刚刚拖动过或调整过大小，不执行点击操作
                      if (isDragged || isResized) {
                        setIsDragged(false);
                        setIsResized(false);
                        return;
                      }

                      // 清除自定义位置和大小，恢复到正常的 expandedPip 控制
                      setPipPositions(prev => ({
                        ...prev,
                        hand: { x: 0, y: 0 }
                      }));
                      setPipSizes(prev => ({
                        ...prev,
                        hand: { width: 0, height: 0 }
                      }));
                      setExpandedPip(expandedPip === 'hand' ? null : 'hand');
                    }}
                  >
                    <img
                      src={handCameraView}
                      alt="手部姿态"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                      <div className="text-white text-xs font-medium flex items-center gap-1">
                        <Move size={12} />
                        手部摄像头
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        className="bg-black/50 backdrop-blur-md text-white p-1 rounded hover:bg-black/70 transition-colors"
                        onClick={(e) => resetPipPosition('hand', e)}
                        title="重置位置"
                      >
                        <Home size={12} />
                      </button>
                      <div className="bg-black/50 backdrop-blur-md text-white p-1 rounded pointer-events-none">
                        <Maximize2 size={12} />
                      </div>
                    </div>
                    {/* 调整大小手柄 */}
                    <div 
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                      style={{
                        background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.5) 100%)'
                      }}
                      onMouseDown={(e) => handleResizeStart(e, 'hand')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：录制计时器和控制区域（占2/5） */}
            <div className="flex-[2] flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* 顶部按钮区域 */}
              <div className="flex items-center justify-between mb-4">
                {/* 左上角：一键复位 */}
                <Button
                  onClick={() => {
                    console.log('一键复位触发');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-all"
                >
                  <RotateCcw size={18} />
                  <span>一键复位</span>
                </Button>

                {/* 右上角：急停 */}
                <Button
                  onClick={() => {
                    console.log('急停触发');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                  <AlertOctagon size={20} />
                  <span>一键急停</span>
                </Button>
              </div>

              {/* 计时器显示 */}
              <div className="flex-1 bg-white rounded-xl border-2 border-gray-200 shadow-lg flex flex-col items-center justify-center p-8">
                {/* 计时器 */}
                {recordingState === 'idle' ? (
                  // 未录制状态：显示圆形按钮
                  <button
                    onClick={() => setRecordingState('recording')}
                    className="w-64 h-64 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center group"
                  >
                    <div className="text-center">
                      <Play size={48} className="mx-auto mb-3 group-hover:scale-105 transition-transform" />
                      <div className="text-xl font-medium">准备开始录制</div>
                    </div>
                  </button>
                ) : (
                  // 录制状态：显示计时器（可点击停止）
                  <button
                    onClick={() => setRecordingState('idle')}
                    className="w-64 h-64 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center group relative"
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-mono font-bold tracking-wider">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[2rem] text-xl font-medium text-white/80">
                      停止录制
                    </div>
                  </button>
                )}
              </div>

              {/* 底部按钮区域 */}
              <div className="mt-4 flex items-center justify-between gap-4">
                {/* 左下角：丢弃重采 */}
                <Button
                  onClick={() => {
                    setRecordingState('idle');
                    setRecordingTime(0);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                  <span>丢弃重采</span>
                </Button>

                {/* 右下角：完成采集 */}
                <Button
                  onClick={() => {
                    // Build new clip for data platform (decoupled: only push to ClipAssignmentsContext)
                    const clipId = `C-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                    const mins = Math.floor(recordingTime / 60);
                    const secs = recordingTime % 60;
                    const duration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id;
                    const primaryDevice = arm1Device ? deviceName(arm1Device) : arm2Device ? deviceName(arm2Device) : '—';
                    const newClip: NewClipInput = {
                      id: clipId,
                      description: taskPrompt?.trim() || '采集任务',
                      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
                      duration,
                      frames: Math.round(recordingTime * 30),
                      sessionId: `SE-${Date.now()}`,
                      collector: currentUser?.name ?? '采集员',
                      device: primaryDevice,
                    };
                    addCollectedClips([newClip]);
                    // Return to SessionSetup, keep device/mode config
                    setRecordingState('idle');
                    setRecordingTime(0);
                    setTaskPrompt('');
                    setIsReady(false);
                    setShowSessionSetup(true);
                    setShowCoverPage(false);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all hover:shadow-lg"
                  disabled={recordingTime === 0}
                >
                  <Check size={20} />
                  <span>完成采集</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}