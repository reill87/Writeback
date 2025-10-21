'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('HomePage - Auth state:', { user, loading });

  useEffect(() => {
    console.log('HomePage - useEffect triggered:', { user, loading });
    if (!loading && user) {
      console.log('HomePage - Redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Writing Timeline Platform
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#demo" className="text-gray-600 hover:text-gray-900">
                Demo
              </Link>
              <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                시작하기
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            작가의 창작 과정을
            <br />
            <span className="text-blue-600">투명하게 공유하세요</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            단순히 완성된 결과물이 아닌, 창작의 전 과정을 기록하고 공유하여 
            독자와 더 깊은 소통을 만들어가는 플랫폼입니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#demo"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              데모 보기
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              주요 기능
            </h2>
            <p className="text-lg text-gray-600">
              작가와 독자를 위한 혁신적인 기능들
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">실시간 편집 기록</h3>
              <p className="text-gray-600">
                모든 타이핑, 삭제, 수정 과정을 밀리초 단위로 기록하여 
                완전한 창작 과정을 보존합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">타임라인 재생</h3>
              <p className="text-gray-600">
                작성 과정을 영화처럼 재생하여 독자가 작가의 
                사고 과정을 체험할 수 있습니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">변경사항 비교</h3>
              <p className="text-gray-600">
                초고와 최종본을 나란히 비교하여 창작 과정에서의 
                변화와 발전을 시각적으로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            실제 작동 화면을 확인해보세요
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            현재 MVP 개발이 완료되어 모든 기능을 사용할 수 있습니다.
          </p>
          <div className="bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">작가용 기능</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• 실시간 편집 및 자동 저장</li>
                  <li>• 이벤트 소싱 기반 완전한 기록</li>
                  <li>• 문서 공개/비공개 설정</li>
                  <li>• 로컬/클라우드 동기화</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">독자용 기능</h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• 최종 문서 읽기</li>
                  <li>• 타임라인 재생 (속도 조절 가능)</li>
                  <li>• 초고/최종본 비교</li>
                  <li>• 반응형 모바일 지원</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <div className="bg-blue-600 text-white p-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">
              지금 바로 시작해보세요
            </h2>
            <p className="text-xl mb-8 opacity-90">
              무료로 계정을 만들고 첫 번째 문서를 작성해보세요.
            </p>
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-block"
            >
              무료 회원가입
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Writing Timeline Platform</h3>
            <p className="text-gray-400 mb-6">
              작가의 창작 과정을 투명하게 공유하는 플랫폼
            </p>
            <div className="flex justify-center space-x-6">
              <a href="https://github.com" className="text-gray-400 hover:text-white">
                GitHub
              </a>
              <a href="/docs" className="text-gray-400 hover:text-white">
                Documentation
              </a>
              <a href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400 text-sm">
              © 2024 Writing Timeline Platform. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}