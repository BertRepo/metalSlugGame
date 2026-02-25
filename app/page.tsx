'use client'

import dynamic from 'next/dynamic';

// 动态导入游戏组件，禁用SSR
// Phaser需要浏览器环境，不能在服务器端渲染
const Game = dynamic(() => import('./game/Game'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-white text-2xl animate-pulse">
        🎮 游戏加载中...
      </div>
      <div className="mt-4 text-gray-400">
        正在初始化游戏引擎...
      </div>
    </div>
  )
});

export default function Home() {
  return <Game />;
}
