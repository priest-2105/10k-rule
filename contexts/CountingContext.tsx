import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { storage } from '@/utils/storage';
import { Skill } from '@/types';

interface CountingContextType {
  activeSkillId: string | null;
  refreshActiveSkill: () => Promise<void>;
}

const CountingContext = createContext<CountingContextType | undefined>(undefined);

export function CountingProvider({ children }: { children: React.ReactNode }) {
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);

  const refreshActiveSkill = useCallback(async () => {
    const activeId = await storage.getActiveSkillId();
    setActiveSkillId(activeId);
  }, []);

  useEffect(() => {
    refreshActiveSkill();

    // Listen for app state changes to refresh when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - refresh active skill
        refreshActiveSkill();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshActiveSkill]);

  return (
    <CountingContext.Provider value={{ activeSkillId, refreshActiveSkill }}>
      {children}
    </CountingContext.Provider>
  );
}

export function useCounting() {
  const context = useContext(CountingContext);
  if (context === undefined) {
    throw new Error('useCounting must be used within a CountingProvider');
  }
  return context;
}

