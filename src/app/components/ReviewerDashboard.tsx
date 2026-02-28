import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Check, AlertCircle, Cpu, User, Calendar, Paperclip, BarChart2, TrendingUp, Gamepad, ChevronLeft, ChevronRight, Eye, Circle, ChevronDown, GripVertical, RotateCcw, Home, Move } from 'lucide-react';
import { Button } from './ui/button';
import DatePicker from './DatePicker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { roboticArmView, handCameraView } from '../assets/placeholders';

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
  const [dataValidity, setDataValidity] = useState<'valid' | 'invalid' | null>(null);
  const [dataCompleteness, setDataCompleteness] = useState<'complete' | 'incomplete' | null>(null);
  const [selectedErrorTags, setSelectedErrorTags] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isClipsListExpanded, setIsClipsListExpanded] = useState(true);
  const [startDate, setStartDate] = useState('2025-12-17');
  const [endDate, setEndDate] = useState('2025-12-17');
  const [isPoseDataExpanded, setIsPoseDataExpanded] = useState(false);
  
  // 播放进度状态
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(150); // 总帧数
  
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
    { id: 'C1225-07', duration: '00:44', description: '将夹住方形积木移至色��上方' },
    { id: 'C1225-08', duration: '00:52', description: '将夹住方形积木移至���盘上方' },
    { id: 'C1225-09', duration: '00:36', description: '将夹住方形积木至色盘上方' },
    { id: 'C1225-10', duration: '00:48', description: '将夹住方形积木移至色盘' },
    { id: 'C1224-01', duration: '00:41', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-02', duration: '00:47', description: '方形积木移至色盘上方' },
    { id: 'C1224-03', duration: '00:43', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-04', duration: '00:50', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1224-05', duration: '00:37', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-01', duration: '00:46', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-02', duration: '00:40', description: '将夹住方形积木移至色盘上方' },
    { id: 'C1223-03', duration: '00:49', description: '将夹住方形积木移至色盘方' },
  ];

  const clips: ClipData[] = allClips;

  // 为每个clip分配统一缩略图
  const clipThumbnails = [
    handCameraView,
    handCameraView,
    handCameraView,
    handCameraView,
    handCameraView,
    handCameraView,
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

  // 提交标注
  const handleSubmitReview = () => {
    // 验证���填项
    if (!dataValidity || !dataCompleteness) {
      alert('请完成数据有效性和数据完成度的标注');
      return;
    }
    // 这里可以添加提交标注的逻辑
    console.log('提交标注', { selectedClip, dataValidity, dataCompleteness, selectedErrorTags, reviewComment });
    
    // 提交成功重置状态并返回默认界面
    setSelectedClip(null);
    setDataValidity(null);
    setDataCompleteness(null);
    setSelectedErrorTags([]);
    setReviewComment('');
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 判断是单臂还是双臂
  const isSingleArm = selectedClip === 'C1225-01';
  const isDualArm = selectedClip === 'C1225-02';

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧Clips列表 */}
      <div className={`bg-white border-r border-gray-200 flex flex-col relative transition-all duration-300 ${
        isClipsListExpanded ? 'w-[12.5%]' : 'w-12'
      }`}>
        {isClipsListExpanded ? (
          <>
            {/* 展开状态 */}
            <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Clips列表</h2>
              <button
                onClick={() => setIsClipsListExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="折叠"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1 space-y-1 custom-scrollbar">
              {clips.map((clip, index) => (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClip(clip.id)}
                  className={`cursor-pointer transition-all rounded p-1 shadow-sm ${
                    selectedClip === clip.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:ring-1 hover:ring-gray-300 bg-white'
                  }`}
                >
                  {/* 缩略图 */}
                  <div className="relative bg-black w-full aspect-video rounded overflow-hidden">
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
                    {/* 帧数标签 */}
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
          </>
        ) : (
          <>
            {/* 折叠状态 */}
            <div className="h-full flex flex-col items-center py-4">
              <button
                onClick={() => setIsClipsListExpanded(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors mb-4"
                title="展开"
              >
                <ChevronRight size={18} />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <div className="[writing-mode:vertical-lr] text-sm font-semibold text-gray-600 tracking-wider">
                  Clips
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 右侧数据标注主体 */}
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
        {/* 标题栏 - 固定 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">数据标注</h2>
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
          {!selectedClip ? (
            // ======== 默认空状态提示 ========
            <div className="bg-white rounded-lg p-6 mb-4 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">请选择 Clip 以开始数据标注</h3>
                <p className="text-xs text-gray-500">从左侧列表中选择一个 Clip 来查看详情并进行标注</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900">当前clips任务提示 (Prompt)</h3>
                <div className="text-xs text-gray-500 mt-1">
                  当前Prompt: {clips.find(c => c.id === selectedClip)?.description || '暂无描述'}
                </div>
              </div>

              {/* 根据Clip类型渲染不同布局 */}
              {isSingleArm ? (
                // ======== 单臂布局 (C1225-01) ========
                <SingleArmReview 
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  setCurrentTime={setCurrentTime}
                  formatTime={formatTime}
                  dataValidity={dataValidity}
                  setDataValidity={setDataValidity}
                  dataCompleteness={dataCompleteness}
                  setDataCompleteness={setDataCompleteness}
                  selectedErrorTags={selectedErrorTags}
                  setSelectedErrorTags={setSelectedErrorTags}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  isPoseDataExpanded={isPoseDataExpanded}
                  setIsPoseDataExpanded={setIsPoseDataExpanded}
                  isFirstClip={isFirstClip}
                  isLastClip={isLastClip}
                  handlePreviousClip={handlePreviousClip}
                  handleNextClip={handleNextClip}
                  handleSubmitReview={handleSubmitReview}
                />
              ) : isDualArm ? (
                // ======== 双臂布局 (C1225-02) ========
                <DualArmReview 
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  setCurrentTime={setCurrentTime}
                  formatTime={formatTime}
                  dataValidity={dataValidity}
                  setDataValidity={setDataValidity}
                  dataCompleteness={dataCompleteness}
                  setDataCompleteness={setDataCompleteness}
                  selectedErrorTags={selectedErrorTags}
                  setSelectedErrorTags={setSelectedErrorTags}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  isPoseDataExpanded={isPoseDataExpanded}
                  setIsPoseDataExpanded={setIsPoseDataExpanded}
                  isFirstClip={isFirstClip}
                  isLastClip={isLastClip}
                  handlePreviousClip={handlePreviousClip}
                  handleNextClip={handleNextClip}
                  handleSubmitReview={handleSubmitReview}
                />
              ) : (
                // ======== 默认布局（他Clips） ========
                <SingleArmReview 
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  setCurrentTime={setCurrentTime}
                  formatTime={formatTime}
                  dataValidity={dataValidity}
                  setDataValidity={setDataValidity}
                  dataCompleteness={dataCompleteness}
                  setDataCompleteness={setDataCompleteness}
                  selectedErrorTags={selectedErrorTags}
                  setSelectedErrorTags={setSelectedErrorTags}
                  reviewComment={reviewComment}
                  setReviewComment={setReviewComment}
                  isPoseDataExpanded={isPoseDataExpanded}
                  setIsPoseDataExpanded={setIsPoseDataExpanded}
                  isFirstClip={isFirstClip}
                  isLastClip={isLastClip}
                  handlePreviousClip={handlePreviousClip}
                  handleNextClip={handleNextClip}
                  handleSubmitReview={handleSubmitReview}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 标注操作面板组件（复用）
function ReviewActions({ 
  isPlaying, 
  setIsPlaying, 
  currentTime, 
  duration, 
  setCurrentTime, 
  formatTime,
  dataValidity,
  setDataValidity,
  dataCompleteness,
  setDataCompleteness,
  selectedErrorTags,
  setSelectedErrorTags,
  reviewComment,
  setReviewComment,
  isFirstClip,
  isLastClip,
  handlePreviousClip,
  handleNextClip,
  handleSubmitReview
}: any) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [controlPosition, setControlPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const fps = 30; // 假设视频帧率为30fps
  
  // 将秒转换为帧数
  const currentFrame = Math.floor(currentTime * fps);
  const totalFrames = Math.floor(duration * fps);
  
  // 倍速选项
  const speedOptions = [0.25, 0.5, 1, 2];
  
  // 重播功能
  const handleReplay = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };
  
  // 重置控制栏位置
  const handleResetPosition = () => {
    setControlPosition({ x: 0, y: 0 });
  };
  
  // 拖动控制栏
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setControlPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div className="flex flex-col" style={{ height: 'calc(80vh - 160px)' }}>
      {/* ���放控制 */}
      <div 
        ref={controlRef}
        className="fixed z-50 bg-white rounded-xl border border-gray-300 shadow-2xl p-4 flex items-center min-w-[700px] max-w-[900px]"
        style={{
          left: controlPosition.x === 0 && controlPosition.y === 0 ? '50%' : `${controlPosition.x}px`,
          top: controlPosition.y === 0 ? 'auto' : `${controlPosition.y}px`,
          bottom: controlPosition.y === 0 ? '24px' : 'auto',
          transform: controlPosition.x === 0 && controlPosition.y === 0 ? 'translateX(-50%)' : 'none',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* 拖动手柄 */}
        <div 
          onMouseDown={handleDragStart}
          className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-lg transition-colors mr-2"
          title="拖动控制栏"
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
        
        {/* 重置位置按钮 */}
        <button
          onClick={handleResetPosition}
          className="p-2 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition-all mr-2"
          title="重置位置"
        >
          <Home size={18} />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button
            onClick={handleReplay}
            className="p-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all"
            title="重播"
          >
            <RotateCcw size={18} />
          </button>
          
          {/* 视频进度条 */}
          <div className="flex-1 flex items-center gap-2">
            <div 
              className="flex-1 bg-gray-200 rounded-full h-1 cursor-pointer relative"
              style={{ overflow: 'visible' }}
              onClick={(e) => {
                // 如果点击的是按钮或其子元素，不执行进度条跳转
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                const newTime = Math.floor(percentage * duration);
                setCurrentTime(newTime);
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const clickX = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                  const percentage = clickX / rect.width;
                  const newTime = Math.floor(percentage * duration);
                  setCurrentTime(newTime);
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div 
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* 关键帧标记 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // 跳转到关键帧位置（假设关键帧在50%位置）
                  const keyframeTime = Math.floor(duration * 0.5);
                  setCurrentTime(keyframeTime);
                  console.log('跳转到关键帧:', keyframeTime);
                }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 hover:scale-110 transition-transform cursor-pointer z-10"
                style={{ pointerEvents: 'auto' }}
                title="关键帧"
              >
                {/* 向下箭头 */}
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg" />
                  <div className="w-2 h-3 bg-gradient-to-b from-orange-500 to-orange-600 -mt-0.5 drop-shadow-lg rounded-b-sm" />
                </div>
              </button>
            </div>
            <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
              {currentFrame} / {totalFrames} 帧
            </span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1 bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500 cursor-pointer font-medium text-gray-700"
            >
              {speedOptions.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 标注操作 */}
      <div className="mb-3">
        <h3 className="text-xs font-medium text-gray-900 mb-3">标注操作</h3>
        
        {/* 数据有效性 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-red-500 text-xs">*</span>
            <label className="text-xs text-gray-700">数据有效性:</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDataValidity('valid')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dataValidity === 'valid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              有效
            </button>
            <button
              onClick={() => setDataValidity('invalid')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dataValidity === 'invalid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              无效
            </button>
          </div>
        </div>

        {/* 数据完成度 */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-red-500 text-xs">*</span>
            <label className="text-xs text-gray-700">动作完成度:</label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDataCompleteness('complete')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dataCompleteness === 'complete'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              完成
            </button>
            <button
              onClick={() => setDataCompleteness('incomplete')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                dataCompleteness === 'incomplete'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未完成
            </button>
          </div>
        </div>
      </div>

      {/* 错误标签 (选填) */}
      <div className="mb-3">
        <h3 className="text-xs font-medium text-gray-900 mb-2">错误标签 (选填)</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              const dropdown = document.getElementById('error-tags-dropdown');
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span className="text-gray-700">
              {selectedErrorTags && selectedErrorTags.length > 0 
                ? `已选择 ${selectedErrorTags.length} 个标签` 
                : '选择错误标签'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          <div
            id="error-tags-dropdown"
            className="hidden absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            {['动作不完整', '画面模糊', '机械臂异常'].map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedErrorTags?.includes(tag)}
                  onChange={() => {
                    if (selectedErrorTags?.includes(tag)) {
                      setSelectedErrorTags(selectedErrorTags.filter(t => t !== tag));
                    } else {
                      setSelectedErrorTags([...(selectedErrorTags || []), tag]);
                    }
                  }}
                  className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 审核意见 - 使用flex-1占据剩余空间 */}
      <div className="flex-1 flex flex-col mb-3 min-h-0">
        <h3 className="text-xs font-medium text-gray-900 mb-2">审核意见 (选填)</h3>
        <textarea
          placeholder='请输入详细注意事项或说明信息'
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          className="w-full flex-1 px-2.5 py-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 提交和一条钮 - 固定在底部 */}
      <div className="flex flex-col gap-2">
        <Button 
          className={`w-full h-8 text-xs ${
            isLastClip 
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={() => {
            // 验证必填项
            if (!dataValidity || !dataCompleteness) {
              alert('请完成数据有效性和动作完成度的标注');
              return;
            }
            handleNextClip();
          }}
          disabled={isLastClip}
        >
          提交并下一条
        </Button>
        <Button 
          className="w-full h-8 text-xs bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          onClick={handleSubmitReview}
        >
          提交并返回
        </Button>
      </div>
    </div>
  );
}

// 单臂审核界面
function SingleArmReview(props: any) {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    setCurrentTime,
    formatTime,
    dataValidity,
    setDataValidity,
    dataCompleteness,
    setDataCompleteness,
    selectedErrorTags,
    setSelectedErrorTags,
    reviewComment,
    setReviewComment,
    isPoseDataExpanded,
    setIsPoseDataExpanded,
    isFirstClip,
    isLastClip,
    handlePreviousClip,
    handleNextClip,
    handleSubmitReview
  } = props;

  const sliderRef = useRef<HTMLDivElement>(null);
  const [isActionComparisonExpanded, setIsActionComparisonExpanded] = useState(false);
  
  // 画中画展开状态
  const [expandedPip, setExpandedPip] = useState<string | null>(null); // null 或 'arm'

  // 画中画位置和大小状态
  const [pipPositions, setPipPositions] = useState<{[key: string]: {x: number, y: number}}>({
    arm: { x: 0, y: 0 }
  });
  const [pipSizes, setPipSizes] = useState<{[key: string]: {width: number, height: number}}>({
    arm: { width: 0, height: 0 }
  });
  const [draggingPip, setDraggingPip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingPip, setResizingPip] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const [isResized, setIsResized] = useState(false);

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
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragged(false);
    setDraggingPip(pipId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
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
    setIsResized(false);
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
        setIsDragged(true);
        setPipPositions(prev => ({
          ...prev,
          [draggingPip]: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        }));
      }
      
      if (resizingPip) {
        setIsResized(true);
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

  // 每个图���的线条显示状态
  const [rollLines, setRollLines] = useState({ action: true, obs: true });
  const [angleLines, setAngleLines] = useState({ action: true, obs: true });
  const [gripperLines, setGripperLines] = useState({ action: true, obs: true });
  const [pitchLines, setPitchLines] = useState({ action: true, obs: true });
  const [yawLines, setYawLines] = useState({ action: true, obs: true });
  const [velocityLines, setVelocityLines] = useState({ action: true, obs: true });

  // 鼠标悬停帧
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);

  // 生成模拟action vs observation数据（使用useMemo避免重新生成）
  const comparisonData = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      frame: i,
      action_roll: -0.5 + Math.sin(i / 8) * 0.3 + (Math.random() - 0.5) * 0.1,
      obs_roll: -0.5 + Math.sin(i / 8) * 0.3 + (Math.random() - 0.5) * 0.15,
      action_angle: 1.2 + Math.cos(i / 10) * 0.4 + (Math.random() - 0.5) * 0.1,
      obs_angle: 1.2 + Math.cos(i / 10) * 0.4 + (Math.random() - 0.5) * 0.15,
      action_gripper: 0.8 + Math.sin(i / 6) * 0.2 + (Math.random() - 0.5) * 0.08,
      obs_gripper: 0.8 + Math.sin(i / 6) * 0.2 + (Math.random() - 0.5) * 0.12,
      action_pitch: 0.3 + Math.cos(i / 12) * 0.25 + (Math.random() - 0.5) * 0.08,
      obs_pitch: 0.3 + Math.cos(i / 12) * 0.25 + (Math.random() - 0.5) * 0.12,
      action_yaw: -0.2 + Math.sin(i / 9) * 0.3 + (Math.random() - 0.5) * 0.1,
      obs_yaw: -0.2 + Math.sin(i / 9) * 0.3 + (Math.random() - 0.5) * 0.15,
      action_velocity: 0.5 + Math.cos(i / 7) * 0.3 + (Math.random() - 0.5) * 0.1,
      obs_velocity: 0.5 + Math.cos(i / 7) * 0.3 + (Math.random() - 0.5) * 0.15,
    }));
  }, []); // 空依赖数组，只在组件初始化时生成一次

  return (
    <>
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 460px' }}>
        {/* 左侧 - 主摄像头 + 机械臂视角（左右布局） */}
        {/* 画中画模式 - 主摄像头全屏 + 机械臂画中画 */}
        <div className="relative" style={{ height: 'calc(80vh - 100px)' }}>
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
                  <Play size={14} />
                  <span>主摄像头</span>
                </div>
                <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm">
                  00:42
                </div>
              </div>
            </div>

            {/* 机械臂画中画 */}
            <div 
              className={`pip-container bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/40 ${
                draggingPip === 'arm' ? 'cursor-grabbing' : 'cursor-grab'
              } ${
                pipPositions.arm.x === 0 && pipPositions.arm.y === 0 
                  ? 'absolute bottom-4 right-4'
                  : 'fixed'
              }`}
              style={{
                width: pipSizes.arm.width > 0 ? `${pipSizes.arm.width}px` : expandedPip === 'arm' ? '33.33%' : '16.67%',
                height: pipSizes.arm.height > 0 ? `${pipSizes.arm.height}px` : undefined,
                aspectRatio: pipSizes.arm.height > 0 ? undefined : '4/3',
                ...(pipPositions.arm.x !== 0 || pipPositions.arm.y !== 0 
                  ? { left: `${pipPositions.arm.x}px`, top: `${pipPositions.arm.y}px`, zIndex: 1000 }
                  : {}
                ),
                transition: draggingPip === 'arm' || resizingPip === 'arm' ? 'none' : 'all 300ms'
              }}
              onMouseDown={(e) => handleDragStart(e, 'arm')}
              onClick={() => {
                if (isDragged || isResized) {
                  setIsDragged(false);
                  setIsResized(false);
                  return;
                }

                setPipPositions(prev => ({
                  ...prev,
                  arm: { x: 0, y: 0 }
                }));
                setPipSizes(prev => ({
                  ...prev,
                  arm: { width: 0, height: 0 }
                }));
                setExpandedPip(expandedPip === 'arm' ? null : 'arm');
              }}
            >
              <img
                src={handCameraView}
                alt="机械臂视角"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                <div className="text-white text-xs font-medium flex items-center gap-1">
                  <Move size={12} />
                  机械臂视角
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <button 
                  className="bg-black/50 backdrop-blur-md text-white p-1 rounded hover:bg-black/70 transition-colors"
                  onClick={(e) => resetPipPosition('arm', e)}
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
                onMouseDown={(e) => handleResizeStart(e, 'arm')}
              />
            </div>
          </div>
        </div>

        {/* 右侧 - 审核操作 + 审核意见 */}
        <ReviewActions
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentTime={currentTime}
          duration={duration}
          setCurrentTime={setCurrentTime}
          formatTime={formatTime}
          dataValidity={dataValidity}
          setDataValidity={setDataValidity}
          dataCompleteness={dataCompleteness}
          setDataCompleteness={setDataCompleteness}
          selectedErrorTags={selectedErrorTags}
          setSelectedErrorTags={setSelectedErrorTags}
          reviewComment={reviewComment}
          setReviewComment={setReviewComment}
          isFirstClip={isFirstClip}
          isLastClip={isLastClip}
          handlePreviousClip={handlePreviousClip}
          handleNextClip={handleNextClip}
          handleSubmitReview={handleSubmitReview}
        />
      </div>

      {/* 折叠的姿态数据 */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsPoseDataExpanded(!isPoseDataExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">姿态数据详情</span>
            <span className="text-xs text-gray-500">（机械臂姿态、GELLOW操作器姿态）</span>
          </div>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${isPoseDataExpanded ? 'rotate-90' : ''}`} />
        </button>

        {isPoseDataExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              {/* 机械臂姿态 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900">机械臂姿态</h4>
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
                    <div className="text-sm font-semibold text-gray-900">30.0°</div>
                  </div>
                </div>
              </div>

              {/* GELLOW操作器姿态 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">机械臂姿态</h4>
                  
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* 关节1 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节1</div>
                    <div className="text-sm font-semibold text-gray-900">45.2°</div>
                  </div>

                  {/* 关节2 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节2</div>
                    <div className="text-sm font-semibold text-gray-900">-30.5°</div>
                  </div>

                  {/* 关节3 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节3</div>
                    <div className="text-sm font-semibold text-gray-900">60.8°</div>
                  </div>

                  {/* 关节4 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节4</div>
                    <div className="text-sm font-semibold text-gray-900">15.2°</div>
                  </div>

                  {/* 关节5 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节5</div>
                    <div className="text-sm font-semibold text-gray-900">-8.7°</div>
                  </div>

                  {/* 关节6 */}
                  <div className="border border-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">关节6</div>
                    <div className="text-sm font-semibold text-gray-900">90.0°</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 动作对比分析折叠栏 */}
      <div className="border border-gray-200 rounded-lg mt-4">
        <button
          onClick={() => setIsActionComparisonExpanded(!isActionComparisonExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">动作对比分析</span>
            <span className="text-xs text-gray-500">（Action vs Observation）</span>
          </div>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${isActionComparisonExpanded ? 'rotate-90' : ''}`} />
        </button>

        {isActionComparisonExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              {/* Roll图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Roll</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[-1, 0]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {rollLines.action && <Line type="monotone" dataKey="action_roll" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {rollLines.obs && <Line type="monotone" dataKey="obs_roll" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rollLines.action}
                      onChange={(e) => setRollLines({ ...rollLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_roll.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rollLines.obs}
                      onChange={(e) => setRollLines({ ...rollLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_roll.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Angle图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Angle</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[0.5, 2]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {angleLines.action && <Line type="monotone" dataKey="action_angle" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {angleLines.obs && <Line type="monotone" dataKey="obs_angle" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={angleLines.action}
                      onChange={(e) => setAngleLines({ ...angleLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_angle.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={angleLines.obs}
                      onChange={(e) => setAngleLines({ ...angleLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_angle.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Gripper图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Gripper</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[0.3, 1.3]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {gripperLines.action && <Line type="monotone" dataKey="action_gripper" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {gripperLines.obs && <Line type="monotone" dataKey="obs_gripper" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gripperLines.action}
                      onChange={(e) => setGripperLines({ ...gripperLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_gripper.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gripperLines.obs}
                      onChange={(e) => setGripperLines({ ...gripperLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_gripper.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Pitch图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Pitch</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[-0.2, 0.8]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {pitchLines.action && <Line type="monotone" dataKey="action_pitch" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {pitchLines.obs && <Line type="monotone" dataKey="obs_pitch" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pitchLines.action}
                      onChange={(e) => setPitchLines({ ...pitchLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_pitch.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pitchLines.obs}
                      onChange={(e) => setPitchLines({ ...pitchLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_pitch.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Yaw图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Yaw</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[-0.8, 0.4]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {yawLines.action && <Line type="monotone" dataKey="action_yaw" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {yawLines.obs && <Line type="monotone" dataKey="obs_yaw" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yawLines.action}
                      onChange={(e) => setYawLines({ ...yawLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_yaw.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yawLines.obs}
                      onChange={(e) => setYawLines({ ...yawLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_yaw.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Velocity图表 */}
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Velocity</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart 
                    data={comparisonData}
                    onMouseMove={(e: any) => {
                      if (e && e.activeLabel !== undefined) {
                        setHoveredFrame(e.activeLabel);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredFrame(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} stroke="#9ca3af" domain={[0, 1.2]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    {hoveredFrame !== null && <ReferenceLine x={hoveredFrame} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                    {velocityLines.action && <Line type="monotone" dataKey="action_velocity" stroke="#3b82f6" strokeWidth={2} dot={false} name="Action" isAnimationActive={false} />}
                    {velocityLines.obs && <Line type="monotone" dataKey="obs_velocity" stroke="#10b981" strokeWidth={2} dot={false} name="Obs" isAnimationActive={false} />}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={velocityLines.action}
                      onChange={(e) => setVelocityLines({ ...velocityLines, action: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Action</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.action_velocity.toFixed(3) : '--'}
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={velocityLines.obs}
                      onChange={(e) => setVelocityLines({ ...velocityLines, obs: e.target.checked })}
                      className="w-3.5 h-3.5 text-green-500 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700 w-20">Observation</span>
                    <span className="text-xs font-mono text-gray-600">
                      {hoveredFrame !== null ? comparisonData[hoveredFrame]?.obs_velocity.toFixed(3) : '--'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 图例 */}
            <div className="mt-4 flex items-center justify-center gap-6">
              
              
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// 双臂审核界面
function DualArmReview(props: any) {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    setCurrentTime,
    formatTime,
    dataValidity,
    setDataValidity,
    dataCompleteness,
    setDataCompleteness,
    selectedErrorTags,
    setSelectedErrorTags,
    reviewComment,
    setReviewComment,
    isPoseDataExpanded,
    setIsPoseDataExpanded,
    isFirstClip,
    isLastClip,
    handlePreviousClip,
    handleNextClip,
    handleSubmitReview
  } = props;

  // 画中画展开状态
  const [expandedPip, setExpandedPip] = useState<string | null>(null); // null | 'left' | 'right' | 'both'

  // 画中画位置和大小状态
  const [pipPositions, setPipPositions] = useState<{[key: string]: {x: number, y: number}}>({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 }
  });
  const [pipSizes, setPipSizes] = useState<{[key: string]: {width: number, height: number}}>({
    left: { width: 0, height: 0 },
    right: { width: 0, height: 0 }
  });
  const [draggingPip, setDraggingPip] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingPip, setResizingPip] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const [isResized, setIsResized] = useState(false);

  // 处理画中画点击事件（双臂模式）
  const handlePipClick = (side: 'left' | 'right') => {
    if (isDragged || isResized) {
      setIsDragged(false);
      setIsResized(false);
      return;
    }

    setPipPositions(prev => ({
      ...prev,
      [side]: { x: 0, y: 0 }
    }));
    setPipSizes(prev => ({
      ...prev,
      [side]: { width: 0, height: 0 }
    }));

    if (expandedPip === null) {
      setExpandedPip(side);
    } else if (expandedPip === side) {
      setExpandedPip(null);
    } else if (expandedPip === 'both') {
      setExpandedPip(side === 'left' ? 'right' : 'left');
    } else {
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
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragged(false);
    setDraggingPip(pipId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
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
    setIsResized(false);
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
        setIsDragged(true);
        setPipPositions(prev => ({
          ...prev,
          [draggingPip]: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        }));
      }
      
      if (resizingPip) {
        setIsResized(true);
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

  return (
    <>
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 460px' }}>
        {/* 画中画模式 - 主摄像头全屏 + 左右臂画中画 */}
        <div className="relative" style={{ height: 'calc(80vh - 100px)' }}>
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
                  <Play size={14} />
                  <span>主摄像头</span>
                </div>
                <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm">
                  00:35
                </div>
              </div>
            </div>

            {/* 左臂画中画 */}
            <div 
              className={`pip-container bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/40 ${
                draggingPip === 'left' ? 'cursor-grabbing' : 'cursor-grab'
              } ${
                pipPositions.left.x === 0 && pipPositions.left.y === 0 
                  ? 'absolute bottom-4 right-4'
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
                      ...(expandedPip === 'right' && pipPositions.right.x === 0 && pipPositions.right.y === 0 && { transform: 'translateY(calc(-200% - 1rem))' }),
                      ...(expandedPip === 'both' && pipPositions.right.x === 0 && pipPositions.right.y === 0 && { transform: 'translateY(calc(-100% - 0.5rem))' })
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
          </div>
        </div>

        {/* 右侧 - 审核操作 + 审核意见 */}
        <ReviewActions
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentTime={currentTime}
          duration={duration}
          setCurrentTime={setCurrentTime}
          formatTime={formatTime}
          dataValidity={dataValidity}
          setDataValidity={setDataValidity}
          dataCompleteness={dataCompleteness}
          setDataCompleteness={setDataCompleteness}
          selectedErrorTags={selectedErrorTags}
          setSelectedErrorTags={setSelectedErrorTags}
          reviewComment={reviewComment}
          setReviewComment={setReviewComment}
          isFirstClip={isFirstClip}
          isLastClip={isLastClip}
          handlePreviousClip={handlePreviousClip}
          handleNextClip={handleNextClip}
          handleSubmitReview={handleSubmitReview}
        />
      </div>

      {/* 折叠的姿态数据 */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsPoseDataExpanded(!isPoseDataExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">姿态数据情</span>
            <span className="text-xs text-gray-500">（左臂姿态、右臂姿态、GELLOW操作器姿态）</span>
          </div>
          <ChevronRight size={18} className={`text-gray-400 transition-transform ${isPoseDataExpanded ? 'rotate-90' : ''}`} />
        </button>

        {isPoseDataExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              {/* 左臂姿态 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">左臂姿态</h4>
                  
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">X轴</div>
                    <div className="text-sm font-semibold text-gray-900">-12.3</div>
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

              {/* 右臂姿态 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">右臂姿态</h4>
                  
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">X轴</div>
                    <div className="text-sm font-semibold text-gray-900">18.7°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Y轴</div>
                    <div className="text-sm font-semibold text-gray-900">-52.3°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Z轴</div>
                    <div className="text-sm font-semibold text-gray-900">63.9°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Roll</div>
                    <div className="text-sm font-semibold text-gray-900">-95.4°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pitch</div>
                    <div className="text-sm font-semibold text-gray-900">12.6°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Yaw</div>
                    <div className="text-sm font-semibold text-gray-900">-28.1°</div>
                  </div>
                </div>
              </div>

              {/* GELLOW操作器姿态 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">机械臂姿态</h4>
                  
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节1</div>
                    <div className="text-sm font-semibold text-gray-900">45.2°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节2</div>
                    <div className="text-sm font-semibold text-gray-900">-30.5°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节3</div>
                    <div className="text-sm font-semibold text-gray-900">60.8°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节4</div>
                    <div className="text-sm font-semibold text-gray-900">15.2°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节5</div>
                    <div className="text-sm font-semibold text-gray-900">-8.7°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关节6</div>
                    <div className="text-sm font-semibold text-gray-900">90.0°</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}