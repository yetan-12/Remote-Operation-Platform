import { useState } from 'react';
import { ChevronDown, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_NAMES, PAGE_TITLES } from '../../constants';
import { formatSessionDuration } from '../../utils/session';
import { Button } from '../ui/button';
import type { UserRole } from '../../types';
import Navigation from './Navigation';
import UserMenu from './UserMenu';
import LogoutConfirmDialog from './LogoutConfirmDialog';

export default function Header() {
  const { currentUser, currentPage, navigateTo, logout, switchRole, addRole, removeRole } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentUser) return null;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowUserMenu(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              RD
            </div>
            <span className="font-semibold text-gray-900">RoboData</span>
          </div>

          {/* 导航标签 */}
          <Navigation currentPage={currentPage} onNavigate={navigateTo} userRoles={currentUser.roles} />
        </div>

        {/* 用户信息 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-sm font-medium">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-700">{currentUser.name}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* 用户菜单弹窗 */}
      {showUserMenu && (
        <UserMenu
          user={currentUser}
          onClose={() => setShowUserMenu(false)}
          onLogout={handleLogoutClick}
        />
      )}

      {/* 登出确认对话框 */}
      {showLogoutConfirm && (
        <LogoutConfirmDialog
          sessionDuration={formatSessionDuration(currentUser.loginTime)}
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
