import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUp } from '../components/Auth/SignUp';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SignUp
      onSuccess={() => navigate('/')}
      onCancel={() => navigate('/')}
      onBack={() => navigate('/')}
    />
  );
};



