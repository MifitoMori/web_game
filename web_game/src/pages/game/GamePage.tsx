import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Text, Stack, Group, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const GAME_URL = 'http://localhost:8080';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8080') return;
      
      const { type, data } = event.data;
      
      if (type === 'GAME_END') {
        setGameResult(data.result);
        setShowExitModal(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Блокируем клики по iframe когда модалка открыта
  useEffect(() => {
    if (showExitModal && iframeRef.current) {
      // Блокируем pointer-events у iframe
      iframeRef.current.style.pointerEvents = 'none';
    } else if (iframeRef.current) {
      iframeRef.current.style.pointerEvents = 'auto';
    }
  }, [showExitModal]);

  const handleExit = () => {
    setShowExitModal(false);
    navigate('/lobby');
  };

  const handleRestart = () => {
    setGameResult(null);
    setShowExitModal(false);
    if (iframeRef.current) {
      iframeRef.current.src = GAME_URL;
    }
  };

  const handleRetry = () => {
    setLoadError(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = GAME_URL;
    }
  };

  if (loadError) {
    return (
      <Center style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <Text size="xl" c="red">Не удалось загрузить игру</Text>
        <Text c="dimmed">Убедитесь, что игровой сервер запущен на {GAME_URL}</Text>
        <Group>
          <Button onClick={handleRetry} variant="light">
            Попробовать снова
          </Button>
          <Button onClick={() => navigate('/lobby')} variant="subtle">
            Вернуться в лобби
          </Button>
        </Group>
      </Center>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 20,
      }}>
        <Button 
          variant="filled" 
          color="red" 
          size="sm"
          onClick={() => setShowExitModal(true)}
          style={{ opacity: 0.8, backdropFilter: 'blur(5px)' }}
        >
          ✕ Выйти из игры
        </Button>
      </div>

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
        src={GAME_URL}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isLoading ? 'none' : 'block',
          pointerEvents: showExitModal ? 'none' : 'auto' // Блокируем iframe когда модалка открыта
        }}
        title="Game"
        allow="fullscreen"
        onLoad={() => {
          console.log('Game loaded successfully');
          setIsLoading(false);
          setLoadError(false);
        }}
        onError={() => {
          console.error('Failed to load game');
          setLoadError(true);
          setIsLoading(false);
        }}
      />

      {/* Модальное окно - полностью блокирующее */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
          }}
          onClick={(e) => {
            // Блокируем любые клики по фону
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
              // Предотвращаем всплытие
              e.stopPropagation();
            }}
          >
            {gameResult ? (
              <>
                <Text size="48px" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: gameResult === 'victory' ? '#33ff33' : '#ff3333' }}>
                  {gameResult === 'victory' ? '🎉 Поздравляю!' : '💀 ПОРАЖЕНИЕ'}
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
                    style={{ minWidth: '150px' }}
                  >
                    Играть снова
                  </Button>
                  <Button 
                    onClick={handleExit} 
                    variant="subtle" 
                    size="lg"
                    color="gray"
                    style={{ minWidth: '150px' }}
                  >
                    Выйти в лобби
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Text size="32px" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#ffaa00' }}>
                  Выйти из игры?
                </Text>
                <Text style={{ marginBottom: '15px', color: '#fff' }}>
                  Вы уверены, что хотите выйти из игры?
                </Text>
                <Text size="sm" style={{ marginBottom: '30px', color: '#888' }}>
                  Прогресс текущей игры будет потерян.
                </Text>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <Button 
                    onClick={() => setShowExitModal(false)} 
                    variant="subtle" 
                    size="lg"
                    color="blue"
                  >
                    Продолжить игру
                  </Button>
                  <Button 
                    onClick={handleExit} 
                    color="red" 
                    size="lg"
                  >
                    Выйти
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