import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMatchHistoryByPlayer, getPlayer } from '../services/firestore';
import { MatchHistory, Player } from '../types/firebase';
import { Trophy } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StudentDashboardProps {
  onBack: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onBack }) => {
  const { userData } = useAuth();
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      loadData();
    }
  }, [userData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, playerData] = await Promise.all([
        getMatchHistoryByPlayer(userData!.uid, 20),
        getPlayer(userData!.uid),
      ]);
      setMatchHistory(historyData);
      setPlayer(playerData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgAccuracy = matchHistory.length > 0
    ? matchHistory.reduce((sum, m) => sum + (m.score / m.total) * 100, 0) / matchHistory.length
    : 0;

  const bestSubject = player?.correctBySubject
    ? Object.entries(player.correctBySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    : 'N/A';

  const chartData = matchHistory.slice(0, 10).reverse().map((match, idx) => ({
    name: `Match ${idx + 1}`,
    accuracy: (match.score / match.total) * 100,
    buzzTime: match.avgBuzzTime,
  }));

  if (loading) {
    return (
      <div 
        className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: 'url(/Environments/Statsboad.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-white text-2xl drop-shadow-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Statsboad.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-8 overflow-auto">
      <div className="bg-purple-900 border-4 border-yellow-500 rounded-3xl p-12 max-w-4xl w-full">
        <div className="flex items-center mb-8 border-b border-yellow-500/30 pb-6">
          <Trophy className="text-yellow-500 mr-4" size={48} />
          <h1 className="text-5xl font-black text-white">MY STATS</h1>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-950 border-2 border-cyan-400 rounded-xl p-6 text-center">
            <div className="text-cyan-400 text-sm font-bold uppercase mb-2">Avg Accuracy</div>
            <div className="text-5xl font-black text-white">{avgAccuracy.toFixed(1)}%</div>
          </div>
          <div className="bg-purple-950 border-2 border-yellow-500 rounded-xl p-6 text-center">
            <div className="text-yellow-500 text-sm font-bold uppercase mb-2">Avg Buzz Time</div>
            <div className="text-5xl font-black text-white">
              {player?.avgBuzzTime ? player.avgBuzzTime.toFixed(2) : '0.00'}s
            </div>
          </div>
          <div className="bg-purple-950 border-2 border-green-400 rounded-xl p-6 text-center">
            <div className="text-green-400 text-sm font-bold uppercase mb-2">Best Subject</div>
            <div className="text-2xl font-black text-white">{bestSubject}</div>
          </div>
        </div>

        {matchHistory.length > 0 ? (
          <div className="bg-purple-950 rounded-xl p-6 mb-8">
            <h3 className="text-cyan-400 font-bold mb-4 uppercase">Performance Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} name="Accuracy %" />
                <Line type="monotone" dataKey="buzzTime" stroke="#F59E0B" strokeWidth={2} name="Buzz Time (s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-purple-950 rounded-xl p-6 mb-8 text-center text-white/50">
            No match history yet. Start practicing to see your stats!
          </div>
        )}

        <div className="bg-purple-950 rounded-xl p-6 mb-8">
          <h3 className="text-cyan-400 font-bold mb-4 uppercase">Match History</h3>
          <div className="space-y-3">
            {matchHistory.slice(0, 5).map((match) => (
              <div key={match.id} className="flex justify-between py-3 border-b border-white/10 last:border-0">
                <span className="text-white/70">
                  {new Date(match.completedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-6">
                  <span className="text-white font-bold">{match.score}/{match.total}</span>
                  <span className="text-cyan-400">{(match.score / match.total * 100).toFixed(0)}%</span>
                  <span className="text-yellow-500">{match.avgBuzzTime}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onBack} className="w-full bg-yellow-500 hover:bg-orange-500 text-black font-black text-2xl py-4 rounded-xl">
          BACK TO LOBBY
        </button>
      </div>
      </div>
    </div>
  );
};





