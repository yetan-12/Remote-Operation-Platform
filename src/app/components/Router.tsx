import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_TO_PAGE } from '../constants';

const CollectorDashboard = lazy(() => import('./CollectorDashboard'));
const ReviewerDashboard = lazy(() => import('./ReviewerDashboard'));
const PlatformDashboard = lazy(() => import('./PlatformDashboard'));
const TestingConnection = lazy(() => import('./testing-connection/TestingConnection'));

// 加载中组件
function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function Router() {
  const { currentPage, currentUser, navigateTo } = useAuth();

  // If current page is not allowed for user's roles, redirect to default workspace
  useEffect(() => {
    if (!currentUser) return;
    const allowedPages = [
      ...new Set(
        currentUser.roles.flatMap((r) =>
          r === 'admin' ? [ROLE_TO_PAGE[r], 'test'] : [ROLE_TO_PAGE[r]]
        )
      ),
    ];
    if (!allowedPages.includes(currentPage)) {
      navigateTo(ROLE_TO_PAGE[currentUser.roles[0]]);
    }
  }, [currentUser, currentPage, navigateTo]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {currentPage === 'collect' && <CollectorDashboard />}
      {currentPage === 'chain' && <ReviewerDashboard />}
      {currentPage === 'platform' && <PlatformDashboard user={currentUser!} />}
      {currentPage === 'test' && <TestingConnection />}
    </Suspense>
  );
}
