import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { School } from '@/services/masterAdminService';

interface SchoolContextType {
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
  clearSelectedSchool: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const clearSelectedSchool = () => setSelectedSchool(null);

  // Persist selected school in session storage
  useEffect(() => {
    if (selectedSchool) {
      sessionStorage.setItem('selectedSchool', JSON.stringify(selectedSchool));
    } else {
      sessionStorage.removeItem('selectedSchool');
    }
  }, [selectedSchool]);

  // Load persisted school on mount
  useEffect(() => {
    const persistedSchool = sessionStorage.getItem('selectedSchool');
    if (persistedSchool) {
      try {
        setSelectedSchool(JSON.parse(persistedSchool));
      } catch (error) {
        console.error('Error parsing stored school:', error);
        sessionStorage.removeItem('selectedSchool');
      }
    }
  }, []);

  return (
    <SchoolContext.Provider value={{ selectedSchool, setSelectedSchool, clearSelectedSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
