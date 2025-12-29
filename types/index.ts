export interface DailyLog {
  date: string; // ISO date string (YYYY-MM-DD)
  minutes: number;
}

export interface Skill {
  id: string;
  title: string;
  category: string;
  motivation?: string;
  createdAt: string; // ISO string
  totalMinutes: number;
  dailyLogs: DailyLog[];
  isActive?: boolean; // Currently counting
  lastActiveAt?: string; // ISO string - when counting started
  startTime?: number; // Timestamp when counting started
  hasShownConfetti?: boolean; // Track if confetti was already shown
}

export type RootStackParamList = {
  home: undefined;
  skillDetail: { skillId: string };
  counting: { skillId: string };
  addSkill: { skillId?: string }; // Optional for edit mode
};

