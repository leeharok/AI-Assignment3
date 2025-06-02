'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Auth from '@/components/Auth';

interface Serendipity {
  id: string;
  content: string;
  location: string;
  timestamp: string;
  likes: number;
}

export default function SerendipityPage() {
  const { user, loading } = useAuth();
  const [serendipities, setSerendipities] = useState<Serendipity[]>([]);
  const [newContent, setNewContent] = useState('');

  // 임시 데이터
  useEffect(() => {
    if (user) {
      setSerendipities([
        {
          id: '1',
          content: '카페에서 우연히 만난 사람과 2시간 동안 대화를 나눴어요. 정말 인상적인 만남이었습니다.',
          location: '강남 스타벅스',
          timestamp: '2024-03-20 15:30',
          likes: 12
        },
        {
          id: '2',
          content: '길을 걷다가 발견한 작은 공원. 평소에는 몰랐던 아름다운 장소였어요.',
          location: '서울숲 공원',
          timestamp: '2024-03-19 11:20',
          likes: 8
        }
      ]);
    }
  }, [user]);

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">SOMEONE</h1>
      
      {/* 새 Serendipity 작성 폼 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="오늘의 우연한 만남이나 발견을 기록해보세요..."
          className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={() => {
            if (newContent.trim()) {
              setSerendipities([
                {
                  id: Date.now().toString(),
                  content: newContent,
                  location: '현재 위치',
                  timestamp: new Date().toLocaleString(),
                  likes: 0
                },
                ...serendipities
              ]);
              setNewContent('');
            }
          }}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          기록하기
        </button>
      </div>

      {/* Serendipity 목록 */}
      <div className="space-y-6">
        {serendipities.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-800 mb-4">{item.content}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{item.location}</span>
              <span>{item.timestamp}</span>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600">
                <span>❤️</span>
                <span>{item.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 