import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

interface SessionRenewalDialogProps {
  onContinue: () => void;
  onTimeout: () => void;
  timeoutSeconds?: number;
}

export default function SessionRenewalDialog({
  onContinue,
  onTimeout,
  timeoutSeconds = 60,
}: SessionRenewalDialogProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutSeconds);
  const onTimeoutRef = useRef(onTimeout);

  // 保持 onTimeout 引用最新
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    // 倒计时
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 当倒计时到 0 时，触发超时回调
  useEffect(() => {
    if (remainingSeconds === 0) {
      onTimeoutRef.current();
    }
  }, [remainingSeconds]);

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* 图标和标题 */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">会话即将过期</h3>
          <p className="text-gray-600 text-center">
            您已登录超过1小时，是否继续当前会话？
          </p>
        </div>

        {/* 倒计时显示 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">
              {remainingSeconds > 0 ? (
                <>
                  如果 <span className="font-bold text-lg mx-1">{remainingSeconds}</span> 秒内未响应，系统将自动退出登录
                </>
              ) : (
                <span className="font-bold">正在退出登录...</span>
              )}
            </span>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <Button
            onClick={onTimeout}
            variant="outline"
            className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            立即退出
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
            disabled={remainingSeconds === 0}
          >
            继续会话
          </Button>
        </div>

        {/* 提示信息 */}
        <p className="text-xs text-gray-500 text-center mt-4">
          点击"继续会话"后，会话时长将重新计算
        </p>
      </div>
    </div>
  );
}