'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Auth from '@/components/Auth';
import { Heart, MessageCircle, Flag, MapPin } from 'lucide-react';

interface Murmur {
  id: string;
  content: string;
  created_at: string;
  location: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
}

export default function SerendipityPage() {
  const { user, loading } = useAuth();
  const [murmurs, setMurmurs] = useState<Murmur[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [filter, setFilter] = useState<string>('');
  const [newContent, setNewContent] = useState('');
  const [selectedMurmur, setSelectedMurmur] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // 가상 데이터
  useEffect(() => {
    setMurmurs([
      {
        id: '1',
        content: '오늘 길을 걷다가 발견한 작은 카페. 창가에 앉아 커피를 마시며 지나가는 사람들을 보니 마음이 편안해졌어요.',
        created_at: '2024-03-20T15:30:00',
        location: '서울시 강남구',
        likes: 12,
        comments: [
          { id: '1', content: '저도 그 카페 좋아해요!', created_at: '2024-03-20T16:00:00' }
        ],
        isLiked: false
      },
      {
        id: '2',
        content: '비 오는 날 우연히 들어간 서점에서 좋은 책을 발견했어요. 이런 우연한 발견이 삶의 작은 기쁨이 되는 것 같아요.',
        created_at: '2024-03-19T11:20:00',
        location: '서울시 마포구',
        likes: 8,
        comments: [],
        isLiked: false
      },
      {
        id: '3',
        content: '지하철에서 우연히 만난 할머니와 대화를 나눴어요. 평범한 일상이지만 특별한 순간이 되었네요.',
        created_at: '2024-03-18T09:15:00',
        location: '서울시 종로구',
        likes: 15,
        comments: [
          { id: '2', content: '정말 따뜻한 순간이었겠네요', created_at: '2024-03-18T10:00:00' }
        ],
        isLiked: false
      }
    ]);
  }, []);

  const handleLike = (id: string) => {
    setMurmurs(murmurs.map(murmur => {
      if (murmur.id === id) {
        return {
          ...murmur,
          likes: murmur.isLiked ? murmur.likes - 1 : murmur.likes + 1,
          isLiked: !murmur.isLiked
        };
      }
      return murmur;
    }));
  };

  const handleComment = (id: string) => {
    if (!newComment.trim()) return;
    
    setMurmurs(murmurs.map(murmur => {
      if (murmur.id === id) {
        return {
          ...murmur,
          comments: [...murmur.comments, {
            id: Date.now().toString(),
            content: newComment,
            created_at: new Date().toISOString()
          }]
        };
      }
      return murmur;
    }));
    setNewComment('');
  };

  const handleReport = (id: string) => {
    // 신고 기능 구현
    alert('신고가 접수되었습니다.');
  };

  const handleSubmit = () => {
    if (!newContent.trim()) return;

    const newMurmur: Murmur = {
      id: Date.now().toString(),
      content: newContent,
      created_at: new Date().toISOString(),
      location: '현재 위치', // 실제로는 현재 위치 정보를 가져와야 함
      likes: 0,
      comments: [],
      isLiked: false
    };

    setMurmurs([newMurmur, ...murmurs]);
    setNewContent('');
  };

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
          
          {/* 새 메시지 작성 */}
          <div className="mb-6">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="무슨 생각을 하고 계신가요?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <button
              onClick={handleSubmit}
              className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              남기기
            </button>
          </div>

          {/* 검색 및 정렬 */}
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

          {/* 메시지 목록 */}
          <div className="space-y-4">
            {sortedAndFilteredMurmurs.map((murmur) => (
              <div
                key={murmur.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <p className="text-gray-800 mb-2">{murmur.content}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {murmur.location}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {new Date(murmur.created_at).toLocaleString()}
                </p>
                
                {/* 액션 버튼 */}
                <div className="flex items-center gap-4 text-gray-500">
                  <button
                    onClick={() => handleLike(murmur.id)}
                    className={`flex items-center gap-1 hover:text-blue-600 ${
                      murmur.isLiked ? 'text-blue-600' : ''
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    <span>{murmur.likes}</span>
                  </button>
                  <button
                    onClick={() => setSelectedMurmur(selectedMurmur === murmur.id ? null : murmur.id)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{murmur.comments.length}</span>
                  </button>
                  <button
                    onClick={() => handleReport(murmur.id)}
                    className="flex items-center gap-1 hover:text-red-600"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                {/* 댓글 섹션 */}
                {selectedMurmur === murmur.id && (
                  <div className="mt-4 space-y-3">
                    {murmur.comments.map((comment) => (
                      <div key={comment.id} className="bg-white p-3 rounded-lg">
                        <p className="text-gray-800">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 남겨보세요..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleComment(murmur.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        작성
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 