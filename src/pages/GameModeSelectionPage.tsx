import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameModeSelection } from '../components/GameModeSelection';

export const GameModeSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return <GameModeSelection onBack={handleBack} />;
};


