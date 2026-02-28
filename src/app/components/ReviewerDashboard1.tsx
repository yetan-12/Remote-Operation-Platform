import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Check, AlertCircle, Cpu, User, Calendar, Paperclip, BarChart2, TrendingUp, Gamepad, ChevronLeft, ChevronRight, Eye, Circle } from 'lucide-react';
import { Button } from './ui/button';
import DatePicker from './DatePicker';

interface SessionData {
  id: string;
  device: string;
  operator: string;
  date: string;
  clips: number;
  status: 'Pending' | 'Assigned' | 'Finished' | 'Disabled';
}

interface ClipData {
  id: string;
  duration: string;
  description: string;
}

export default function ReviewerDashboard() {
  const [selectedSession, setSelectedSession] = useState('SE-20251217-003');
  const [isPlaying, setIsPlaying] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedAction, setSelectedAction] = useState<'pass' | 'reject' | 'pending' | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedClip, setSelectedClip] = useState('C1225-01');
  const [isClipsListExpanded, setIsClipsListExpanded] = useState(true);
  const [startDate, setStartDate] = useState('2025-12-17');
  const [endDate, setEndDate] = useState('2025-12-17');
  const [isPoseDataExpanded, setIsPoseDataExpanded] = useState(false);
  
  // 播放进度状态
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(150); // 总时长（秒）
  
  const clipsScrollRef = useRef<HTMLDivElement>(null);

  // 横向滚动到选中的Clip（仅在折叠窗展开时）
  useEffect(() => {
    if (!selectedClip || !isClipsListExpanded) return;
    
    setTimeout(() => {
      const clipElement = document.querySelector(`[data-clip-id="${selectedClip}"]`);
      if (clipElement) {
        clipElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 0);
  }, [selectedClip, isClipsListExpanded]);

  // 播放进度更新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理进度条拖动
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value);
    setCurrentTime(newTime);
  };

  // 模拟数据
  // 使用新的ID格式：C + 月日 + 序号（C1225-01形式）
  const allClips: ClipData[] = [
    { id: 'C1225-01', duration: '00:42', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-02', duration: '00:35', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-03', duration: '00:51', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-04', duration: '00:38', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-05', duration: '00:45', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-06', duration: '00:39', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-07', duration: '00:44', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-08', duration: '00:52', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1225-09', duration: '00:36', description: '将夹住方形积木至色盘上方' },
    { id: 'C1225-10', duration: '00:48', description: '将夹住方形积木移至色盘' },
    { id: 'C1224-01', duration: '00:41', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-02', duration: '00:47', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-03', duration: '00:43', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-04', duration: '00:50', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-05', duration: '00:37', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-01', duration: '00:46', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-02', duration: '00:40', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-03', duration: '00:49', description: '将夹住方形积木移至色盘上方' },
  ];

  const clips: ClipData[] = allClips;

  // 为每个clip分配随机缩略图
  const clipThumbnails = [
    'https://images.unsplash.com/photo-1563968743333-044cef800494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljJTIwYXJtJTIwbWFudWZhY3R1cmluZ3xlbnwxfHx8fDE3NjY0MDkwNzJ8MA&ixlib=rb-4.1.0&q=80&w=400',
    'https://images.unsplash.com/photo-1715059120691-d6b06c275d74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcm9ib3QlMjBhc3NlbWJseXxlbnwxfHx8fDE3NjY0MDkwNzJ8MA&ixlib=rb-4.1.0&q=80&w=400',
    'https://images.unsplash.com/photo-1759159091728-e2c87b9d9315?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pY2FsJTIwYXV0b21hdGlvbnxlbnwxfHx8fDE3NjY0MDkwNzJ8MA&ixlib=rb-4.1.0&q=80&w=400',
    'https://images.unsplash.com/photo-1700726783633-23c0c6383b00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWN0b3J5JTIwcm9ib3RpY3N8ZW58MXx8fHwxNzY2NDA5MDczfDA&ixlib=rb-4.1.0&q=80&w=400',
    'https://images.unsplash.com/photo-1759621165667-da064b86fdd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVjaXNpb24lMjBtYWNoaW5lcnl8ZW58MXx8fHwxNzY2NDA5MDczfDA&ixlib=rb-4.1.0&q=80&w=400',
    'https://images.unsplash.com/photo-1633504110842-7618144066fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0ZWQlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY2NDA5MDczfDA&ixlib=rb-4.1.0&q=80&w=400',
  ];

  // 获取当前Clip的索引
  const currentClipIndex = clips.findIndex(clip => clip.id === selectedClip);
  const isFirstClip = currentClipIndex === 0;
  const isLastClip = currentClipIndex === clips.length - 1;

  // 切换到上一条Clip
  const handlePreviousClip = () => {
    if (currentClipIndex > 0) {
      const newClipId = clips[currentClipIndex - 1].id;
      setSelectedClip(newClipId);
      // 滚动到可视区域
      setTimeout(() => {
        const clipElement = document.querySelector(`[data-clip-id="${newClipId}"]`);
        if (clipElement) {
          clipElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 0);
    }
  };

  // 切换到下一条Clip
  const handleNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      const newClipId = clips[currentClipIndex + 1].id;
      setSelectedClip(newClipId);
      // 滚动到可视区域
      setTimeout(() => {
        const clipElement = document.querySelector(`[data-clip-id="${newClipId}"]`);
        if (clipElement) {
          clipElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 0);
    }
  };

  // 提交审核
  const handleSubmitReview = () => {
    // 这里可以添加提交审核的逻辑
    console.log('提交审核', { selectedClip, selectedAction, reviewComment });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧Clips列表 */}
      <div className="w-[12.5%] bg-white border-r border-gray-200 flex flex-col relative">
        <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Clips列表</h2>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-xs px-2 py-1"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            筛选
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-1 space-y-1 custom-scrollbar">
          {clips.map((clip, index) => (
            <div
              key={clip.id}
              onClick={() => setSelectedClip(clip.id)}
              className={`cursor-pointer transition-all rounded overflow-hidden shadow-sm ${
                selectedClip === clip.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:ring-1 hover:ring-gray-300 bg-white'
              }`}
            >
              {/* 缩略图 */}
              <div className="relative bg-black w-full aspect-video">
                <img 
                  src={clipThumbnails[index % clipThumbnails.length]} 
                  alt={clip.id}
                  className="w-full h-full object-cover"
                />
                {/* 播放按钮覆盖层 */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                    <Play size={12} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
                {/* 时长标签 */}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                  {clip.duration}
                </div>
                {/* 选中指示器 */}
                {selectedClip === clip.id && (
                  <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white shadow-sm"></div>
                )}
              </div>
              {/* Clip ID */}
              <div className={`px-1.5 py-1.5 transition-all ${
                selectedClip === clip.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}>
                <div className="text-[10px] font-bold text-center tracking-wide">{clip.id}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 弹出式筛选面板 */}
        {isFilterExpanded && (
          <>
            {/* 遮罩层 */}
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsFilterExpanded(false)}
            />
            
            {/* 筛选面板 */}
            <div className="absolute top-0 left-full w-64 h-full bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">数据筛选</h2>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setIsFilterExpanded(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 审核状态 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">审核状态</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" defaultChecked />
                        <span className="text-sm text-blue-600 font-medium">待审核</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full">18</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                        <span className="text-sm text-gray-700">已通过</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">42</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                        <span className="text-sm text-gray-700">已拒绝</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">8</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                        <span className="text-sm text-gray-700">待定</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">3</span>
                    </label>
                  </div>
                </div>

                {/* 采集日期 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">采集日期</h3>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs text-gray-600 mb-1.5 block">开始日期</label>
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="选择开始日期"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1.5 block">结束日期</label>
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        minDate={startDate}
                        placeholder="选择结束日期"
                      />
                    </div>
                  </div>
                </div>

                {/* Clip ID筛选 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Clip ID</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" defaultChecked />
                        <span className="text-sm text-gray-700">12月25日</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">10</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                        <span className="text-sm text-gray-700">12月24日</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">5</span>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                        <span className="text-sm text-gray-700">12月23日</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">3</span>
                    </label>
                  </div>
                </div>

                {/* 时长筛选 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Clip时长</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">30秒以下</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">30-45秒</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">45秒以上</span>
                    </label>
                  </div>
                </div>

                {/* 设备型号 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">机械臂型号</h3>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">FRANKA-01</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">UR5-02</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                      <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">KUKA-03</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="p-4 space-y-2 border-t border-gray-200">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  应用筛选
                </Button>
                <button className="w-full text-sm text-gray-600 hover:text-gray-900 py-2">
                  重置筛选条件
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 右侧数据审核主体 */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {/* 标题栏 - 固定 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">数据审核</h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              已选择: {selectedClip}
            </div>
            <button className="text-sm text-blue-600 hover:underline">共 {clips.length} 条</button>
          </div>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {/* Clip数据详情展示模块 */}
          <div className="bg-white rounded-lg p-6 mb-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">当前clips任务提示 (Prompt)</h3>
              <div className="text-xs text-gray-500 mt-1">
                当前Prompt: {clips.find(c => c.id === selectedClip)?.description || '暂无描述'}
              </div>
            </div>

            {/* 上半部分：主摄像头 + 手部姿态和机械臂 */}
            <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '560px 1fr 480px' }}>
              {/* 左侧 - 主摄像头 + 手部姿态 */}
              <div className="space-y-3">
                {/* 主摄像头 */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '310px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1597513894345-6f8524d4855a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljJTIwY2FtZXJhJTIwdmlld3xlbnwxfHx8fDE3NjY0MDk5NTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="主摄像头"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                        <Play size={14} />
                        <span className="font-medium">主摄像头</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                        <span>00:42</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 手部姿态 */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '230px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1637606239763-538119a41f14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kJTIwZ2VzdHVyZSUyMHRyYWNraW5nfGVufDF8fHx8MTc2NjQwOTk1OHww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="手部姿态"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                        <Play size={14} />
                        <span className="font-medium">手部摄像头</span>
                      </div>
                      <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                        <span>00:42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 中间 - 机械臂实时姿态 + GELLOW操作器姿态 */}
              <div className="space-y-3" style={{ height: '552px' }}>
                {/* 机械臂实时姿态 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-[270px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">机械臂实时姿态</h4>
                    <div className="flex items-center gap-2">
                      <Circle size={8} className="text-green-500 fill-green-500" />
                      <span className="text-xs text-green-700 font-medium">已连接</span>
                    </div>
                  </div>

                  {/* 角度数据 */}
                  <div className="grid grid-cols-3 gap-3 flex-1 content-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">X轴</div>
                      <div className="text-sm font-semibold text-gray-900">-12.3°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Y轴</div>
                      <div className="text-sm font-semibold text-gray-900">87.6°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Z轴</div>
                      <div className="text-sm font-semibold text-gray-900">-45.1°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Roll</div>
                      <div className="text-sm font-semibold text-gray-900">120.5°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pitch</div>
                      <div className="text-sm font-semibold text-gray-900">-8.2°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Yaw</div>
                      <div className="text-sm font-semibold text-gray-900">30.0°</div>
                    </div>
                  </div>
                </div>

                {/* GELLOW操作器姿态 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-[270px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">GELLOW操作器姿态</h4>
                    <div className="flex items-center gap-2">
                      <Circle size={8} className="text-green-500 fill-green-500" />
                      <span className="text-xs text-green-700 font-medium">已连接</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 flex-1 content-center">
                    {/* 位置数据 */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">X轴</div>
                      <div className="text-sm font-semibold text-gray-900">+0.02 m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Y轴</div>
                      <div className="text-sm font-semibold text-gray-900">-0.15 m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Z轴</div>
                      <div className="text-sm font-semibold text-gray-900">+0.08 m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Roll</div>
                      <div className="text-sm font-semibold text-gray-900">15.2°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pitch</div>
                      <div className="text-sm font-semibold text-gray-900">-5.7°</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Yaw</div>
                      <div className="text-sm font-semibold text-gray-900">30.0°</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧 - 审核操作 + 审核意见 */}
              <div className="flex flex-col h-full">
                {/* 播放控制 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center gap-2 flex-shrink-0"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      {isPlaying ? '暂停' : '播放'}
                    </button>
                    
                    {/* 视频进度条 */}
                    <div className="flex-1 flex items-center gap-2">
                      <div 
                        className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const percentage = clickX / rect.width;
                          const newTime = Math.floor(percentage * duration);
                          setCurrentTime(newTime);
                        }}
                      >
                        <div 
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 审核操作 */}
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">审核操作</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedAction('pass')}
                      className={`w-full p-2.5 rounded-lg border-2 transition-all ${
                        selectedAction === 'pass'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedAction === 'pass' ? 'bg-green-500' : 'bg-gray-100'
                        }`}>
                          <Check size={14} className={selectedAction === 'pass' ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-900">通过</div>
                          <div className="text-xs text-gray-500">数据符合评测，可用于后续训练</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedAction('reject')}
                      className={`w-full p-2.5 rounded-lg border-2 transition-all ${
                        selectedAction === 'reject'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedAction === 'reject' ? 'bg-red-500' : 'bg-gray-100'
                        }`}>
                          <X size={14} className={selectedAction === 'reject' ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-900">拒绝</div>
                          <div className="text-xs text-gray-500">数据问题不达标，需重新采集</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedAction('pending')}
                      className={`w-full p-2.5 rounded-lg border-2 transition-all ${
                        selectedAction === 'pending'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selectedAction === 'pending' ? 'bg-yellow-500' : 'bg-gray-100'
                        }`}>
                          <AlertCircle size={14} className={selectedAction === 'pending' ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-900">待定</div>
                          <div className="text-xs text-gray-500">需要进一步评估或有待商榷</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 审核意见 - 使用flex-1占据剩余空间 */}
                <div className="flex-1 flex flex-col mb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">审核意见 (选填)</h3>
                  <textarea
                    placeholder='请输入详细注意事项或说明信息。例如："机臂位置精准，但反应速度略慢"'
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 提交和下一条按钮 - 固定在部 */}
                <div className="flex flex-col gap-2 mt-auto">
                  <Button 
                    className={`w-full h-9 border ${
                      isFirstClip 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                    onClick={handlePreviousClip}
                    disabled={isFirstClip}
                  >
                    上一条
                  </Button>
                  <Button 
                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={isLastClip ? handleSubmitReview : handleNextClip}
                  >
                    {isLastClip ? '提交审核' : '下一条'}
                  </Button>
                </div>
              </div>
            </div>

          
            
          </div>
        </div>

        {/* 底部状态栏 */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-gray-500" />
            <span>待审核：{clips.length} 条Clips</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-gray-500" />
            <span>通过率：62.5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}