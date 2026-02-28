import { LogOut } from 'lucide-react';
import type { User } from '../../types';
import { ROLE_NAMES } from '../../constants';
import { formatSessionDuration } from '../../utils/session';

interface UserMenuProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, onClose, onLogout }: UserMenuProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-16 right-6 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-72">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">用户信息</h3>
          <p className="text-xs text-gray-500 mt-1">查看和管理你的账户信息</p>
        </div>
        <div className="p-2">
          <div className="px-4 py-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">用户名</div>
            <div className="text-sm text-gray-900">{user.username}</div>
          </div>
          <div className="px-4 py-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">姓名</div>
            <div className="text-sm text-gray-900">{user.name}</div>
          </div>
          <div className="px-4 py-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">当前角色</div>
            <div className="text-sm text-gray-900">{ROLE_NAMES[user.currentRole]}</div>
          </div>
          <div className="px-4 py-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">会话时长</div>
            <div className="text-sm text-gray-900">{formatSessionDuration(user.loginTime)}</div>
          </div>
          <div className="px-4 py-2 mt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">登出系统</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
