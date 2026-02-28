import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { AccountConfig, UserRole } from '../types';
import { DEFAULT_ACCOUNTS } from '../constants';

interface AccountsContextValue {
  accounts: AccountConfig[];
  addAccount: (account: AccountConfig) => void;
  updateAccount: (username: string, partial: Partial<AccountConfig>) => void;
}

const AccountsContext = createContext<AccountsContextValue | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountConfig[]>(() => [...DEFAULT_ACCOUNTS]);

  const addAccount = useCallback((account: AccountConfig) => {
    setAccounts((prev) => {
      if (prev.some((a) => a.username === account.username)) return prev;
      return [...prev, account];
    });
  }, []);

  const updateAccount = useCallback((username: string, partial: Partial<AccountConfig>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.username === username ? { ...a, ...partial } : a))
    );
  }, []);

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, updateAccount }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}
