// web_game/src/pages/game/GamePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Text, Stack, Group } from '@mantine/core';
import GameIframe from '../../components/game/GameIframe';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);

  const handleGameEnd = (result: 'victory' | 'defeat', data?: any) => {
    setGameResult(result);
    setShowExitModal(true);
    
    // TODO: Отправить результат на ваш бэкенд
    console.log('Game ended:', result, data);
    
    // Пример отправки на бэкенд
    // fetch('/api/game/stats', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ result, ...data })
    // });
  };

  const handleExit = () => {
    setShowExitModal(false);
    navigate('/lobby');
  };

  const handleRestart = () => {
    setShowExitModal(false);
    setGameResult(null);
    // Перезагружаем iframe через изменение key
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Кнопка выхода поверх iframe */}
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
          ✕ Выйти
        </Button>
      </div>

      {/* Игра в iframe */}
      <GameIframe onGameEnd={handleGameEnd} onExit={handleExit} />

      {/* Модальное окно */}
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