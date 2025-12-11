import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/firebase';

export const SignUp: React.FC<{ onSuccess?: () => void; onCancel?: () => void }> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [teamId, setTeamId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName, role, teamId || undefined);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/Environments/Olympus%20Arena.png)',
      }}
    >
      <div className="bg-purple-900 border-4 border-cyan-400 rounded-3xl p-12 max-w-md w-full">
        <h2 className="text-4xl font-black text-white mb-8 text-center">CREATE ACCOUNT</h2>
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
            />
          </div>
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
            />
          </div>
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
            >
              <option value="student">Student</option>
              <option value="coach">Coach</option>
            </select>
          </div>
          {role === 'student' && (
            <div>
              <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Team ID (Optional)</label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Enter team ID if provided by coach"
                className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
            />
          </div>
          <div>
            <label className="block text-cyan-400 text-sm font-bold uppercase mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-purple-950 text-white p-4 rounded-lg border-2 border-cyan-400/30 outline-none"
            />
          </div>
          <div className="flex gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-purple-950 text-white font-bold py-4 rounded-xl border-2 border-white/20"
              >
                CANCEL
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-500 hover:bg-orange-500 text-black font-black text-xl py-4 rounded-xl disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};





