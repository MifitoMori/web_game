// main.js
import { WORLD_HEIGHT, WORLD_WIDTH } from './config/world.js?v=20260531-titles';
import GameScene from './scenes/GameScene.js?v=20260531-titles';

// Функция ожидания готовности контейнера
function waitForContainer() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (document.body && document.body.clientWidth > 0) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 10);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    await waitForContainer();

    await new Promise(r => setTimeout(r, 50));
    
    const config = {
        type: Phaser.AUTO,
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [GameScene]
    };
    
    new Phaser.Game(config);
    
    // При изменении размера окна обновляем игру
});
