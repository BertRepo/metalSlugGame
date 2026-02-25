'use client';

import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './config';

export default function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initGame = useCallback(() => {
    if (containerRef.current && !gameRef.current) {
      // 创建游戏配置，指定父容器
      const config: Phaser.Types.Core.GameConfig = {
        ...gameConfig,
        parent: containerRef.current
      };
      gameRef.current = new Phaser.Game(config);
    }
  }, []);

  useEffect(() => {
    // 确保在客户端运行
    if (typeof window !== 'undefined') {
      // 延迟初始化，确保DOM已准备好
      const timer = setTimeout(() => {
        initGame();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
      };
    }
  }, [initGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <h1 className="text-4xl font-bold text-white mb-4 text-center">
        🎮 无敌合金弹头
      </h1>
      <p className="text-gray-300 mb-4 text-center">
        使用方向键移动和跳跃，空格键射击！消灭敌人获得分数！
      </p>
      <div 
        ref={containerRef} 
        className="rounded-lg overflow-hidden shadow-2xl border-4 border-yellow-500"
      />
      <div className="mt-6 text-gray-400 text-sm text-center">
        <p>💡 提示：跳上平台可以躲避敌人，射击消灭敌人获得100分！</p>
      </div>
    </div>
  );
}
