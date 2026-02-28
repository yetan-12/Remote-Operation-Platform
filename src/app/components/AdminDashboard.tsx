import { useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp, LayoutList, LayoutGrid, X, Database, FileText, Settings, AlertCircle, Cpu, Gamepad, BarChart2, Play, Maximize2, Eye, Circle, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import type { User } from '../App';
import DateRangePicker from './DateRangePicker';
import { roboticArmView, handCameraView } from '../assets/placeholders';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showExportDataModal, setShowExportDataModal] = useState(false);
  const [exportDataRange, setExportDataRange] = useState<'all' | 'selected' | 'filtered'>('filtered');
  const [exportDataFormat, setExportDataFormat] = useState<'json' | 'csv'>('json');
  
  // 日期范围筛选状态
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Clip管理相关状态
  const [showClipManageModal, setShowClipManageModal] = useState(false);
  const [clipManageAction, setClipManageAction] = useState<'view' | 'assign' | 'disable' | null>(null);
  const [selectedClip, setSelectedClip] = useState<ClipInfo | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [assignNote, setAssignNote] = useState('');
  
  // Clip详情相关状态
  const [showClipDetail, setShowClipDetail] = useState(false);
  
  // 姿态数据展开状态和播放速度
  const [showClipRobotData, setShowClipRobotData] = useState(true);
  const [showClipControllerData, setShowClipControllerData] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  


  // Clip数据接口
  interface ClipInfo {
    id: string;
    description: string;
    time: string;
    duration: string;
    frames: number;
    sessionId: string;
    collector: string;
    device: string;
    status: 'Pending' | 'Assigned' | 'Finished' | 'Disabled';
  }

  // 获取所有Clips数据（聚合所有Session的Clips）
  const getAllClips = (): ClipInfo[] => {
    const allClips: ClipInfo[] = [];
    
    // Session 1: SE-20251217-003
    const clips1 = [
      { id: 'C1217-08', description: '将机械臂移到至指定的置0度', time: '2025-12-17 10:32', duration: '00:42', frames: 24, sessionId: 'SE-20251217-003', collector: '张研究员', device: 'FRANKA-01', status: 'Pending' as const },
      { id: 'C1217-07', description: '将夹住方形积木移至色盘上方', time: '2025-12-17 10:28', duration: '00:35', frames: 21, sessionId: 'SE-20251217-003', collector: '张研究员', device: 'FRANKA-01', status: 'Pending' as const },
      { id: 'C1217-06', description: '夹取摆放干磁吸组件并扫描片', time: '2025-12-17 10:25', duration: '00:51', frames: 30, sessionId: 'SE-20251217-003', collector: '张研究员', device: 'FRANKA-01', status: 'Pending' as const },
      { id: 'C1217-05', description: '机械臂回到初始位置', time: '2025-12-17 10:20', duration: '00:28', frames: 17, sessionId: 'SE-20251217-003', collector: '张研究员', device: 'FRANKA-01', status: 'Pending' as const },
      { id: 'C1217-04', description: '抓取蓝色方块放置到指定位置', time: '2025-12-17 10:15', duration: '00:45', frames: 27, sessionId: 'SE-20251217-003', collector: '张研究员', device: 'FRANKA-01', status: 'Pending' as const },
    ];
    
    // Session 2: SE-20251216-058
    const clips2 = [
      { id: 'C1216-20', description: '复位机械臂到初始位置', time: '2025-12-16 16:20', duration: '00:38', frames: 23, sessionId: 'SE-20251216-058', collector: '王工程师', device: 'UR5-02', status: 'Assigned' as const },
      { id: 'C1216-19', description: '拾取红色立方体并放置', time: '2025-12-16 16:15', duration: '00:52', frames: 31, sessionId: 'SE-20251216-058', collector: '王工程师', device: 'UR5-02', status: 'Assigned' as const },
      { id: 'C1216-18', description: '调整夹爪角度进行抓取', time: '2025-12-16 16:10', duration: '00:41', frames: 25, sessionId: 'SE-20251216-058', collector: '王工程师', device: 'UR5-02', status: 'Assigned' as const },
    ];
    
    // Session 3: SE-20251216-042
    const clips3 = [
      { id: 'C1216-35', description: '完成任务并复位', time: '2025-12-16 09:50', duration: '00:55', frames: 33, sessionId: 'SE-20251216-042', collector: '张研究员', device: 'FRANKA-01', status: 'Finished' as const },
      { id: 'C1216-34', description: '放置最后一个部件', time: '2025-12-16 09:45', duration: '00:47', frames: 28, sessionId: 'SE-20251216-042', collector: '张研究员', device: 'FRANKA-01', status: 'Finished' as const },
    ];
    
    // Session 4: SE-20251215-022
    const clips4 = [
      { id: 'C1215-45', description: '完成清理工作', time: '2025-12-15 14:35', duration: '00:45', frames: 27, sessionId: 'SE-20251215-022', collector: '王工程师', device: 'UR5-02', status: 'Disabled' as const },
      { id: 'C1215-44', description: '测试夹爪功能', time: '2025-12-15 14:30', duration: '00:38', frames: 23, sessionId: 'SE-20251215-022', collector: '王工程师', device: 'UR5-02', status: 'Disabled' as const },
    ];
    
    allClips.push(...clips1, ...clips2, ...clips3, ...clips4);
    return allClips;
  };

  // 获取所有Clips
  const clips = getAllClips();

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Assigned: 'bg-blue-100 text-blue-700',
      Finished: 'bg-green-100 text-green-700',
      Disabled: 'bg-gray-100 text-gray-500',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts = {
      Pending: '待标注',
      Assigned: '已分配',
      Finished: '标注完成',
      Disabled: '已禁用',
    };
    return texts[status as keyof typeof texts] || status;
  };

  // 生成趋势数据
  const generateTrendData = (param: string) => {
    const data = [];
    const totalFrames = 148;
    for (let i = 0; i < totalFrames; i++) {
      let value = 0;
      switch (param) {
        case 'robotX':
          value = -12.3 + Math.sin(i / 20) * 5 + (Math.random() - 0.5) * 2;
          break;
        case 'robotY':
          value = 87.6 + Math.cos(i / 15) * 8 + (Math.random() - 0.5) * 3;
          break;
        case 'robotZ':
          value = -45.1 + Math.sin(i / 25) * 10 + (Math.random() - 0.5) * 4;
          break;
        case 'robotRoll':
          value = 120.5 + Math.sin(i / 18) * 15 + (Math.random() - 0.5) * 5;
          break;
        case 'robotPitch':
          value = -8.2 + Math.cos(i / 22) * 6 + (Math.random() - 0.5) * 2;
          break;
        case 'robotYaw':
          value = 90.0 + Math.sin(i / 30) * 20 + (Math.random() - 0.5) * 8;
          break;
        case 'controllerX':
          value = 0.02 + Math.sin(i / 20) * 0.08 + (Math.random() - 0.5) * 0.02;
          break;
        case 'controllerY':
          value = -0.15 + Math.cos(i / 15) * 0.12 + (Math.random() - 0.5) * 0.03;
          break;
        case 'controllerZ':
          value = 0.08 + Math.sin(i / 25) * 0.10 + (Math.random() - 0.5) * 0.02;
          break;
        case 'controllerRoll':
          value = 15.2 + Math.sin(i / 18) * 10 + (Math.random() - 0.5) * 3;
          break;
        case 'controllerPitch':
          value = -5.7 + Math.cos(i / 22) * 8 + (Math.random() - 0.5) * 2;
          break;
        case 'controllerYaw':
          value = 30.0 + Math.sin(i / 30) * 15 + (Math.random() - 0.5) * 5;
          break;
      }
      data.push({ frame: i, value: Number(value.toFixed(2)) });
    }
    return data;
  };



  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4">
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-0.5">数据管理</h1>
              <p className="text-xs text-gray-500">集中管理与维护平台数据资产</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 px-3 py-1.5 text-sm" onClick={() => setShowExportDataModal(true)}>
              <Download size={16} />
              导出数据
            </Button>
          </div>

          {/* 筛选条件区域 */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2 hover:text-blue-600"
              >
                {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="text-sm font-medium text-gray-900">筛选条件</span>
              </button>
              <button className="text-xs text-blue-600 hover:underline">重置条件</button>
            </div>

            {isFilterExpanded && (
              <div className="px-3 py-3 space-y-3">
                {/* 第一行筛选 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">采集用户</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white">
                      <option>全部用户</option>
                      <option>张研究员</option>
                      <option>王工程师</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">标注用户</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white">
                      <option>全部用户</option>
                      <option>李标注员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">时间范围</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                    />
                  </div>
                </div>

                {/* 第二行筛选 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">机械臂</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white">
                      <option>全部设备</option>
                      <option>FRANKA-01</option>
                      <option>UR5-02</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">控制设备</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white">
                      <option>全部设备</option>
                      <option>GELLO-01</option>
                      <option>3DMouse-01</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">数据状态</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white">
                      <option>全部状态</option>
                      <option>待标注</option>
                      <option>已分配</option>
                      <option>标注完成</option>
                      <option>已禁用</option>
                    </select>
                  </div>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="搜索Clip ID、描述或关键字..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 应用筛选按钮 */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 py-1.5 text-xs">
                  <ListFilter size={14} />
                  应用筛选
                </Button>
              </div>
            )}
          </div>

          {/* 数据表格 */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 表格头部 */}
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Clip 数据列表</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span>每页显示：</span>
                  <select className="px-2 py-0.5 border border-gray-200 rounded text-xs">
                    <option>20条</option>
                    <option>50条</option>
                    <option>100条</option>
                  </select>
                </div>
                <div className="flex items-center gap-0.5 border border-gray-200 rounded p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  >
                    <LayoutList size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* 表格内容 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Clip ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">描述</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">采集用户</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">设备</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">时长</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">帧数</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">采集时间</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">状态</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clips.map((clip) => (
                    <tr key={clip.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">{clip.id}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-xs truncate">{clip.description}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{clip.collector}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{clip.device}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{clip.duration}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{clip.frames}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{clip.time}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusBadge(clip.status)}`}>
                          {getStatusText(clip.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            setSelectedClip(clip);
                            setShowClipManageModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 border border-gray-300 rounded"
                        >
                          <Settings size={14} />
                          管理
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 1 到 5 条，共 148 条记录
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  上一页
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">2</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">3</button>
                <span className="px-2 text-gray-400">...</span>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">30</button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 导出数据模态对话框 */}
      {showExportDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">数据导出</h3>
              <button 
                onClick={() => setShowExportDataModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-5">
              {/* 说明文字 */}
              <p className="text-sm text-gray-600">
                请选择导出数据格式，导出对象不会影响系统数据
              </p>

              {/* 导出范围 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">导出范围</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportDataRange"
                      checked={exportDataRange === 'all'}
                      onChange={() => setExportDataRange('all')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">全部数据（包含历史数据）</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportDataRange"
                      checked={exportDataRange === 'selected'}
                      onChange={() => setExportDataRange('selected')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">选中数据</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportDataRange"
                      checked={exportDataRange === 'filtered'}
                      onChange={() => setExportDataRange('filtered')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">符合筛选条件的全部数据</span>
                  </label>
                </div>
              </div>

              {/* 导出格式 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">导出格式</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportDataFormat('json')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      exportDataFormat === 'json'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Database size={24} className={exportDataFormat === 'json' ? 'text-blue-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <div className="text-sm font-medium text-gray-900 text-center">JSON</div>
                  </button>
                  <button
                    onClick={() => setExportDataFormat('csv')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      exportDataFormat === 'csv'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText size={24} className={exportDataFormat === 'csv' ? 'text-blue-600 mx-auto mb-2' : 'text-gray-400 mx-auto mb-2'} />
                    <div className="text-sm font-medium text-gray-900 text-center">CSV</div>
                  </button>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={() => setShowExportDataModal(false)}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  alert(`导出${exportDataRange === 'all' ? '全部' : exportDataRange === 'selected' ? '选中' : '筛选'}数据为${exportDataFormat.toUpperCase()}格式`);
                  setShowExportDataModal(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                开始导出
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clip管理操作选择对话框 */}
      {showClipManageModal && selectedClip && !clipManageAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Clip 管理</h3>
              <button 
                onClick={() => {
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Clip ID</div>
                <div className="text-sm font-medium text-gray-900">{selectedClip.id}</div>
                <div className="text-xs text-gray-500 mt-2">{selectedClip.description}</div>
              </div>

              <p className="text-sm text-gray-600">请选择要执行的操作：</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowClipManageModal(false);
                    setShowClipDetail(true);
                  }}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 mb-1">浏览Clip详情</div>
                  <div className="text-sm text-gray-500">查看此Clip的详细回放信息和姿态数据</div>
                </button>

                <button
                  onClick={() => setClipManageAction('assign')}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 mb-1">分配标注任务</div>
                  <div className="text-sm text-gray-500">将此Clip分配给标注员进行标注</div>
                </button>

                <button
                  onClick={() => setClipManageAction('disable')}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 mb-1">禁用Clip数据</div>
                  <div className="text-sm text-gray-500">禁用后该Clip将无法被标注和使用</div>
                </button>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex justify-end p-5 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 分配审核任务模态对话框 */}
      {showClipManageModal && selectedClip && clipManageAction === 'assign' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">分配标注任务</h3>
              <button 
                onClick={() => {
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                  setClipManageAction(null);
                  setSelectedReviewer('');
                  setAssignNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              {/* Clip ID */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Clip ID</label>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-900">
                  {selectedClip.id}
                </div>
              </div>

              {/* 选择标注员 */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">选择标注员</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reviewer"
                      value="李标注员"
                      checked={selectedReviewer === '李标注员'}
                      onChange={(e) => setSelectedReviewer(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">李标注员</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reviewer"
                      value="王标注员"
                      checked={selectedReviewer === '王标注员'}
                      onChange={(e) => setSelectedReviewer(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">王标注员</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="reviewer"
                      value="赵标注员"
                      checked={selectedReviewer === '赵标注员'}
                      onChange={(e) => setSelectedReviewer(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">赵标注员</span>
                  </label>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">备注（可选）</label>
                <input
                  type="text"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="请输入备注信息..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={() => {
                  setClipManageAction(null);
                  setSelectedReviewer('');
                  setAssignNote('');
                }}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                返回
              </Button>
              <Button
                onClick={() => {
                  if (!selectedReviewer) {
                    alert('请选择标注员');
                    return;
                  }
                  alert(`已将Clip ${selectedClip.id} 分配给 ${selectedReviewer}${assignNote ? `\n备注：${assignNote}` : ''}`);
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                  setClipManageAction(null);
                  setSelectedReviewer('');
                  setAssignNote('');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                确认分配
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 禁用Clip确认模态对话框 */}
      {showClipManageModal && selectedClip && clipManageAction === 'disable' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">禁用Clip确认</h3>
              <button 
                onClick={() => {
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                  setClipManageAction(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-5 space-y-4">
              {/* 警告图标 */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
              </div>

              {/* 警告文字 */}
              <div className="text-center">
                <p className="text-sm text-gray-700 mb-2">
                  您确定要禁用此Clip吗？
                </p>
                <p className="text-sm text-gray-500">
                  禁用后该Clip将无法被标注和使用
                </p>
              </div>

              {/* Clip信息 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Clip ID</div>
                  <div className="font-mono text-sm text-gray-900">{selectedClip.id}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">描述</div>
                  <div className="text-sm text-gray-700">{selectedClip.description}</div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <Button
                onClick={() => {
                  setClipManageAction(null);
                }}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  alert(`已禁用Clip: ${selectedClip.id}`);
                  setShowClipManageModal(false);
                  setSelectedClip(null);
                  setClipManageAction(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                确认禁用
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clip详情弹窗 */}
      {showClipDetail && selectedClip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[92vh] flex flex-col">
            {/* 弹窗标题 */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
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
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 min-h-0">
              {/* 顶部折叠按钮行 */}
              <div className="flex justify-end gap-2 mb-3 shrink-0">
                <Button
                  onClick={() => setShowClipRobotData(!showClipRobotData)}
                  className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-lg transition-all text-xs ${ 
                    showClipRobotData
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Cpu size={14} />
                  <span>机械臂姿态</span>
                  {showClipRobotData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
                
                <Button
                  onClick={() => setShowClipControllerData(!showClipControllerData)}
                  className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-lg transition-all text-xs ${
                    showClipControllerData
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Gamepad size={14} />
                  <span>控制器姿态</span>
                  {showClipControllerData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
              </div>
              
              {/* 摄像头视图 - 自适应高度 */}
              <div 
                className="grid grid-cols-2 gap-4 mb-4" 
                style={{ 
                  height: showClipRobotData || showClipControllerData 
                    ? 'calc((92vh - 180px) * 0.5)' 
                    : 'calc(92vh - 180px)' 
                }}
              >
                {/* 主摄像头 */}
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={roboticArmView}
                    alt="Clip回放"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                        <Play size={12} />
                        <span>主摄像头</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs">
                        {selectedClip.duration}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 手部姿态摄像头 */}
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={handCameraView}
                    alt="手部姿态"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                        <Play size={12} />
                        <span>手部摄像头</span>
                      </div>
                      <div className="bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs">
                        {selectedClip.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 数据面板 - 自适应高度 */}
              {(showClipRobotData || showClipControllerData) && (
                <div 
                  className="grid gap-4 transition-all duration-300 grid-cols-2" 
                  style={{ height: 'calc((92vh - 180px) * 0.5 - 16px)' }}
                >
                  {/* 机械臂实时姿态 */}
                  {showClipRobotData && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-y-auto">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-900">机械臂实时姿态</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* X轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">X轴</div>
                          <div className="text-sm font-semibold text-gray-900">-12.3°</div>
                        </div>

                        {/* Y轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Y轴</div>
                          <div className="text-sm font-semibold text-gray-900">87.6°</div>
                        </div>

                        {/* Z轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Z轴</div>
                          <div className="text-sm font-semibold text-gray-900">-45.1°</div>
                        </div>

                        {/* Roll */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Roll</div>
                          <div className="text-sm font-semibold text-gray-900">120.5°</div>
                        </div>

                        {/* Pitch */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Pitch</div>
                          <div className="text-sm font-semibold text-gray-900">-8.2°</div>
                        </div>

                        {/* Yaw */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Yaw</div>
                          <div className="text-sm font-semibold text-gray-900">90.0°</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GELLOW控制器姿态 */}
                  {showClipControllerData && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">GELLOW控制器姿态</h4>
                        <div className="flex items-center gap-2">
                        
                        
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* X轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">X轴</div>
                          <div className="text-sm font-semibold text-gray-900">+0.02 m</div>
                        </div>

                        {/* Y轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Y轴</div>
                          <div className="text-sm font-semibold text-gray-900">-0.15 m</div>
                        </div>

                        {/* Z轴 */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Z轴</div>
                          <div className="text-sm font-semibold text-gray-900">+0.08 m</div>
                        </div>

                        {/* Roll */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Roll</div>
                          <div className="text-sm font-semibold text-gray-900">15.2°</div>
                        </div>

                        {/* Pitch */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Pitch</div>
                          <div className="text-sm font-semibold text-gray-900">-5.7°</div>
                        </div>

                        {/* Yaw */}
                        <div className="border border-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500 mb-1">Yaw</div>
                          <div className="text-sm font-semibold text-gray-900">30.0°</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 弹窗底部操作按钮 */}
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  onClick={() => {
                    console.log('播放Clip:', selectedClip.id);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center gap-1.5 text-sm"
                >
                  <Play size={14} />
                  播放
                </Button>
                
                {/* 视频进度条 */}
                <div className="flex-1 max-w-md flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 relative" style={{ overflow: 'visible' }}>
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(selectedClip.frames * 0.64) / selectedClip.frames * 100}%` }}
                    />
                    {/* 关键帧标记 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // 跳转到关键帧位置（假设关键帧在50%位置）
                        console.log('跳转到关键帧: 50%');
                      }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2 hover:scale-110 transition-transform cursor-pointer z-10"
                      style={{ pointerEvents: 'auto' }}
                      title="关键帧"
                    >
                      {/* 向下箭头 */}
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[10px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg" />
                        <div className="w-1.5 h-2.5 bg-gradient-to-b from-orange-500 to-orange-600 -mt-0.5 drop-shadow-lg rounded-b-sm" />
                      </div>
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-medium min-w-[80px]">
                    {Math.floor(selectedClip.frames * 0.64)} / {selectedClip.frames} 帧
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
                  }}
                  className="px-4 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-sm"
                >
                  返回
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ListFilter icon component (if not available in lucide-react)
function ListFilter({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}