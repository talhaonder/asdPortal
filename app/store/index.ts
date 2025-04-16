import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer, { UserState } from './slices/userSlice';

export interface RootState {
  auth: ReturnType<typeof authReducer>;
  user: UserState;
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
  },
});

export type AppDispatch = typeof store.dispatch; 