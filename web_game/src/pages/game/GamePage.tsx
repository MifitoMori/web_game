import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Text, Center, Loader } from '@mantine/core';

// Сервис для определения IP
class NetworkService {
  private static instance: NetworkService;
  private serverIp: string = 'localhost';

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  async getServerIp(): Promise<string> {
    try {
      const response = await fetch('/api/network/ip');
      const data = await response.json();
      this.serverIp = data.ip || 'localhost';
      console.log('Server IP detected:', this.serverIp);
      return this.serverIp;
    } catch (error) {
      console.warn('Failed to detect server IP, using localhost');
      return 'localhost';
    }
  }

  async getGameUrl(): Promise<string> {
    const ip = await this.getServerIp();
    return `http://${ip}:8080`;
  }
}

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
  const [gameUrl, setGameUrl] = useState<string>('http://localhost:8080');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Получаем параметры из location state
  const locationState = location.state as {
    isMultiplayer?: boolean;
    roomId?: string;
    opponent?: any;
    playerId?: number;
    playerName?: string;
    serverIp?: string;
  } || {};

  // Определяем URL игры при загрузке компонента
  useEffect(() => {
    const initGameUrl = async () => {
      // Если IP передан через state, используем его
      if (locationState.serverIp) {
        const url = `http://${locationState.serverIp}:8080`;
        setGameUrl(url);
        console.log('Game URL from state:', url);
      } else {
        // Иначе определяем автоматически
        const networkService = NetworkService.getInstance();
        const url = await networkService.getGameUrl();
        setGameUrl(url);
        console.log('Game URL auto-detected:', url);
      }
    };
    
    initGameUrl();
  }, [locationState.serverIp]);

  // Формируем URL для iframe с параметрами
  const getIframeSrc = () => {
    const baseUrl = gameUrl;
    const params = new URLSearchParams();
    
    if (locationState.isMultiplayer !== undefined) {
      params.set('multiplayer', String(locationState.isMultiplayer));
    }
    if (locationState.roomId) {
      params.set('roomId', locationState.roomId);
    }
    if (locationState.playerId) {
      params.set('playerId', String(locationState.playerId));
    }
    if (locationState.playerName) {
      params.set('playerName', encodeURIComponent(locationState.playerName));
    }
    if (locationState.serverIp) {
      params.set('server', locationState.serverIp);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!gameUrl || !event.origin) return;
      
      try {
        const eventOrigin = new URL(event.origin);
        const gameOrigin = new URL(gameUrl);
        if (eventOrigin.host !== gameOrigin.host) return;
      } catch {
      }
      
      const { type, data } = event.data || {};
      
      if (type === 'GAME_END') {
        setGameResult(data?.result);
        setShowExitModal(true);
      }
      
      if (type === 'SHOW_EXIT_MODAL') {
        setShowExitModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [gameUrl]);

  const handleExit = () => {
    setShowExitModal(false);
    navigate('/lobby');
  };

  const handleRestart = () => {
    setGameResult(null);
    setShowExitModal(false);
    if (iframeRef.current) {
      iframeRef.current.src = getIframeSrc();
    }
  };

  const handleResumeGame = () => {
    setShowExitModal(false);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'RESUME_GAME'
      }, gameUrl);
    }
  };

  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = getIframeSrc();
    }
  };

  const iframeSrc = getIframeSrc();

  if (loadError) {
    return (
      <Center style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <Text size="xl" c="red">Не удалось загрузить игру</Text>
        <Text c="dimmed">Убедитесь, что игровой сервер запущен на {gameUrl}</Text>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Button onClick={handleRetry} variant="light">
            Попробовать снова
          </Button>
          <Button onClick={() => navigate('/lobby')} variant="subtle">
            Вернуться в лобби
          </Button>
        </div>
      </Center>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {isLoading && (
        <Center style={{ 
          position: 'absolute', 
          inset: 0, 
          background: '#1a1a2e',
          zIndex: 10,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <Loader size="xl" />
          <Text>Загрузка игры...</Text>
        </Center>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isLoading ? 'none' : 'block',
          pointerEvents: 'auto',
        }}
        title="Game"
        allow="fullscreen"
        onLoad={() => {
          console.log('Game loaded successfully:', iframeSrc);
          setIsLoading(false);
          setLoadError(false);
        }}
        onError={() => {
          console.error('Failed to load game:', iframeSrc);
          setLoadError(true);
          setIsLoading(false);
        }}
      />

      {/* Модальное окно - НЕ блокирует игру */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            return false;
          }}
        >
          <div
            ref={modalRef}
            style={{
              backgroundColor: '#1a1a2e',
              borderRadius: '20px',
              padding: '40px',
              minWidth: '400px',
              textAlign: 'center',
              border: gameResult === 'victory' ? '2px solid #33ff33' : gameResult === 'defeat' ? '2px solid #ff3333' : '2px solid #ffaa00',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)',
              cursor: 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {gameResult ? (
              <>
                <Text size="48px" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: gameResult === 'victory' ? '#33ff33' : '#ff3333' }}>
                  {gameResult === 'victory' ? 'Поздравляю!' : 'ПОРАЖЕНИЕ'}
                </Text>
                <Text size="lg" style={{ marginBottom: '30px', color: '#fff' }}>
                  {gameResult === 'victory' 
                    ? 'Поздравляем! Вы уничтожили врага.' 
                    : 'Вы были повержены. Попробуйте снова!'}
                </Text>
                <Text size="sm" style={{ marginBottom: '30px', color: '#888' }}>
                  {gameResult === 'victory' 
                    ? '+100 опыта и 50 кредитов' 
                    : '+10 опыта за участие'}
                </Text>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <Button 
                    onClick={handleRestart} 
                    color="blue" 
                    size="lg"
                  >
                    Играть снова
                  </Button>
                  <Button 
                    onClick={handleExit} 
                    variant="subtle" 
                    size="lg"
                    color="gray"
                  >
                    Выйти в лобби
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Text size="32px" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#ffaa00' }}>
                  МЕНЮ
                </Text>
                <Text size="sm" style={{ marginBottom: '30px', color: '#aaa' }}>
                  Игра продолжается
                </Text>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <Button 
                    onClick={handleResumeGame} 
                    color="blue" 
                    size="lg"
                  >
                    Закрыть
                  </Button>
                  <Button 
                    onClick={handleExit} 
                    variant="subtle" 
                    size="lg"
                    color="red"
                  >
                    Выйти в лобби
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;