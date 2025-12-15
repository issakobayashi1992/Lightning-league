import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Question,
  Team,
  Player,
  Game,
  MatchHistory,
  LeaderboardEntry,
  GameSettings,
} from '../types/firebase';

// Questions Collection
export const questionsCollection = collection(db, 'questions');

export const createQuestion = async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
  const questionRef = doc(questionsCollection);
  
  // Build document data, filtering out undefined values
  const questionDocData: any = {
    subjectArea: question.subjectArea,
    questionText: question.questionText,
    correctAnswer: question.correctAnswer,
    distractors: question.distractors,
    level: question.level,
    isPublic: question.isPublic,
    createdBy: question.createdBy,
    importDate: question.importDate,
    importYear: question.importYear,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Only include optional fields if they're defined
  if (question.teamId !== undefined && question.teamId !== null && question.teamId !== '') {
    questionDocData.teamId = question.teamId;
  }
  
  await setDoc(questionRef, questionDocData);
  return questionRef.id;
};

export const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
  const questionRef = doc(db, 'questions', questionId);
  
  // Build update data, filtering out undefined values
  const updateData: any = {};
  
  // Copy defined fields
  Object.keys(updates).forEach(key => {
    const value = (updates as any)[key];
    if (value !== undefined) {
      updateData[key] = value;
    }
  });
  
  updateData.updatedAt = serverTimestamp();
  
  await updateDoc(questionRef, updateData);
};

export const deleteQuestion = async (questionId: string) => {
  await deleteDoc(doc(db, 'questions', questionId));
};

export const getQuestions = async (
  filters?: {
    isPublic?: boolean;
    teamId?: string;
    coachId?: string;
    subjectArea?: string;
    minYear?: number;
    maxYear?: number;
  }
) => {
  let q = query(questionsCollection);

  if (filters?.isPublic !== undefined) {
    q = query(q, where('isPublic', '==', filters.isPublic));
  }
  if (filters?.teamId) {
    q = query(q, where('teamId', '==', filters.teamId));
  }
  if (filters?.coachId) {
    q = query(q, where('createdBy', '==', filters.coachId));
  }
  if (filters?.subjectArea) {
    q = query(q, where('subjectArea', '==', filters.subjectArea));
  }
  if (filters?.minYear) {
    q = query(q, where('importYear', '>=', filters.minYear));
  }
  if (filters?.maxYear) {
    q = query(q, where('importYear', '<=', filters.maxYear));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    importDate: doc.data().importDate?.toDate() || new Date(),
  })) as Question[];
};

// Teams Collection
export const teamsCollection = collection(db, 'teams');

export const createTeam = async (team: Omit<Team, 'id' | 'createdAt'>) => {
  const teamRef = doc(teamsCollection);
  await setDoc(teamRef, {
    ...team,
    createdAt: serverTimestamp(),
  });
  return teamRef.id;
};

export const getTeam = async (teamId: string) => {
  const teamDoc = await getDoc(doc(db, 'teams', teamId));
  if (teamDoc.exists()) {
    return { id: teamDoc.id, ...teamDoc.data() } as Team;
  }
  return null;
};

// Players Collection
export const playersCollection = collection(db, 'players');

export const getPlayer = async (playerId: string) => {
  const playerDoc = await getDoc(doc(db, 'players', playerId));
  if (playerDoc.exists()) {
    return { id: playerDoc.id, ...playerDoc.data() } as Player;
  }
  return null;
};

export const getPlayersByTeam = async (teamId: string) => {
  const q = query(playersCollection, where('teamId', '==', teamId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Player[];
};

export const updatePlayerStats = async (playerId: string, stats: Partial<Player>) => {
  const playerRef = doc(db, 'players', playerId);
  await updateDoc(playerRef, stats);
};

// Games Collection
export const gamesCollection = collection(db, 'games');

export const createGame = async (game: Omit<Game, 'id' | 'startedAt'>) => {
  const gameRef = doc(gamesCollection);
  
  // Build document data, filtering out undefined values
  const gameDocData: any = {
    type: game.type,
    playerId: game.playerId,
    questionIds: game.questionIds,
    status: game.status,
    startedAt: serverTimestamp(),
  };
  
  // Only include optional fields if they're defined
  if (game.teamId !== undefined && game.teamId !== null && game.teamId !== '') {
    gameDocData.teamId = game.teamId;
  }
  if (game.coachId !== undefined && game.coachId !== null && game.coachId !== '') {
    gameDocData.coachId = game.coachId;
  }
  
  await setDoc(gameRef, gameDocData);
  return gameRef.id;
};

export const updateGame = async (gameId: string, updates: Partial<Game>) => {
  const gameRef = doc(db, 'games', gameId);
  const updateData: any = { ...updates };
  
  // Only include endedAt if it's being set
  if (updates.endedAt !== undefined) {
    updateData.endedAt = serverTimestamp();
  }
  
  // Remove any undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });
  
  await updateDoc(gameRef, updateData);
};

export const getGame = async (gameId: string) => {
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  if (gameDoc.exists()) {
    return { id: gameDoc.id, ...gameDoc.data() } as Game;
  }
  return null;
};

// Match History Collection
export const matchHistoryCollection = collection(db, 'matchHistory');

export const createMatchHistory = async (match: Omit<MatchHistory, 'id' | 'startedAt' | 'completedAt'>) => {
  const matchRef = doc(matchHistoryCollection);
  
  // Build document data, filtering out undefined values
  const matchDocData: any = {
    gameId: match.gameId,
    playerId: match.playerId,
    type: match.type,
    score: match.score,
    total: match.total,
    avgBuzzTime: match.avgBuzzTime,
    correctBySubject: match.correctBySubject,
    questionIds: match.questionIds,
    hesitationCount: match.hesitationCount,
    startedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  };
  
  // Only include optional fields if they're defined
  if (match.teamId !== undefined && match.teamId !== null && match.teamId !== '') {
    matchDocData.teamId = match.teamId;
  }
  
  await setDoc(matchRef, matchDocData);
  return matchRef.id;
};

export const getMatchHistoryByPlayer = async (playerId: string, limitCount: number = 50) => {
  const q = query(
    matchHistoryCollection,
    where('playerId', '==', playerId),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startedAt: doc.data().startedAt?.toDate() || new Date(),
    completedAt: doc.data().completedAt?.toDate() || new Date(),
  })) as MatchHistory[];
};

export const getMatchHistoryByTeam = async (teamId: string, limitCount: number = 100) => {
  const q = query(
    matchHistoryCollection,
    where('teamId', '==', teamId),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startedAt: doc.data().startedAt?.toDate() || new Date(),
    completedAt: doc.data().completedAt?.toDate() || new Date(),
  })) as MatchHistory[];
};

// Leaderboards Collection
export const leaderboardsCollection = collection(db, 'leaderboards');

export const getTeamLeaderboard = async (teamId: string) => {
  const q = query(
    leaderboardsCollection,
    where('teamId', '==', teamId),
    orderBy('accuracy', 'desc'),
    orderBy('avgBuzzTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
  })) as LeaderboardEntry[];
};

// Settings Collection
export const settingsCollection = collection(db, 'settings');

export const getGameSettings = async (teamId?: string) => {
  const settingsRef = doc(db, 'settings', teamId || 'default');
  const settingsDoc = await getDoc(settingsRef);
  if (settingsDoc.exists()) {
    return settingsDoc.data() as GameSettings;
  }
  // Return default settings
  return {
    questionTime: 10,
    hesitationTime: 5,
    wpm: 150,
  } as GameSettings;
};

export const updateGameSettings = async (settings: GameSettings, teamId?: string) => {
  const settingsRef = doc(db, 'settings', teamId || 'default');
  
  // Build document data, filtering out undefined values
  const settingsDocData: any = {
    questionTime: settings.questionTime,
    hesitationTime: settings.hesitationTime,
    wpm: settings.wpm,
  };
  
  // Only include optional fields if they're defined
  if (settings.teamId !== undefined && settings.teamId !== null && settings.teamId !== '') {
    settingsDocData.teamId = settings.teamId;
  }
  
  await setDoc(settingsRef, settingsDocData);
};







