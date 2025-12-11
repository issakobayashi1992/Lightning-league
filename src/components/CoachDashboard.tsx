import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Settings, 
  Users, 
  BarChart3, 
  Play,
  FileText,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlayersByTeam, getQuestions } from '../services/firestore';
import { Player, Question as FirestoreQuestion } from '../types/firebase';

interface CoachDashboardProps {
  onBack: () => void;
  onStartPractice: () => void;
  onQuestionEditor?: () => void;
  onLeaderboard?: () => void;
  onMatchHistory?: () => void;
  onStudentRoster?: () => void;
  onPerformanceReports?: () => void;
  onGameSettings?: () => void;
}

export function CoachDashboard({ 
  onBack, 
  onStartPractice,
  onQuestionEditor,
  onLeaderboard,
  onMatchHistory,
  onStudentRoster,
  onPerformanceReports,
  onGameSettings,
}: CoachDashboardProps) {
  const { userData } = useAuth();
  const [students, setStudents] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<FirestoreQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.teamId) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    if (!userData?.teamId) return;
    
    try {
      setLoading(true);
      const [playersData, questionsData] = await Promise.all([
        getPlayersByTeam(userData.teamId),
        getQuestions({ teamId: userData.teamId })
      ]);
      setStudents(playersData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgAccuracy = students.length > 0
    ? students.reduce((sum, s) => {
        const accuracy = s.totalQuestions > 0 
          ? (s.totalScore / s.totalQuestions) * 100 
          : 0;
        return sum + accuracy;
      }, 0) / students.length
    : 0;

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Coach%20Panel.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header with Logo Centered */}
          <div className="flex items-center justify-center mb-8 relative">
            <button
              onClick={onBack}
              className="absolute left-0 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* LEFT COLUMN: GAME CONTROLS */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-yellow-500/30">
              <h2 className="text-2xl font-black text-gray-800 mb-6 text-center uppercase">GAME CONTROLS</h2>
              
              <div className="space-y-4">
                <button
                  onClick={onStartPractice}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Practice</span>
                </button>

                {onQuestionEditor && (
                  <button
                    onClick={onQuestionEditor}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Question Editor</span>
                  </button>
                )}

                {onGameSettings && (
                  <button
                    onClick={onGameSettings}
                    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Game Settings</span>
                  </button>
                )}

                <label className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Import Questions</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // CSV import functionality would go here
                      alert('CSV import feature - to be implemented');
                    }}
                    className="hidden"
                  />
                </label>

                {/* Stats Cards */}
                <div className="mt-6 space-y-3">
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center mb-2">
                      <FileText className="w-6 h-6 text-blue-600 mr-2" />
                      <span className="text-sm font-semibold text-gray-700">Questions</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center mb-2">
                      <Users className="w-6 h-6 text-green-600 mr-2" />
                      <span className="text-sm font-semibold text-gray-700">Students</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{students.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE COLUMN: STUDENT ROSTER */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-yellow-500/30">
              <h2 className="text-2xl font-black text-gray-800 mb-6 text-center uppercase">STUDENT ROSTER</h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No students registered yet</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[600px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 font-bold text-gray-700 text-sm">Name</th>
                        <th className="text-left py-3 px-2 font-bold text-gray-700 text-sm">Games</th>
                        <th className="text-left py-3 px-2 font-bold text-gray-700 text-sm">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const accuracy = student.totalQuestions > 0
                          ? ((student.totalScore / student.totalQuestions) * 100).toFixed(0)
                          : '0';
                        return (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 font-medium text-gray-800">{student.displayName}</td>
                            <td className="py-3 px-2 text-gray-600">{student.gamesPlayed || 0}</td>
                            <td className="py-3 px-2 font-bold text-green-600">{accuracy}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {onStudentRoster && (
                <button
                  onClick={onStudentRoster}
                  className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  View Full Roster
                </button>
              )}
            </div>

            {/* RIGHT COLUMN: REPORTS */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-yellow-500/30">
              <h2 className="text-2xl font-black text-gray-800 mb-6 text-center uppercase">REPORTS</h2>
              
              <div className="space-y-4">
                {onLeaderboard && (
                  <button
                    onClick={onLeaderboard}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Trophy className="w-5 h-5" />
                    <span>Leaderboard</span>
                  </button>
                )}

                {onMatchHistory && (
                  <button
                    onClick={onMatchHistory}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Match History</span>
                  </button>
                )}

                {onPerformanceReports && (
                  <button
                    onClick={onPerformanceReports}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Performance Reports</span>
                  </button>
                )}

                {/* Summary Stats */}
                <div className="mt-6 bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex items-center mb-2">
                    <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Avg. Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{avgAccuracy.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
