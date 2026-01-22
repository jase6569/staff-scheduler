import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = () => {
    login(); // No password = staff role
    navigate('/');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Scheduler</h1>
          <p className="text-slate-500 mt-1">Markets & Shows Management</p>
        </div>

        <div className="card p-6 space-y-6">
          {/* Staff View Button */}
          <div className="text-center">
            <button
              onClick={handleStaffLogin}
              className="btn btn-secondary w-full py-3 text-lg"
            >
              View Schedule (Staff)
            </button>
            <p className="text-xs text-slate-500 mt-2">View-only access to the schedule</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Admin Access</span>
            </div>
          </div>

          {/* Admin Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="label">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter admin password"
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-full py-3">
              Login as Admin
            </button>
            <p className="text-xs text-slate-500 text-center">Full access to manage staff, venues, and assignments</p>
          </form>
        </div>
      </div>
    </div>
  );
}
