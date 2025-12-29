import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skill } from '@/types';

const STORAGE_KEY = 'skills';
const ACTIVE_SKILL_KEY = 'activeSkillId';

export const storage = {
  // Get all skills
  async getSkills(): Promise<Skill[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting skills:', error);
      return [];
    }
  },

  // Save all skills
  async saveSkills(skills: Skill[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
    } catch (error) {
      console.error('Error saving skills:', error);
    }
  },

  // Get a single skill by ID
  async getSkill(id: string): Promise<Skill | null> {
    const skills = await this.getSkills();
    return skills.find(s => s.id === id) || null;
  },

  // Save a single skill (add or update)
  async saveSkill(skill: Skill): Promise<void> {
    const skills = await this.getSkills();
    const index = skills.findIndex(s => s.id === skill.id);
    if (index >= 0) {
      skills[index] = skill;
    } else {
      skills.push(skill);
    }
    await this.saveSkills(skills);
  },

  // Delete a skill
  async deleteSkill(id: string): Promise<void> {
    const skills = await this.getSkills();
    const filtered = skills.filter(s => s.id !== id);
    await this.saveSkills(filtered);
  },

  // Get active skill ID
  async getActiveSkillId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_SKILL_KEY);
    } catch (error) {
      console.error('Error getting active skill:', error);
      return null;
    }
  },

  // Set active skill ID
  async setActiveSkillId(id: string | null): Promise<void> {
    try {
      if (id) {
        await AsyncStorage.setItem(ACTIVE_SKILL_KEY, id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_SKILL_KEY);
      }
    } catch (error) {
      console.error('Error setting active skill:', error);
    }
  },
};

