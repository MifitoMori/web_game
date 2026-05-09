// main.js
import GameScene from './scenes/GameScene.js';

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
        width: window.innerWidth,
        height: window.innerHeight,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: window.innerWidth,
            height: window.innerHeight,
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
    
    const game = new Phaser.Game(config);
    
    // При изменении размера окна обновляем игру
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
});