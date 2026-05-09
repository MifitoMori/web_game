export default class HUD {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        this.panelX = 20;
        this.panelY = 20;
        this.panelWidth = 250;
        this.panelHeight = 130;
        
        this.create();
    }
    
    create() {
        // Панель
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.85);
        panelBg.fillRoundedRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight, 15);
        
        // Иконка игрока
        const playerIcon = this.scene.add.image(this.panelX + 35, this.panelY + 30, 'player_hold');
        playerIcon.setScale(1);

        // Имя
        this.playerName = this.scene.add.text(this.panelX + 60, this.panelY + 15, 'БОЕЦ', {
            fontSize: '18px',
            fill: '#ffaa00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        // HP Bar
        this.hpBarBg = this.scene.add.rectangle(this.panelX + 60, this.panelY + 53, 170, 15, 0x8e0101);
        this.hpBarBg.setOrigin(0, 0);
        
        this.hpBar = this.scene.add.rectangle(this.panelX + 60, this.panelY + 53, 170, 15, 0x33ff33);
        this.hpBar.setOrigin(0, 0);
        
        this.hpText = this.scene.add.text(this.panelX + 60, this.panelY + 40, 'HP: 100', {
            fontSize: '12px',
            fill: '#ffffff'
        });
        
        // Ammo
        const bulletIcon = this.scene.add.image(this.panelX + 65, this.panelY + 85, 'bullet');
        bulletIcon.setScale(1);
        
        this.ammoText = this.scene.add.text(this.panelX + 80, this.panelY + 75, '30', {
            fontSize: '16px',
            fill: '#ffaa00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        // Level
        this.levelText = this.scene.add.text(this.panelX + 60, this.panelY + 100, '⭐ Уровень: 1', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Сохраняем элементы для прозрачности
        this.elements = [panelBg, playerIcon, this.playerName, this.hpBarBg, 
                        this.hpBar, this.hpText, bulletIcon, this.ammoText, this.levelText];
    }
    
    update() {
        // Обновление HP
        const percent = this.player.hp / this.player.maxHp;
        this.hpBar.setSize(170 * percent, 15);
        this.hpText.setText(`HP: ${Math.max(0, this.player.hp)}`);
        
        // Цвет HP бара
        if (percent > 0.6) this.hpBar.setFillStyle(0x33ff33);
        else if (percent > 0.3) this.hpBar.setFillStyle(0xffaa33);
        else this.hpBar.setFillStyle(0xff3333);
        
        // Обновление аммуниции
        this.ammoText.setText(this.player.ammo);
        if (this.player.ammo <= 5) this.ammoText.setColor('#ff3333');
        else this.ammoText.setColor('#ffaa00');
        
        // Прозрачность при пересечении с панелью
        const playerBounds = this.player.getBounds();
        const panelBounds = new Phaser.Geom.Rectangle(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        
        const alpha = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, panelBounds) ? 0.3 : 1;
        this.elements.forEach(el => el.setAlpha(alpha));
    }
    
    showGameOver(isVictory) {
        const container = document.createElement('div');
        container.className = 'game-over-container';
        
        const title = document.createElement('h1');
        title.textContent = isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!';
        title.style.color = isVictory ? '#33ff33' : '#ff3333';
        
        const button = document.createElement('button');
        button.textContent = 'Играть снова';
        button.onclick = () => {
            container.remove();
            this.scene.scene.restart();
        };
        
        container.appendChild(title);
        container.appendChild(button);
        document.body.appendChild(container);
    }
}