import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface UserState {
  userData: UserData | null;
  isOnline: boolean;
  lastActivity: string | null;
}

const initialState: UserState = {
  userData: null,
  isOnline: true,
  lastActivity: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<UserData>) => {
      state.userData = action.payload;
    },
    clearUserData: (state) => {
      state.userData = null;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    updateLastActivity: (state, action: PayloadAction<string>) => {
      state.lastActivity = action.payload;
    },
  },
});

export const { setUserData, clearUserData, setOnlineStatus, updateLastActivity } = userSlice.actions;

export default userSlice.reducer; 