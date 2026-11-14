import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MyDeskContextType {
  activeVisit: any | null;
  setActiveVisit: (visit: any | null) => void;
  refetchVisits: () => void;
  staffId?: string;
  locationId?: string;
}

const MyDeskContext = createContext<MyDeskContextType | undefined>(undefined);

export const MyDeskProvider = ({
  children,
  staffId,
  locationId,
}: {
  children: ReactNode;
  staffId?: string;
  locationId?: string;
}) => {
  const [activeVisit, setActiveVisit] = useState<any | null>(null);

  const refetchVisits = () => {
    window.dispatchEvent(new Event('my-desk-refetch'));
  };

  return (
    <MyDeskContext.Provider
      value={{
        activeVisit,
        setActiveVisit,
        refetchVisits,
        staffId,
        locationId,
      }}
    >
      {children}
    </MyDeskContext.Provider>
  );
};

export const useMyDesk = () => {
  const context = useContext(MyDeskContext);
  if (!context) {
    throw new Error('useMyDesk must be used within a MyDeskProvider');
  }
  return context;
};
