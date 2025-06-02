'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserWall({ params }: { params: { userId: string } }) {
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: message,
            is_anonymous: isAnonymous,
            user_id: params.userId
          }
        ]);

      if (error) throw error;
      setMessage('');
      alert('Message sent successfully!');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Leave a Message</h1>
      
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message..."
          className="w-full p-3 border rounded-lg mb-2"
          rows={3}
        />
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="anonymous">Send anonymously</label>
        </div>
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send Message
        </button>
      </div>
    </div>
  );
} 