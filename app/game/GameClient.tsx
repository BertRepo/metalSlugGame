'use client';

import dynamic from 'next/dynamic';

const Game = dynamic(() => import('./Game'), {
  loading: () => (
    <div className="flex items-center justify-center" style={{ width: '800px', height: '600px', backgroundColor: '#000', borderRadius: '8px' }}>
      <div className="text-white text-2xl">游戏加载中...</div>
    </div>
  )
});

const GameClient: React.FC = () => {
  return <Game />;
};

export default GameClient;