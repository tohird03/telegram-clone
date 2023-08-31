import {useEffect, useState} from 'react';
import { authStore } from '../store/auth';

export const useBootstrap = () => {
  const [isInitiated, setIsInitiated] = useState(true);
  const accessToken = window.localStorage.getItem('access_token')
  const refreshToken = window.localStorage.getItem('refresh_token')
  const user = window.localStorage.getItem('user')

  const setToken = () => {
    if (accessToken && refreshToken) {
      authStore.setIsAuth(true);
      authStore.setUser(JSON.parse(user!))
    }
  };

  const getAppConfigs = async () => {
    try {
      await setToken();

      setIsInitiated(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAppConfigs();
  }, []);

  return [isInitiated];
};
