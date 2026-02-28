import { useState } from 'react';
import { Check, Play, ChevronLeft, Circle } from 'lucide-react';
import { Button } from './ui/button';

interface SessionSetupProps {
  onBack: () => void;
  onProceed: (prompt: string) => void;
  clipInfo: {
    clipId: string;
    arm1Device: string;
    arm1Controller: string;
    arm2Device?: string;
    arm2Controller?: string;
    armMode: 'single' | 'double';
  };
}

export default function SessionSetup({ onBack, onProceed, clipInfo }: SessionSetupProps) {
  const [taskPrompt, setTaskPrompt] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  const handleProceed = () => {
    if (isReady && taskPrompt.trim()) {
      onProceed(taskPrompt);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-4 overflow-hidden">
      <div className="max-w-3xl w-full h-full max-h-screen flex flex-col py-2">
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">返回设备选择</span>
        </button>

        {/* 主卡片 - 可滚动区域 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
          {/* 头部 */}
          <div className="border-b border-gray-200 p-3 md:p-6 bg-gray-50 flex-shrink-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">Clip 设置</h2>
            <p className="text-xs md:text-sm text-gray-500">请输入任务提示并准备开始录制</p>
          </div>

          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {/* Clip 信息 */}
            <div className="p-3 md:p-6 border-b border-gray-200">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-3 md:mb-4">当前 Clip</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 md:p-4">
                {clipInfo.armMode === 'single' ? (
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Clip ID</div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.clipId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">机械臂</div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Device}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">操作器</div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Controller}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Clip ID</div>
                      <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.clipId}</div>
                    </div>
                    {clipInfo.armMode === 'single' ? (
                      // 单臂模式
                      <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">设备</div>
                          <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Device}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">控制器</div>
                          <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Controller}</div>
                        </div>
                      </div>
                    ) : clipInfo.arm1Controller === 'GAMEPAD' ? (
                      // 双臂模式+手柄：显示两个不同的手柄
                      <>
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">左臂手柄</div>
                            <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Device}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">右臂手柄</div>
                            <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm2Device}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // 双臂模式+VR/GELLOW：显示单个设备（它们本身支持双手）
                      <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">设备</div>
                          <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Device}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">控器</div>
                          <div className="text-xs md:text-sm font-medium text-gray-900">{clipInfo.arm1Controller}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 任务提示 */}
            <div className="p-3 md:p-6 border-b border-gray-200">
              <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3">任务提示 (Prompt)</h3>
              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                placeholder="请输入当前Clip的任务提示，例如：&quot;将机器人由初始位置移动至摆放台上&quot;"
                className="w-full h-24 md:h-32 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Prompt 模板 */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">快速模板：</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '将物体从A点移动到B点',
                    '抓取桌面上的物体并放置��指位置',
                    '执行物体分拣任务',
                    '完成精密组装操作',
                    '拾取并堆叠多个物体',
                    '执行物体翻转操作'
                  ].map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setTaskPrompt(template)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 准备录制 - 固定在底部 */}
          <div className="p-3 md:p-6 bg-gray-50 flex-shrink-0 border-t border-gray-200">
            <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-2 md:mb-3">设备状态</h3>
            
            {clipInfo.armMode === 'single' ? (
              // 单臂模式：显示一个设备
              <div className="mb-3 md:mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    控制方式：{clipInfo.arm1Controller}
                  </span>
                  
                </div>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    当前设备：{clipInfo.arm1Device}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {isReady ? '已准备就绪' : '等待准备'}
                  </span>
                </div>
              </div>
            ) : clipInfo.arm1Controller === 'GAMEPAD' ? (
              // 双臂模式+手柄：显示两个手柄设备
              <div className="mb-3 md:mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    控制方式：{clipInfo.arm1Controller}
                  </span>
                  
                </div>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    左臂设备：{clipInfo.arm1Device}
                  </span>
                  
                </div>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    右臂设备：{clipInfo.arm2Device}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {isReady ? '已准备就绪' : '等待准备'}
                  </span>
                </div>
              </div>
            ) : (
              // 双臂模式+VR/GELLOW：显示一个设备（它们本身支持双手）
              <div className="mb-3 md:mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    控制方式：{clipInfo.arm1Controller}
                  </span>
                  
                </div>
                <div className="flex items-center gap-2">
                  <Circle size={8} className={isReady ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} />
                  <span className="text-xs md:text-sm text-gray-700">
                    当前设备：{clipInfo.arm1Device}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {isReady ? '已准备就绪' : '等待准备'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 md:gap-3">
              <Button
                onClick={() => setIsReady(!isReady)}
                className={`flex-1 h-9 md:h-10 flex items-center justify-center gap-1.5 md:gap-2 ${
                  isReady 
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' 
                    : taskPrompt.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!taskPrompt.trim()}
              >
                <Check size={14} className="md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">{isReady ? '取消连接' : '准备连接设备'}</span>
              </Button>
              <Button
                onClick={handleProceed}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 md:h-10 flex items-center justify-center gap-1.5 md:gap-2"
                disabled={!isReady}
              >
                <Play size={14} fill="white" className="md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium">开始录制</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-2 px-3 md:px-4 py-2 md:py-3 bg-gray-50 border border-gray-300 rounded-lg flex-shrink-0">
          <p className="text-xs text-gray-600">
            点击"准备"后，请确保设备就位，然后点击"开始录制"进入采集界面
          </p>
        </div>
      </div>
    </div>
  );
}