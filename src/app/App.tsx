import { AccountsProvider } from './contexts/AccountsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DevicesProvider } from './contexts/DevicesContext';
import { ClipAssignmentsProvider } from './contexts/ClipAssignmentsContext';
import { OperationLogProvider } from './contexts/OperationLogContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Router from './components/Router';

// 加载中组件
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">正在加载系统...</p>
      </div>
    </div>
  );
}

// 主应用内容
function AppContent() {
  const { currentUser, isCheckingSession } = useAuth();

  // 正在检查会话状态
  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  // 根据用户登录状态显示不同页面
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <Router />
    </div>
  );
}

// 根组件 - 确保 AuthProvider 正确包裹所有内容
export default function App() {
  return (
    <AccountsProvider>
      <DevicesProvider>
        <AuthProvider>
          <ClipAssignmentsProvider>
            <OperationLogProvider>
              <AppContent />
            </OperationLogProvider>
          </ClipAssignmentsProvider>
        </AuthProvider>
      </DevicesProvider>
    </AccountsProvider>
  );
}