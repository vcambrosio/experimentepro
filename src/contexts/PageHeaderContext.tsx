import { createContext, useContext, useState, ReactNode } from 'react';

interface PageHeaderContextType {
  title: string;
  subtitle: string;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setHeader: (title: string, subtitle?: string) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const setHeader = (newTitle: string, newSubtitle = '') => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return (
    <PageHeaderContext.Provider value={{ title, subtitle, setTitle, setSubtitle, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider');
  }
  return context;
}
