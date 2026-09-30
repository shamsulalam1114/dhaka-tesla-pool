'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.accessToken;
      const role = res.data.role;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    } catch (err) {
      setError('Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-2">Dhaka Tesla Pool</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Share a seat. Split the fare.</p>
        {error && <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:outline-none focus:border-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:outline-none focus:border-black"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 border-t pt-4 text-sm text-gray-500 space-y-1">
          <p className="font-medium">Demo accounts:</p>
          <p>Driver: jashim@tesla.com / jashim123</p>
          <p>Passenger: nusrat@pool.com / nusrat123</p>
          <p>Passenger: rafiq@pool.com / rafiq123</p>
          <p>Passenger: shirin@pool.com / shirin123</p>
        </div>
      </div>
    </div>
  );
}
