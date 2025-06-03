'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Auth from '@/components/Auth';
import { getMurmurs } from '@/lib/supabase';

interface Murmur {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function SerendipityPage() {
  const { user, loading } = useAuth();
  const [murmurs, setMurmurs] = useState<Murmur[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchMurmurs = async () => {
      const data = await getMurmurs();
      setMurmurs(data);
    };
    fetchMurmurs();
  }, []);

  const sortedAndFilteredMurmurs = murmurs
    .filter(murmur => 
      murmur.content.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Someone's Murmurs</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search murmurs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-lg ${
                  sortBy === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`px-4 py-2 rounded-lg ${
                  sortBy === 'oldest'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sortedAndFilteredMurmurs.map((murmur) => (
              <div
                key={murmur.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <p className="text-gray-800 mb-2">{murmur.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(murmur.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 