import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlayersByTeam } from '../services/firestore';

export const PerformanceReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.teamId && userData?.role === 'coach') {
      loadStudents();
    }
  }, [userData]);

  const loadStudents = async () => {
    if (userData?.teamId && userData?.role === 'coach') {
      try {
        const players = await getPlayersByTeam(userData.teamId);
        setStudents(players);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Stats2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 overflow-auto">
        <div className="bg-purple-900 border-4 border-green-400 rounded-3xl p-12 max-w-4xl w-full">
          <div className="flex items-center mb-8 border-b border-green-400/30 pb-6">
            <Trophy className="text-green-400 mr-4" size={48} />
            <h1 className="text-4xl font-black text-white">PERFORMANCE REPORTS</h1>
          </div>

          <div className="bg-purple-950 rounded-xl p-6 mb-6">
            <h3 className="text-green-400 font-bold mb-4 uppercase">Top Performers</h3>
            <div className="space-y-3">
              {students
                .sort((a, b) => {
                  const aScore = a.totalQuestions > 0 ? (a.totalScore / a.totalQuestions) * 100 : 0;
                  const bScore = b.totalQuestions > 0 ? (b.totalScore / b.totalQuestions) * 100 : 0;
                  return bScore - aScore;
                })
                .slice(0, 5)
                .map((student) => {
                  const accuracy =
                    student.totalQuestions > 0
                      ? ((student.totalScore / student.totalQuestions) * 100).toFixed(0)
                      : '0';
                  const bestSubject = student.correctBySubject
                    ? Object.entries(student.correctBySubject)
                        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
                    : 'N/A';
                  return (
                    <div
                      key={student.id}
                      className="flex justify-between items-center py-3 border-b border-white/10 last:border-0"
                    >
                      <div>
                        <div className="text-white font-bold">{student.displayName}</div>
                        <div className="text-white/50 text-sm">
                          {student.gamesPlayed || 0} games • {bestSubject} focus
                        </div>
                      </div>
                      <div className="text-2xl font-black text-green-400">{accuracy}%</div>
                    </div>
                  );
                })}
            </div>
            {students.length === 0 && (
              <div className="text-center text-white/50 py-8">No performance data yet</div>
            )}
          </div>

          <button
            onClick={() => navigate('/coach-dashboard')}
            className="w-full bg-yellow-500 hover:bg-orange-500 text-black font-black text-2xl py-4 rounded-xl"
          >
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};

