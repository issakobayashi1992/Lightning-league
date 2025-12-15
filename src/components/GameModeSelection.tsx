import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface GameModeSelectionProps {
  onBack: () => void;
}

const SUBJECT_AREAS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'Arts and Humanities', value: 'AH' },
  { label: 'Language Arts', value: 'LA' },
  { label: 'Math', value: 'MA' },
  { label: 'Science', value: 'SC' },
  { label: 'Social Studies', value: 'SS' },
];

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [gameMode, setGameMode] = useState<'match' | 'practice'>('practice');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['ALL']);
  const [practiceMode, setPracticeMode] = useState<'questions' | 'time'>('questions');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeMinutes, setTimeMinutes] = useState(5);

  const handleSubjectToggle = (value: string) => {
    if (value === 'ALL') {
      setSelectedSubjects(['ALL']);
    } else {
      setSelectedSubjects((prev) => {
        const newSubjects = prev.filter((s) => s !== 'ALL');
        if (newSubjects.includes(value)) {
          return newSubjects.filter((s) => s !== value);
        } else {
          return [...newSubjects, value];
        }
      });
    }
  };

  const handleStart = () => {
    if (gameMode === 'practice') {
      // Build subject filter for practice mode
      let subjectFilter = 'Mix';
      if (selectedSubjects.length === 1 && selectedSubjects[0] === 'ALL') {
        subjectFilter = 'Mix';
      } else if (selectedSubjects.length > 0 && !selectedSubjects.includes('ALL')) {
        // Use first selected subject (PracticeMode currently supports single subject)
        const subjectMap: Record<string, string> = {
          'AH': 'Arts and Humanities',
          'LA': 'Language Arts',
          'MA': 'Math',
          'SC': 'Science',
          'SS': 'Social Studies',
        };
        subjectFilter = subjectMap[selectedSubjects[0]] || 'Mix';
      }

      const params = new URLSearchParams();
      if (practiceMode === 'questions') {
        params.set('numQuestions', numQuestions.toString());
      } else {
        params.set('timeMinutes', timeMinutes.toString());
        // For time-based, we'll use a default number of questions (can be adjusted)
        params.set('numQuestions', '50'); // Large number to allow time-based practice
      }
      params.set('practiceMode', subjectFilter);
      // Pass selected subjects for potential future multi-subject support
      if (selectedSubjects.length > 0 && !selectedSubjects.includes('ALL')) {
        params.set('subjects', selectedSubjects.join(','));
      }
      navigate(`/practice-mode?${params.toString()}`);
    } else {
      // Match play - navigate to match play (to be implemented)
      // For now, show message that match length is set by coach
      alert('Match Play length is determined by your Team Coach. Please contact your coach to start a match.');
    }
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
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-8 overflow-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-yellow-500 hover:bg-orange-500 rounded-full transition-colors z-20 shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>

        <div className="bg-purple-900 border-4 border-cyan-400 rounded-2xl p-8 max-w-2xl w-full">
          <h2 className="text-4xl font-black text-white mb-6 text-center">SELECT GAME MODE</h2>

          {/* Game Mode Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-bold uppercase mb-3">Game Mode</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGameMode('practice')}
                className={`p-6 rounded-xl border-4 transition-all ${
                  gameMode === 'practice'
                    ? 'bg-yellow-500 border-yellow-600 text-black'
                    : 'bg-purple-950 border-cyan-400/30 text-white hover:border-cyan-400'
                }`}
              >
                <div className="text-2xl font-black mb-2">PRACTICE</div>
                <div className="text-sm">Practice on your own</div>
              </button>
              <button
                onClick={() => setGameMode('match')}
                className={`p-6 rounded-xl border-4 transition-all ${
                  gameMode === 'match'
                    ? 'bg-yellow-500 border-yellow-600 text-black'
                    : 'bg-purple-950 border-cyan-400/30 text-white hover:border-cyan-400'
                }`}
              >
                <div className="text-2xl font-black mb-2">MATCH PLAY</div>
                <div className="text-sm">Competitive match</div>
              </button>
            </div>
          </div>

          {/* Subject Area Selection */}
          <div className="mb-6">
            <label className="block text-white text-sm font-bold uppercase mb-3">
              Subject Areas
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_AREAS.map((subject) => (
                <label
                  key={subject.value}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSubjects.includes(subject.value)
                      ? 'bg-cyan-500/20 border-cyan-400'
                      : 'bg-purple-950 border-cyan-400/30 hover:border-cyan-400/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.value)}
                    onChange={() => handleSubjectToggle(subject.value)}
                    className="w-5 h-5 mr-3 text-cyan-400 rounded focus:ring-cyan-400"
                  />
                  <span className="text-white font-bold">{subject.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Practice Mode Options */}
          {gameMode === 'practice' && (
            <div className="mb-6">
              <label className="block text-white text-sm font-bold uppercase mb-3">
                Practice Length
              </label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => setPracticeMode('questions')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    practiceMode === 'questions'
                      ? 'bg-yellow-500 border-yellow-600 text-black'
                      : 'bg-purple-950 border-cyan-400/30 text-white hover:border-cyan-400'
                  }`}
                >
                  <div className="font-black">Number of Questions</div>
                </button>
                <button
                  onClick={() => setPracticeMode('time')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    practiceMode === 'time'
                      ? 'bg-yellow-500 border-yellow-600 text-black'
                      : 'bg-purple-950 border-cyan-400/30 text-white hover:border-cyan-400'
                  }`}
                >
                  <div className="font-black">Time Limit</div>
                </button>
              </div>

              {practiceMode === 'questions' ? (
                <div>
                  <label className="block text-white text-sm font-bold uppercase mb-2">
                    Number of Questions: {numQuestions}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>5</span>
                    <span>15</span>
                    <span>25</span>
                    <span>35</span>
                    <span>50</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-white text-sm font-bold uppercase mb-2">
                    Time (minutes): {timeMinutes}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Match Play Info */}
          {gameMode === 'match' && (
            <div className="mb-6 p-4 bg-purple-950 border-2 border-cyan-400/50 rounded-xl">
              <p className="text-white text-sm">
                <strong className="text-cyan-400">Note:</strong> Match Play length is determined by
                your Team Coach. The coach sets the number of questions for the entire team.
              </p>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-2xl py-4 px-8 rounded-xl font-black uppercase transition-colors"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};


