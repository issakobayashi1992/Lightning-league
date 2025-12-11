import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { RoleSelectPage } from './pages/RoleSelectPage';
import { PracticeModePage } from './pages/PracticeModePage';
import { QuestionEditorPage } from './pages/QuestionEditorPage';
import { CoachDashboardPage } from './pages/CoachDashboardPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { MatchHistoryPage } from './pages/MatchHistoryPage';
import { GameSettingsPage } from './pages/GameSettingsPage';
import { StudentRosterPage } from './pages/StudentRosterPage';
import { PerformanceReportsPage } from './pages/PerformanceReportsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

const App = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 via-purple-700 to-pink-400">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />
      <Route path="/practice-mode" element={<PracticeModePage />} />
      <Route path="/question-editor" element={<QuestionEditorPage />} />
      <Route path="/coach-dashboard" element={<CoachDashboardPage />} />
      <Route path="/student-dashboard" element={<StudentDashboardPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/match-history" element={<MatchHistoryPage />} />
      <Route path="/game-settings" element={<GameSettingsPage />} />
      <Route path="/student-roster" element={<StudentRosterPage />} />
      <Route path="/performance-reports" element={<PerformanceReportsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
