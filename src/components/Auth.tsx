'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function Auth() {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  useEffect(() => {
    // 마지막 로그인 날짜 확인
    const lastLoginDate = localStorage.getItem('last_login_date');
    const today = new Date().toDateString();
    
    // 오늘 이미 로그인했다면 자동으로 로그인
    if (lastLoginDate === today) {
      const savedNickname = localStorage.getItem('user_nickname');
      if (savedNickname) {
        signIn(savedNickname);
      }
    }
  }, [signIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2-20자 사이여야 합니다.');
      return;
    }

    try {
      // 로그인 성공 시 오늘 날짜 저장
      localStorage.setItem('last_login_date', new Date().toDateString());
      localStorage.setItem('user_nickname', nickname);
      await signIn(nickname);
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MURMUR
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            오늘의 MURMUR 시작하기
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nickname" className="sr-only">
                닉네임
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="닉네임 (2-20자)"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              시작하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 