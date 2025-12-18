import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getQuestions, createGame, createMatchHistory, updatePlayerStats, getGameSettings, getPlayer } from '../services/firestore';
import { Question, MatchHistory } from '../types/firebase';
import { Bolt, ArrowLeft } from 'lucide-react';

const COLOR_THEME = {
  A_RED: '#FF416C',
  B_BLUE: '#4F5CF7',
  C_GREEN: '#32FFB8',
  D_YELLOW: '#FFC838',
};

interface PracticeModeProps {
  onBack: () => void;
  numQuestions: number;
  practiceMode: string;
  gameSettings: { questionTime: number; hesitationTime: number; wpm: number };
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  onBack,
  numQuestions,
  practiceMode,
  gameSettings,
}) => {
  const { userData } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [timer, setTimer] = useState(gameSettings.questionTime);
  const [revealedWordsCount, setRevealedWordsCount] = useState(0);
  const [isQuestionLive, setIsQuestionLive] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [questionFullyRevealed, setQuestionFullyRevealed] = useState(false);
  const [buzzTimes, setBuzzTimes] = useState<number[]>([]);
  const [correctBySubject, setCorrectBySubject] = useState<Record<string, number>>({});
  const [totalBySubject, setTotalBySubject] = useState<Record<string, number>>({});
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [showHesitation, setShowHesitation] = useState(false);
  const [hesitationTimer, setHesitationTimer] = useState<number | null>(null);
  const revealIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const filters: any = {
        isPublic: true,
      };

      if (practiceMode !== 'Mix') {
        const subjectMap: Record<string, string> = {
          'Social Studies': 'SS',
          'Science': 'SC',
          'Language Arts': 'LA',
          'Math': 'MA',
          'Arts and Humanities': 'AH',
        };
        filters.subjectArea = subjectMap[practiceMode] || practiceMode;
      }

      const allQuestions = await getQuestions(filters);
      
      if (allQuestions.length === 0) {
        alert('No questions available. Please ask your coach to add questions first.');
        onBack();
        return;
      }

      // Shuffle questions but keep each question object intact with its answers
      // This ensures questions and their answers stay locked together
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(numQuestions, allQuestions.length));
      // Verify each question has its correctAnswer and distractors properly set
      const validatedQuestions = selected.map(q => {
        if (!q.correctAnswer || !q.distractors || q.distractors.length === 0) {
          console.warn(`Question ${q.id} is missing answer data`);
        }
        return q;
      });
      setQuestions(validatedQuestions);

      if (selected.length > 0 && userData) {
        // Create game record
        const newGameId = await createGame({
          type: 'practice',
          playerId: userData.uid,
          teamId: userData.teamId,
          questionIds: selected.map((q) => q.id),
          status: 'active',
        });
        setGameId(newGameId);
        startQuestion();
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions. Please try again.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const startQuestion = () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    // Shuffle answers but keep them tied to this specific question object
    // Use the question's ID to ensure we're always using the correct question's answers
    const shuffled = [currentQuestion.correctAnswer, ...currentQuestion.distractors].sort(
      () => Math.random() - 0.5
    );
    setShuffledAnswers(shuffled);
    setQuestionFullyRevealed(false);
    setRevealedWordsCount(0);
    setIsQuestionLive(true); // Allow immediate buzzing
    setHasBuzzed(false);
    setShowHesitation(false);
    setHesitationTimer(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowCorrect(false);
    setShowIncorrect(false);
    setTimer(gameSettings.questionTime);
    setQuestionStartTime(Date.now());
  };

  useEffect(() => {
    if (questions.length === 0 || !questions[currentQuestionIndex] || hasBuzzed) return;

    const currentQuestion = questions[currentQuestionIndex];
    const totalWords = currentQuestion.questionText.split(' ').length;
    const msPerWord = (60 / gameSettings.wpm) * 1000;

    revealIntervalRef.current = setInterval(() => {
      setRevealedWordsCount((prev) => {
        if (prev < totalWords) {
          const newCount = prev + 1;
          if (newCount === totalWords) {
            setQuestionFullyRevealed(true);
          }
          return newCount;
        }
        if (revealIntervalRef.current) {
          clearInterval(revealIntervalRef.current);
          revealIntervalRef.current = null;
        }
        return prev;
      });
    }, msPerWord);

    return () => {
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, [currentQuestionIndex, questions, gameSettings.wpm, hasBuzzed]);

  useEffect(() => {
    const shouldRunTimer = questionFullyRevealed && timer > 0;

    if (shouldRunTimer) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && questionFullyRevealed) {
      handleTimeExpired();
    }
  }, [timer, questionFullyRevealed]);

  const handleBuzz = () => {
    if (hasBuzzed || questionStartTime === null) return;
    
    // Stop word revelation immediately
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
    
    const buzzTime = (Date.now() - questionStartTime) / 1000;
    setBuzzTimes((prev) => [...prev, buzzTime]);
    setHasBuzzed(true);
    setHesitationTimer(gameSettings.hesitationTime);
    setQuestionFullyRevealed(true); // Show answers immediately
    // Stop the main timer when buzzed
    setTimer(0);
  };

  // Hesitation timer
  useEffect(() => {
    if (hasBuzzed && hesitationTimer !== null && hesitationTimer > 0 && !showResult) {
      const timer = setInterval(() => {
        setHesitationTimer((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setShowHesitation(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (hesitationTimer === 0 && !showResult) {
      setShowHesitation(true);
    }
  }, [hasBuzzed, hesitationTimer, showResult]);

  const handleTimeExpired = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      endGame();
    } else {
      setCurrentQuestionIndex(nextIndex);
      startQuestion();
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    setSelectedAnswer(answer);
    setShowResult(true);

    // Track total questions by subject
    setTotalBySubject((prev) => ({
      ...prev,
      [currentQuestion.subjectArea]: (prev[currentQuestion.subjectArea] || 0) + 1,
    }));

    if (isCorrect) {
      setPlayerScore((prev) => prev + 1);
      setShowCorrect(true);
      setCorrectBySubject((prev) => ({
        ...prev,
        [currentQuestion.subjectArea]: (prev[currentQuestion.subjectArea] || 0) + 1,
      }));
    } else {
      setShowIncorrect(true);
    }

    setTimeout(() => {
      setShowCorrect(false);
      setShowIncorrect(false);
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        endGame();
      } else {
        setCurrentQuestionIndex(nextIndex);
        startQuestion();
      }
    }, 2000);
  };

  const endGame = async () => {
    if (!userData || !gameId) return;

    const avgBuzzTime = buzzTimes.length > 0
      ? buzzTimes.reduce((a, b) => a + b, 0) / buzzTimes.length
      : 0;

    const matchHistory: Omit<MatchHistory, 'id' | 'startedAt' | 'completedAt'> = {
      gameId,
      playerId: userData.uid,
      teamId: userData.teamId,
      type: 'practice',
      score: playerScore,
      total: questions.length,
      avgBuzzTime: parseFloat(avgBuzzTime.toFixed(2)),
      correctBySubject,
      totalBySubject,
      questionIds: questions.map((q) => q.id),
      hesitationCount: 0,
    };

    try {
      await createMatchHistory(matchHistory);
      
      // Get current player stats to calculate increments
      const currentPlayer = await getPlayer(userData.uid);
      const currentGamesPlayed = currentPlayer?.gamesPlayed || 0;
      const currentTotalScore = currentPlayer?.totalScore || 0;
      const currentTotalQuestions = currentPlayer?.totalQuestions || 0;
      const currentCorrectBySubject = currentPlayer?.correctBySubject || {};
      
      // Calculate new averages
      const newGamesPlayed = currentGamesPlayed + 1;
      const newTotalScore = currentTotalScore + playerScore;
      const newTotalQuestions = currentTotalQuestions + questions.length;
      const newAvgBuzzTime = buzzTimes.length > 0
        ? ((currentPlayer?.avgBuzzTime || 0) * currentGamesPlayed + avgBuzzTime) / newGamesPlayed
        : currentPlayer?.avgBuzzTime || 0;
      
      // Merge correctBySubject
      const mergedCorrectBySubject = { ...currentCorrectBySubject };
      Object.entries(correctBySubject).forEach(([subject, count]) => {
        mergedCorrectBySubject[subject] = (mergedCorrectBySubject[subject] || 0) + count;
      });

      await updatePlayerStats(userData.uid, {
        gamesPlayed: newGamesPlayed,
        totalScore: newTotalScore,
        totalQuestions: newTotalQuestions,
        avgBuzzTime: parseFloat(newAvgBuzzTime.toFixed(2)),
        correctBySubject: mergedCorrectBySubject,
      });

      alert(`Practice Complete! Final Score: ${playerScore}/${questions.length}`);
      onBack();
    } catch (error) {
      console.error('Error saving match history:', error);
      alert('Game completed but failed to save results.');
      onBack();
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url(/Environments/Olympus Arena.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-white text-2xl drop-shadow-lg">Loading questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/Environments/Olympus Arena.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay interactive elements on top of background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 overflow-auto">
        <div className="bg-purple-900 border-4 border-red-500 rounded-3xl p-12 max-w-md w-full text-center">
          <h2 className="text-3xl font-black text-white mb-4">No Questions Available</h2>
          <p className="text-white/70 mb-6">
            There are no questions available for your selected settings. Please try a different subject or ask your coach to add more questions.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-yellow-500 hover:bg-orange-500 text-black font-black text-xl py-4 rounded-xl"
          >
            GO BACK
          </button>
        </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const revealedText = currentQuestion.questionText
    .split(' ')
    .slice(0, revealedWordsCount)
    .join(' ');

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Olympus Arena.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 overflow-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-yellow-500 hover:bg-orange-500 rounded-full transition-colors z-20 shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
      {showCorrect && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="relative transform border-8 border-green-500 rounded-xl p-4 bg-green-900/90 shadow-2xl animate-pulse">
            <h1 className="text-6xl md:text-9xl font-black text-green-400 uppercase" style={{ WebkitTextStroke: '2px black' }}>
              CORRECT
            </h1>
          </div>
        </div>
      )}
      {showIncorrect && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="border-8 border-red-600 rounded-xl p-4 bg-red-900/90 rotate-[-15deg]">
            <h1 className="text-6xl md:text-9xl font-black text-red-500 uppercase" style={{ WebkitTextStroke: '2px black' }}>
              INCORRECT
            </h1>
          </div>
        </div>
      )}

      <div className="absolute top-8 right-8 bg-purple-950/80 border-2 border-cyan-400 px-6 py-3 rounded-full">
        <span className="text-cyan-400 font-black text-2xl">SCORE: {playerScore}</span>
      </div>

      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r={60} stroke="#1A0D3E" strokeWidth="12" fill="none" />
          <circle
            cx="80"
            cy="80"
            r={60}
            stroke={timer <= 3 ? '#ef4444' : '#00B8FF'}
            strokeWidth="12"
            fill="none"
            strokeDasharray={2 * Math.PI * 60}
            strokeDashoffset={2 * Math.PI * 60 * (1 - timer / gameSettings.questionTime)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-6xl font-black ${timer <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto mb-8">
        {/* Hide question when buzzed - question disappears immediately */}
        {!hasBuzzed && (
          <div className="bg-purple-950/90 border-2 border-cyan-400 rounded-xl p-8 text-center min-h-[160px] flex items-center justify-center">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              {revealedText}
              {!questionFullyRevealed && <span className="animate-pulse text-cyan-400">|</span>}
            </h2>
          </div>
        )}
        
        {/* Hesitation message */}
        {showHesitation && hasBuzzed && !showResult && (
          <div className="bg-red-900/90 border-4 border-red-500 rounded-xl p-8 text-center min-h-[160px] flex items-center justify-center">
            <h2 className="text-4xl md:text-6xl font-black text-red-400 uppercase">
              HESITATION
            </h2>
          </div>
        )}
      </div>

      {/* Show buzzer button only when not buzzed and question not fully revealed */}
      {!hasBuzzed && !questionFullyRevealed ? (
        <button
          onClick={handleBuzz}
          disabled={!isQuestionLive}
          className={`w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-8 border-orange-500 flex items-center justify-center transform hover:scale-110 active:scale-95 ${
            !isQuestionLive ? 'opacity-50' : ''
          }`}
        >
          <Bolt size={80} className="text-yellow-900" fill="currentColor" />
        </button>
      ) : (
        /* Show answer choices immediately when buzzed OR when question is fully revealed */
        (hasBuzzed || questionFullyRevealed) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {shuffledAnswers.map((answer, idx) => {
              const labels = ['A', 'B', 'C', 'D'];
              const colors = [COLOR_THEME.A_RED, COLOR_THEME.B_BLUE, COLOR_THEME.C_GREEN, COLOR_THEME.D_YELLOW];
              // Ensure we're checking against the current question's correct answer
              const isCorrect = answer === currentQuestion.correctAnswer;
              const glow =
                showResult && selectedAnswer === answer
                  ? isCorrect
                    ? 'shadow-[0_0_40px_rgba(56,255,255,0.8)]'
                    : 'shadow-[0_0_40px_rgba(239,68,68,0.8)]'
                  : '';
              return (
                <button
                  key={`${currentQuestion.id}-${idx}-${answer}`}
                  onClick={() => handleAnswer(answer)}
                  disabled={showResult}
                  className={`relative p-1 rounded-xl ${glow} hover:scale-[1.02] ${showResult ? 'opacity-50' : ''}`}
                >
                  <div className="bg-purple-950 border-2 border-white/20 rounded-xl flex items-center p-4">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center font-black text-2xl text-black rounded-l-xl flex-shrink-0"
                      style={{ backgroundColor: colors[idx] }}
                    >
                      {labels[idx]}
                    </div>
                    <span className="ml-20 text-xl font-bold text-white flex-1 text-left">{answer}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}

      {showResult && selectedAnswer !== currentQuestion.correctAnswer && (
        <div className="mt-4 text-2xl font-black text-green-400">
          Correct: {currentQuestion.correctAnswer}
        </div>
      )}
      </div>
    </div>
  );
};


