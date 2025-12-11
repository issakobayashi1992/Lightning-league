import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PracticeMode } from '../components/PracticeMode';
import { useAuth } from '../context/AuthContext';
import { getGameSettings } from '../services/firestore';

export const PracticeModePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData } = useAuth();
  const [gameSettings, setGameSettings] = useState({
    questionTime: 10,
    hesitationTime: 5,
    wpm: 150,
  });

  const numQuestions = parseInt(searchParams.get('numQuestions') || '5');
  const practiceMode = searchParams.get('practiceMode') || 'Mix';

  useEffect(() => {
    if (userData?.teamId) {
      loadGameSettings();
    }
  }, [userData]);

  const loadGameSettings = async () => {
    try {
      const settings = await getGameSettings(userData?.teamId);
      if (settings) {
        setGameSettings({
          questionTime: settings.questionTime || 10,
          hesitationTime: settings.hesitationTime || 5,
          wpm: settings.wpm || 150,
        });
      }
    } catch (error) {
      console.error('Error loading game settings:', error);
    }
  };

  const handleBack = () => {
    if (userData?.role === 'coach') {
      navigate('/coach-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <PracticeMode
      onBack={handleBack}
      numQuestions={numQuestions}
      practiceMode={practiceMode}
      gameSettings={gameSettings}
    />
  );
};

