'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState<any>(null);

  useEffect(() => {
    fetchCurrentRide();
    fetchHistory();
  }, []);

  const fetchCurrentRide = async () => {
    try {
      const res = await api.get('/rides/me/current');
      setCurrentRide(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/users/me/rides');
      setRides(res.data);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600">Wallet Balance: {user?.walletBalance ?? 0} BDT</p>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
      </div>

      {currentRide ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-blue-200">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Active Ride</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="font-semibold">{currentRide.pickupZone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">To</p>
              <p className="font-semibold">{currentRide.destinationZone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold px-2 py-1 bg-blue-100 text-blue-800 inline-block rounded text-xs">{currentRide.ride.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fare</p>
              <p className="font-semibold">{currentRide.totalFare} BDT</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center mb-8">
          <p className="text-gray-500 mb-4">You have no active rides.</p>
          <a href="/passenger/book" className="px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors">Book a Tesla</a>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Ride History</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rides.map((ride: any) => (
              <tr key={ride.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(ride.joinedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ride.pickupZone} → {ride.destinationZone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ride.totalFare} BDT</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${ride.isCancelled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                    {ride.isCancelled ? 'CANCELLED' : ride.ride.status}
                  </span>
                </td>
              </tr>
            ))}
            {rides.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No past rides</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
