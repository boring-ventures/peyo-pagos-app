import { AppState, AppStateStatus } from 'react-native';
import useSettingsStore from '../store/settingsStore';

class SessionService {
  private static instance: SessionService;
  private inactivityTimer: any;
  private lastActiveTime: number = Date.now();
  private appStateListener: any;
  private isInBackground: boolean = false;
  private inactivityCallback?: () => void;

  private constructor() {
    this.setupAppStateListener();
  }

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private setupAppStateListener() {
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    const { pinEnabled } = useSettingsStore.getState();
    
    if (nextAppState === 'background') {
      this.isInBackground = true;
      this.stopInactivityTimer();
    } else if (nextAppState === 'active') {
      if (this.isInBackground && pinEnabled) {
        // App returned from background, trigger security check
        this.triggerSecurityCheck();
      }
      this.isInBackground = false;
      this.resetInactivityTimer();
    }
  };

  setInactivityCallback(callback: () => void) {
    this.inactivityCallback = callback;
  }

  startInactivityTimer() {
    this.resetInactivityTimer();
  }

  stopInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  resetInactivityTimer() {
    this.stopInactivityTimer();
    
    const { pinEnabled } = useSettingsStore.getState();
    if (!pinEnabled) return;

    // Default 5 minutes for demo, configurable
    const timeoutMs = 5 * 60 * 1000; // 5 minutes
    
    this.lastActiveTime = Date.now();
    this.inactivityTimer = setTimeout(() => {
      this.triggerSecurityCheck();
    }, timeoutMs);
  }

  private triggerSecurityCheck() {
    if (this.inactivityCallback) {
      this.inactivityCallback();
    }
  }

  updateActivity() {
    this.lastActiveTime = Date.now();
    this.resetInactivityTimer();
  }

  getLastActiveTime(): number {
    return this.lastActiveTime;
  }

  isSessionExpired(): boolean {
    const { pinEnabled } = useSettingsStore.getState();
    if (!pinEnabled) return false;
    
    const timeoutMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() - this.lastActiveTime > timeoutMs;
  }

  cleanup() {
    this.stopInactivityTimer();
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
  }
}

export const sessionService = SessionService.getInstance(); 