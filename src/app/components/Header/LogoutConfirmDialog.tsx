import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface LogoutConfirmDialogProps {
  sessionDuration: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmDialog({ sessionDuration, onConfirm, onCancel }: LogoutConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 警告图标 */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="text-orange-600" size={24} />
            </div>
          </div>

          {/* 确认文字 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认登出</h3>
            <p className="text-sm text-gray-600">您确定要登出系统吗？</p>
            <p className="text-sm text-gray-500 mt-2">当前会话时长：{sessionDuration}</p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 p-5 border-t border-gray-200">
          <Button
            onClick={onCancel}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          >
            取消
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            确认登出
          </Button>
        </div>
      </div>
    </div>
  );
}
