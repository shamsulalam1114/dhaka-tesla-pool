'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DriverDashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchProfile();
      fetchPending();
      fetchHistory();
    }
  }, [user, isLoading]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/drivers/me');
      setDriverInfo(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/drivers/rides/pending');
      setPendingRides(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/drivers/rides/history');
      setHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const toggleOnline = async () => {
    try {
      const res = await api.patch('/drivers/me/status', { isOnline: !driverInfo?.isOnline });
      setDriverInfo(res.data);
    } catch (e) { console.error(e); }
  };

  const acceptRide = async (rideId: string) => {
    try {
      await api.patch(`/drivers/rides/${rideId}/accept`);
      fetchPending();
      fetchHistory();
    } catch (e) {
      alert('Could not accept ride. Make sure you are online.');
    }
  };

  const updateStatus = async (rideId: string, status: string) => {
    try {
      await api.patch(`/drivers/rides/${rideId}/status`, { status });
      fetchHistory();
    } catch (e) {
      alert('Could not update ride status.');
    }
  };

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Driver Portal: {user.name}</h1>
          <p className="text-gray-600">Vehicle: {driverInfo?.vehicle?.name} ({driverInfo?.vehicle?.capacity} seats)</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleOnline} className={`px-4 py-2 rounded font-semibold text-white ${driverInfo?.isOnline ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}>
            {driverInfo?.isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
          <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Pending Requests</h2>
          <div className="space-y-4">
            {pendingRides.map((ride: any) => (
              <div key={ride.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{ride.pickupZone}</p>
                    <p className="text-sm text-gray-500">{ride.occupiedSeats} Seat(s) Requested</p>
                  </div>
                  <button onClick={() => acceptRide(ride.id)} className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800">Accept Pool</button>
                </div>
              </div>
            ))}
            {pendingRides.length === 0 && <p className="text-gray-500">No pending rides.</p>}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">My Rides</h2>
          <div className="space-y-4">
            {history.map((ride: any) => (
              <div key={ride.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{ride.pickupZone}</p>
                    <p className="text-sm text-gray-500">Status: {ride.status}</p>
                    <p className="text-sm text-gray-500">Seats filled: {ride.occupiedSeats} / {ride.totalSeats}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {ride.status === 'MATCHED' && <button onClick={() => updateStatus(ride.id, 'DRIVER_ARRIVED')} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded">Arrived</button>}
                    {ride.status === 'DRIVER_ARRIVED' && <button onClick={() => updateStatus(ride.id, 'STARTED')} className="px-3 py-1 bg-blue-500 text-white text-sm rounded">Start Ride</button>}
                    {ride.status === 'STARTED' && <button onClick={() => updateStatus(ride.id, 'COMPLETED')} className="px-3 py-1 bg-green-500 text-white text-sm rounded">Complete</button>}
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-gray-500">No rides handled yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
