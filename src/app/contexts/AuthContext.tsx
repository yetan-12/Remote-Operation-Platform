import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, UserRole, PageType } from '../types';
import { ROLE_TO_PAGE, PAGE_TO_ROLE } from '../constants';
import { useAccounts } from './AccountsContext';
import {
  generateSessionId,
  getCurrentTimestamp,
  saveSession,
  restoreSession,
  clearSession,
  isSessionExpired,
} from '../utils/session';
import SessionRenewalDialog from '../components/SessionRenewalDialog';

interface AuthContextValue {
  currentUser: User | null;
  currentPage: PageType;
  isCheckingSession: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addRole: (role: UserRole) => void;
  removeRole: (role: UserRole) => void;
  navigateTo: (page: PageType) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Default page for a role; each role has exactly one workspace
function getDefaultPageForRole(role: UserRole): PageType {
  return ROLE_TO_PAGE[role];
}

// Allowed pages for given roles (admin also has test page)
function getAllowedPages(roles: UserRole[]): PageType[] {
  return [
    ...new Set(
      roles.flatMap((r) => (r === 'admin' ? [ROLE_TO_PAGE[r], 'test'] : [ROLE_TO_PAGE[r]]))
    ),
  ];
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { accounts } = useAccounts();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('collect');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);

  // Restore session from localStorage; ensure currentPage is allowed for user roles
  useEffect(() => {
    const session = restoreSession();
    if (session) {
      const user = session.user;
      const allowed = getAllowedPages(user.roles);
      const savedPage = session.currentPage;
      const page = allowed.includes(savedPage) ? savedPage : getDefaultPageForRole(user.roles[0]);
      setCurrentUser(user);
      setCurrentPage(page);
      console.log('会话已恢复:', user.username);
    }
    setIsCheckingSession(false);
  }, []);

  // 保存会话到localStorage
  useEffect(() => {
    if (currentUser) {
      saveSession({
        user: currentUser,
        currentPage,
        loginTime: currentUser.loginTime,
      });
    }
  }, [currentUser, currentPage]);

  // 定时检查会话有效性
  useEffect(() => {
    if (!currentUser) return;

    const checkSession = () => {
      if (isSessionExpired(currentUser.loginTime)) {
        // 显示续期对话框而不是直接登出
        setShowRenewalDialog(true);
      }
    };

    // 每分钟检查一次
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 处理会话续期
  const handleContinueSession = useCallback(() => {
    if (currentUser) {
      // 更新登录时间为当前时间，重新开始计时
      const newLoginTime = getCurrentTimestamp();
      const updatedUser: User = {
        ...currentUser,
        loginTime: newLoginTime,
      };
      setCurrentUser(updatedUser);
      setShowRenewalDialog(false);
      console.log('会话已续期:', {
        username: currentUser.username,
        newLoginTime,
      });
    }
  }, [currentUser]);

  // 处理会话超时或用户主动退出
  const handleSessionTimeout = useCallback(() => {
    setShowRenewalDialog(false);
    // 直接清除会话，不依赖 logout 函数
    if (currentUser) {
      console.log('会话超时，用户登出:', {
        username: currentUser.username,
        name: currentUser.name,
        sessionId: currentUser.sessionId,
        logoutTime: getCurrentTimestamp(),
      });
    }
    setCurrentUser(null);
    setCurrentPage('collect');
    clearSession();
    alert('会话已过期，请重新登录');
  }, [currentUser]);

  const login = (username: string, password: string): boolean => {
    const account = accounts.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (account) {
      const sessionId = generateSessionId();
      const loginTime = getCurrentTimestamp();
      const defaultPage = getDefaultPageForRole(account.roles[0]);

      const user: User = {
        username: account.username,
        name: account.name,
        roles: account.roles,
        currentRole: account.roles[0],
        loginTime,
        sessionId,
      };

      setCurrentUser(user);
      setCurrentPage(defaultPage);

      console.log('用户登录:', {
        username: user.username,
        name: user.name,
        sessionId,
        loginTime,
        defaultPage,
      });

      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      // 记录登出日志
      console.log('用户登出:', {
        username: currentUser.username,
        name: currentUser.name,
        sessionId: currentUser.sessionId,
        logoutTime: getCurrentTimestamp(),
      });
    }

    // 清除会话状态
    setCurrentUser(null);
    setCurrentPage('collect');
    clearSession();
  };

  const switchRole = (newRole: UserRole) => {
    if (currentUser && currentUser.roles.includes(newRole)) {
      setCurrentUser({
        ...currentUser,
        currentRole: newRole,
      });
      setCurrentPage(getDefaultPageForRole(newRole));
    }
  };

  const addRole = (role: UserRole) => {
    if (currentUser && !currentUser.roles.includes(role)) {
      const newRoles = [...currentUser.roles, role];
      setCurrentUser({
        ...currentUser,
        roles: newRoles,
      });
    }
  };

  const removeRole = (role: UserRole) => {
    if (currentUser && currentUser.roles.includes(role) && role !== currentUser.currentRole) {
      const newRoles = currentUser.roles.filter((r) => r !== role);
      setCurrentUser({
        ...currentUser,
        roles: newRoles,
      });
    }
  };

  const navigateTo = (page: PageType) => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    const requiredRole = PAGE_TO_ROLE[page];
    if (!currentUser.roles.includes(requiredRole)) {
      alert('您没有权限访问该工作区');
      return;
    }
    setCurrentPage(page);
  };

  const value: AuthContextValue = {
    currentUser,
    currentPage,
    isCheckingSession,
    login,
    logout,
    switchRole,
    addRole,
    removeRole,
    navigateTo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showRenewalDialog && (
        <SessionRenewalDialog
          onContinue={handleContinueSession}
          onTimeout={handleSessionTimeout}
          timeoutSeconds={60}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}