import React, { createContext, useState, useContext } from 'react';

interface UserData {
  kullaniciId: number;
  adi: string;
  soyadi: string;
  adSoyad: string;
  kullaniciAdi: string;
  telNo: string;
  mail: string;
  gorev: string;
}

type UserContextType = {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);

  return (
    <UserContext.Provider
      value={{
        userData,
        setUserData,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 