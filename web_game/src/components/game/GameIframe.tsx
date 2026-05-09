import React, { useRef, useEffect, useState } from 'react';
import { Loader, Center, Button, Group } from '@mantine/core';
import { IconDeviceGamepad2 } from '@tabler/icons-react';

const GAME_URL = 'http://localhost:8080';

interface GameIframeProps {
  onGameEnd?: (result: 'victory' | 'defeat', data?: any) => void;
  onExit?: () => void;
}

const GameIframe: React.FC<GameIframeProps> = ({ onGameEnd, onExit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== GAME_URL) return;
      
      const { type, data } = event.data;
      
      if (type === 'GAME_END') {
        onGameEnd?.(data.result, data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => window.removeEventListener('message', handleMessage);
  }, [onGameEnd]);

  const sendUserData = () => {
    if (iframeRef.current?.contentWindow) {
      const userData = {
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
      };
      
      iframeRef.current.contentWindow.postMessage({
        type: 'USER_DATA',
        data: userData
      }, GAME_URL);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    sendUserData();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <Center style={{ height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <IconDeviceGamepad2 size={64} opacity={0.5} />
        <div>Не удалось загрузить игру</div>
        <Button onClick={() => window.location.reload()}>
          Попробовать снова
        </Button>
      </Center>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <Center style={{ 
          position: 'absolute', 
          inset: 0, 
          background: '#1a1a2e',
          zIndex: 10,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Loader size="xl" />
          <div>Загрузка игры...</div>
        </Center>
      )}
      
      <iframe
        ref={iframeRef}
        src={GAME_URL}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: loading ? 'none' : 'block'
        }}
        title="Game"
        allow="fullscreen"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default GameIframe;