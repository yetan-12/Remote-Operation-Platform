import type { PageType } from '../../types';
import type { UserRole } from '../../types';
import { PAGE_TITLES, PAGE_ORDER, ROLE_TO_PAGE } from '../../constants';

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  userRoles: UserRole[];
}

export default function Navigation({ currentPage, onNavigate, userRoles }: NavigationProps) {
  // Admin also has access to test page
  const allowedSet = new Set(
    userRoles.flatMap((r) => (r === 'admin' ? [ROLE_TO_PAGE[r], 'test'] : [ROLE_TO_PAGE[r]]))
  );
  const allowedPages = PAGE_ORDER.filter((page) => allowedSet.has(page));

  return (
    <nav className="flex items-center gap-6">
      {allowedPages.map((page) => (
        <button
          key={page}
          className={`text-sm font-medium border-b-2 pb-3 -mb-3 transition-colors ${
            currentPage === page
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 border-transparent'
          }`}
          onClick={() => onNavigate(page)}
        >
          {PAGE_TITLES[page]}
        </button>
      ))}
    </nav>
  );
}
