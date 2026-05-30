export default class HUD {
    constructor(scene, player, playerName = 'Игрок') {
        this.scene = scene;
        this.player = player;
        this.playerNameValue = playerName;
        this.opponent = null;
        this.opponentNameValue = '';

        this.panelX = 20;
        this.panelY = 20;
        this.panelWidth = 250;
        this.panelHeight = 110;
        this.opponentPanelWidth = 250;
        this.opponentPanelHeight = 88;
        this.opponentPanelY = 20;
        
        this.create();
    }
    
    create() {
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.85);
        panelBg.fillRoundedRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight, 15);
        
        const playerIcon = this.scene.add.image(this.panelX + 35, this.panelY + 30, 'player_hold');
        playerIcon.setScale(1);

        this.playerName = this.scene.add.text(this.panelX + 60, this.panelY + 15, this.playerNameValue, {
            fontSize: '18px',
            fill: '#ffaa00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        this.hpBarBg = this.scene.add.rectangle(this.panelX + 60, this.panelY + 53, 170, 15, 0x8e0101);
        this.hpBarBg.setOrigin(0, 0);
        
        this.hpBar = this.scene.add.rectangle(this.panelX + 60, this.panelY + 53, 170, 15, 0x33ff33);
        this.hpBar.setOrigin(0, 0);
        
        this.hpText = this.scene.add.text(this.panelX + 60, this.panelY + 40, 'HP: 100', {
            fontSize: '12px',
            fill: '#ffffff'
        });
        
        const bulletIcon = this.scene.add.image(this.panelX + 65, this.panelY + 85, 'bullet');
        bulletIcon.setScale(1);
        
        this.ammoText = this.scene.add.text(this.panelX + 80, this.panelY + 75, '30 / 30', {
            fontSize: '16px',
            fill: '#ffaa00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        this.elements = [
            panelBg,
            playerIcon,
            this.playerName,
            this.hpBarBg,
            this.hpBar,
            this.hpText,
            bulletIcon,
            this.ammoText
        ];

        this.createOpponentPanel();
    }

    createOpponentPanel() {
        const x = this.getOpponentPanelX();

        this.opponentPanelBg = this.scene.add.graphics();
        this.opponentPanelBg.fillStyle(0x1a1a2e, 0.85);
        this.opponentPanelBg.fillRoundedRect(
            x,
            this.opponentPanelY,
            this.opponentPanelWidth,
            this.opponentPanelHeight,
            15
        );

        this.opponentName = this.scene.add.text(x + 20, this.opponentPanelY + 16, '', {
            fontSize: '18px',
            fill: '#88ff88',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        this.opponentHpText = this.scene.add.text(x + 20, this.opponentPanelY + 42, 'HP: 100', {
            fontSize: '12px',
            fill: '#ffffff'
        });

        this.opponentHpBarBg = this.scene.add.rectangle(x + 20, this.opponentPanelY + 58, 210, 15, 0x8e0101);
        this.opponentHpBarBg.setOrigin(0, 0);

        this.opponentHpBar = this.scene.add.rectangle(x + 20, this.opponentPanelY + 58, 210, 15, 0xff3333);
        this.opponentHpBar.setOrigin(0, 0);

        this.opponentElements = [
            this.opponentPanelBg,
            this.opponentName,
            this.opponentHpText,
            this.opponentHpBarBg,
            this.opponentHpBar
        ];

        this.setOpponent(null);
    }

    getOpponentPanelX() {
        return this.scene.sys.game.config.width - this.opponentPanelWidth - 20;
    }

    setOpponent(opponent, nickname = '') {
        this.opponent = opponent;
        this.opponentNameValue = nickname || opponent?.nickname || '';

        const isVisible = Boolean(opponent);
        this.opponentElements.forEach((element) => element.setVisible(isVisible));

        if (isVisible) {
            this.opponentName.setText(this.opponentNameValue);
        }
    }
    
    update() {
        const percent = Phaser.Math.Clamp(this.player.hp / this.player.maxHp, 0, 1);
        this.hpBar.setSize(170 * percent, 15);
        this.hpText.setText(`HP: ${Math.max(0, this.player.hp)}`);
        
        if (percent > 0.6) this.hpBar.setFillStyle(0x33ff33);
        else if (percent > 0.3) this.hpBar.setFillStyle(0xffaa33);
        else this.hpBar.setFillStyle(0xff3333);
        
        const reserveAmmo = this.player.reserveAmmo ?? 0;
        this.ammoText.setText(`${this.player.ammo} / ${reserveAmmo}`);
        if (this.player.ammo <= 5) this.ammoText.setColor('#ff3333');
        else this.ammoText.setColor('#ffaa00');
        
        const playerBounds = this.player.getBounds();
        const panelBounds = new Phaser.Geom.Rectangle(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        
        const alpha = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, panelBounds) ? 0.3 : 1;
        this.elements.forEach(el => el.setAlpha(alpha));

        this.updateOpponentPanel();
    }

    updateOpponentPanel() {
        if (!this.opponent) return;

        const percent = Phaser.Math.Clamp(this.opponent.hp / this.opponent.maxHp, 0, 1);
        this.opponentHpBar.setSize(210 * percent, 15);
        this.opponentHpText.setText(`HP: ${Math.max(0, this.opponent.hp)}`);
    }
}
