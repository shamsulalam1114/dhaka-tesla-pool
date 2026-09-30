'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const ZONES = ['Banani', 'Mohakhali', 'Gulshan 1', 'Gulshan 2', 'Dhanmondi', 'Mirpur', 'Uttara', 'Farmgate', 'Bashundhara'];

export default function BookRidePage() {
  const router = useRouter();
  const [pickup, setPickup] = useState('Banani');
  const [dropoff, setDropoff] = useState('Mohakhali');
  const [seats, setSeats] = useState(1);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkEstimate = async () => {
    try {
      const res = await api.get(`/rides/estimate?pickupZone=${pickup}&destinationZone=${dropoff}&seatsRequested=${seats}`);
      setEstimate(res.data);
    } catch (e) { console.error(e); }
  };

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/rides/request', {
        pickupZone: pickup,
        destinationZone: dropoff,
        seatsRequested: seats
      });
      router.push('/passenger');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Book a Tesla Pool</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Zone</label>
          <select value={pickup} onChange={(e) => setPickup(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination Zone</label>
          <select value={dropoff} onChange={(e) => setDropoff(e.target.value)} className="w-full p-2 border border-gray-300 rounded">
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seats Needed</label>
          <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded">
            {[1, 2, 3].map(n => <option key={n} value={n}>{n} Seat{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <button onClick={checkEstimate} className="w-full py-2 bg-gray-100 text-gray-800 font-semibold rounded border border-gray-300 hover:bg-gray-200 mb-4">
        Calculate Fare
      </button>

      {estimate && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-6">
          <p className="text-sm text-blue-800 mb-2">Estimated Fares:</p>
          <div className="flex justify-between font-semibold">
            <span>Solo Ride: {estimate.soloFareTaka} BDT</span>
            <span className="text-green-600">Pool Fare: {estimate.pooledFareTaka} BDT</span>
          </div>
        </div>
      )}

      <button onClick={handleBook} disabled={loading} className="w-full py-3 bg-black text-white font-bold rounded hover:bg-gray-800 disabled:bg-gray-400">
        {loading ? 'Booking...' : 'Confirm Pool Booking'}
      </button>
    </div>
  );
}
