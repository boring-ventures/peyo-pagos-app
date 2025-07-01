import { ImageFile } from '@/app/components/ImagePickerModal';
import { LoadingScreen } from '@/app/components/LoadingScreen';
import { useAuthStore } from '@/app/store/authStore';
import React, { createContext, useContext, useEffect } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      avatar_url?: string;
    },
    avatar?: ImageFile | null
  ) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  } = useAuthStore();

  useEffect(() => {
    console.log('🛡️ AuthContext: Auth state changed:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('⏳ AuthContext: Still loading, showing LoadingScreen');
    return <LoadingScreen />;
  }

  console.log('🛡️ AuthContext: Rendering children with auth state:', { isAuthenticated });

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 