import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

export const RoleSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [numQuestions, setNumQuestions] = useState(5);
  const [practiceMode, setPracticeMode] = useState('Mix');

  const handleStart = () => {
    const params = new URLSearchParams();
    params.set('numQuestions', numQuestions.toString());
    params.set('practiceMode', practiceMode);
    navigate(`/practice-mode?${params.toString()}`);
  };

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Lobby.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay interactive elements on top of background */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 px-4">
        <h2 className="text-4xl font-black text-white">SELECT PLAYER</h2>

        <div className="bg-purple-900 border-4 border-cyan-400 rounded-2xl p-8 max-w-md w-full">
          <h3 className="text-2xl font-bold text-cyan-400 mb-4">Practice Settings</h3>

          <div className="mb-6">
            <label className="block text-white text-sm font-bold uppercase mb-2">
              Number of Questions: {numQuestions}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full h-2 bg-purple-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>5</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-bold uppercase mb-2">Practice Mode</label>
            <select
              value={practiceMode}
              onChange={(e) => setPracticeMode(e.target.value)}
              className="w-full bg-purple-950 text-white p-3 rounded-lg border-2 border-cyan-400/30 font-bold"
            >
              <option>Mix</option>
              <option>Arts and Humanities</option>
              <option>Language Arts</option>
              <option>Math</option>
              <option>Science</option>
              <option>Social Studies</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="bg-purple-900 border-4 border-yellow-500 p-12 rounded-2xl hover:bg-yellow-500 transition-colors group"
        >
          <User size={64} className="mx-auto mb-4 text-white group-hover:text-black" />
          <span className="text-3xl font-bold text-white group-hover:text-black">START</span>
        </button>
        <button onClick={() => navigate('/')} className="text-white/50 hover:text-white">
          Back
        </button>
      </div>
    </div>
  );
};

