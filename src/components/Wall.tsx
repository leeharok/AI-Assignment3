'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  reply?: string;
}

export default function Wall() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '안녕하세요! 오늘 날씨가 정말 좋네요. 즐거운 하루 보내세요!',
      created_at: new Date().toISOString(),
      is_anonymous: true
    },
    {
      id: '2',
      content: '당신의 지도가 정말 도움이 되었어요. 감사합니다!',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      is_anonymous: false
    },
    {
      id: '3',
      content: '이 근처에 맛있는 카페 추천해주세요!',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      is_anonymous: true,
      reply: '네, 근처에 스타벅스와 투썸플레이스가 있어요!'
    }
  ]);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});

  const handleReply = async (messageId: string) => {
    const reply = replyContent[messageId];
    if (!reply?.trim()) return;

    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, reply } : msg
    ));
    setReplyContent({ ...replyContent, [messageId]: '' });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Wall</h1>
      
      {/* 메시지 목록 */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500">
                {message.is_anonymous ? 'Anonymous' : 'Someone'} • {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mb-4">{message.content}</p>
            
            {/* 답장 섹션 */}
            {message.reply ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">{message.reply}</p>
              </div>
            ) : (
              <div className="mt-2">
                <textarea
                  value={replyContent[message.id] || ''}
                  onChange={(e) => setReplyContent({ ...replyContent, [message.id]: e.target.value })}
                  placeholder="Write a reply..."
                  className="w-full p-2 border rounded-lg mb-2"
                  rows={2}
                />
                <button
                  onClick={() => handleReply(message.id)}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 