// web_game/src/pages/game/GamePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Text, Stack, Group, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';

// ПРАВИЛЬНЫЙ URL вашей игры - порт 8080
const GAME_URL = 'http://localhost:8080';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Слушаем сообщения от игры
    const handleMessage = (event: MessageEvent) => {
      // Проверяем, что сообщение от нашей игры (порт 8080)
      if (event.origin !== 'http://localhost:8080') {
        return;
      }
      
      const { type, data } = event.data;
      
      if (type === 'GAME_END') {
        setGameResult(data.result);
        setShowExitModal(true);
        
        console.log('Game ended:', data);
        
        notifications.show({
          title: data.result === 'victory' ? 'Победа!' : 'Поражение',
          message: data.result === 'victory' ? 'Вы победили врага!' : 'Вы проиграли...',
          color: data.result === 'victory' ? 'green' : 'red',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleExit = () => {
    setShowExitModal(false);
    navigate('/lobby');
  };

  const handleRestart = () => {
    setGameResult(null);
    setShowExitModal(false);
    // Перезагружаем iframe
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
        <Text c="dimmed">Убедитесь, что игровой сервер запущен на http://localhost:8080</Text>
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
          <Text size="sm" c="dimmed">Пожалуйста, подождите</Text>
        </Center>
      )}

      <iframe
        ref={iframeRef}
        src={GAME_URL}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isLoading ? 'none' : 'block'
        }}
        title="Game"
        allow="fullscreen"
        onLoad={() => {
          console.log('Game loaded successfully from port 8080');
          setIsLoading(false);
          setLoadError(false);
        }}
        onError={() => {
          console.error('Failed to load game from port 8080');
          setLoadError(true);
          setIsLoading(false);
        }}
      />

      <Modal
        opened={showExitModal}
        onClose={() => setShowExitModal(false)}
        title={gameResult === 'victory' ? '🎉 Победа!' : gameResult === 'defeat' ? '💀 Поражение' : 'Выйти из игры?'}
        centered
      >
        <Stack>
          {gameResult ? (
            <>
              <Text>
                {gameResult === 'victory' 
                  ? 'Поздравляем! Вы победили врага.' 
                  : 'Вы проиграли. Попробуйте снова!'}
              </Text>
              <Text size="sm" c="dimmed">
                {gameResult === 'victory' 
                  ? '+100 опыта и 50 кредитов' 
                  : '+10 опыта за участие'}
              </Text>
              <Group justify="flex-end">
                <Button onClick={handleRestart} color="blue">
                  Играть снова
                </Button>
                <Button onClick={handleExit} variant="subtle">
                  Выйти в лобби
                </Button>
              </Group>
            </>
          ) : (
            <>
              <Text>Вы уверены, что хотите выйти из игры?</Text>
              <Text size="sm" c="dimmed">Прогресс текущей игры будет потерян.</Text>
              <Group justify="flex-end">
                <Button onClick={() => setShowExitModal(false)} variant="subtle">
                  Продолжить игру
                </Button>
                <Button onClick={handleExit} color="red">
                  Выйти
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </div>
  );
};

export default GamePage;