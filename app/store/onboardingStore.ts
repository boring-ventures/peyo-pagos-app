import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  
  // Actions
  markOnboardingCompleted: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  resetOnboarding: () => Promise<void>; // For testing purposes
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedOnboarding: false,
  isLoading: true,

  markOnboardingCompleted: async () => {
    try {
      console.log('✅ OnboardingStore: Marking onboarding as completed');
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      set({ hasCompletedOnboarding: true });
      console.log('✅ OnboardingStore: Onboarding marked as completed');
    } catch (error) {
      console.error('❌ OnboardingStore: Error marking onboarding as completed:', error);
    }
  },

  checkOnboardingStatus: async () => {
    set({ isLoading: true });
    try {
      console.log('🔍 OnboardingStore: Checking onboarding status...');
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      console.log('📱 OnboardingStore: AsyncStorage value:', completed);
      
      const hasCompleted = completed === 'true';
      set({ 
        hasCompletedOnboarding: hasCompleted,
        isLoading: false 
      });
      
      console.log(`🎯 OnboardingStore: Onboarding status set to: ${hasCompleted}`);
    } catch (error) {
      console.error('❌ OnboardingStore: Error checking onboarding status:', error);
      set({ 
        hasCompletedOnboarding: false,
        isLoading: false 
      });
    }
  },

  resetOnboarding: async () => {
    try {
      console.log('🔄 OnboardingStore: Resetting onboarding...');
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      set({ hasCompletedOnboarding: false });
      console.log('🔄 OnboardingStore: Onboarding reset successfully');
    } catch (error) {
      console.error('❌ OnboardingStore: Error resetting onboarding:', error);
    }
  },
})); 