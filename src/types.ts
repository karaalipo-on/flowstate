/**
 * Type definitions for ZenSpace Workspace application
 */

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedPomodoros: number;
  completedPomodoros: number;
  subtasks: SubTask[];
  notes?: string;
  createdAt: number;
}

export type SceneCategory = 'nature' | 'city' | 'study' | 'aesthetic' | 'lofi';

export interface Scene {
  id: string;
  name: string;
  category: SceneCategory;
  type: 'video' | 'youtube' | 'ai-image';
  url: string; // Active URL/ID or base64 Data URL
  youtubeId?: string; // Original YouTube Video ID if any
  videoUrl?: string;  // Direct High-Performance MP4 fallback if any
  isAiGenerated?: boolean;
  prompt?: string;
  credit: string;
  thumbnailUrl?: string;
}

export type SoundGeneratorType = 
  | 'binaural' 
  | 'theta' 
  | 'delta' 
  | 'cafe' 
  | 'waves' 
  | 'wind' 
  | 'rain' 
  | 'birds' 
  | 'forest' 
  | 'water'
  | 'drive';

export interface AmbientSound {
  id: string;
  name: string;
  iconName: string; // Maps to lucide icons
  type: SoundGeneratorType;
  volume: number; // 0 to 1
  isPlaying: boolean;
}

export type TimerMode = 'work' | 'short' | 'long';

export interface TimerSettings {
  work: number; // in minutes
  short: number; // in minutes
  long: number; // in minutes
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface NotesState {
  id: string;
  title: string;
  content: string;
  lastSaved: number;
}
