// Firestore Collection Types

export type UserRole = 'student' | 'coach';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface Team {
  id: string;
  name: string;
  coachId: string;
  createdAt: Date;
  playerIds: string[];
}

export interface Question {
  id: string;
  subjectArea: string; // SS, SC, LA, MA, AH
  questionText: string;
  correctAnswer: string;
  distractors: string[];
  level: 'MS' | 'HS';
  isPublic: boolean;
  createdBy: string; // coachId
  teamId?: string; // if private, tied to team
  importDate: Date;
  importYear: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  userId: string;
  teamId: string;
  displayName: string;
  gamesPlayed: number;
  totalScore: number;
  totalQuestions: number;
  avgBuzzTime: number;
  correctBySubject: Record<string, number>;
  createdAt: Date;
}

export interface Game {
  id: string;
  type: 'practice' | 'match';
  playerId: string;
  teamId?: string;
  coachId?: string;
  questionIds: string[];
  startedAt: Date;
  endedAt?: Date;
  status: 'waiting' | 'active' | 'completed';
}

export interface MatchHistory {
  id: string;
  gameId: string;
  playerId: string;
  teamId?: string;
  type: 'practice' | 'match';
  score: number;
  total: number;
  avgBuzzTime: number;
  correctBySubject: Record<string, number>;
  questionIds: string[];
  startedAt: Date;
  completedAt: Date;
  hesitationCount: number;
}

export interface LeaderboardEntry {
  id: string;
  playerId: string;
  teamId: string;
  displayName: string;
  accuracy: number;
  avgBuzzTime: number;
  wins: number;
  highScore: number;
  totalGames: number;
  lastUpdated: Date;
}

export interface GameSettings {
  questionTime: number;
  hesitationTime: number;
  wpm: number;
  teamId?: string;
}

export interface MatchState {
  gameId: string;
  currentQuestionIndex: number;
  questionStartTime: number;
  buzzerState: 'idle' | 'locked' | 'buzzed';
  buzzedBy?: string;
  buzzedAt?: number;
  revealedWordsCount: number;
  questionFullyRevealed: boolean;
}





