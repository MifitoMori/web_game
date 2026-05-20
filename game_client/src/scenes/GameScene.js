import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import OpponentPlayer from '../entities/OpponentPlayer.js';
import HUD from '../ui/HUD.js';
import AmmoPack from '../items/AmmoPack.js';
import HealthPack from '../items/HealthPack.js';
import Effects from '../utils/Effects.js'; 
import { multiplayerSocket } from '../network/socket-client.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.isMultiplayer = false;
        this.opponent = null;
        this.lastSyncTime = 0;
        this.syncInterval = 50;
    }

    init(data) {
        // Читаем параметры из data (переданные через React state)
        this.isMultiplayer = data?.isMultiplayer || false;
        this.roomId = data?.roomId || null;
        this.playerId = data?.playerId || null;
        this.playerName = data?.playerName || 'Игрок';
        this.serverIp = data?.serverIp || null;
        

        if (!this.isMultiplayer) {
            const urlParams = new URLSearchParams(window.location.search);
            this.isMultiplayer = urlParams.get('multiplayer') === 'true';
            this.roomId = urlParams.get('roomId');
            this.playerId = urlParams.get('playerId') ? parseInt(urlParams.get('playerId')) : null;
            this.playerName = urlParams.get('playerName') || 'Игрок';
            this.serverIp = urlParams.get('server');
        }
        
        console.log('GameScene init:', { 
            isMultiplayer: this.isMultiplayer, 
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            serverIp: this.serverIp
        });
    }

    preload() {
        // Загрузка ассетов
        this.load.image('background', 'assets/background2.png');
        this.load.image('player_hold', 'assets/kenney/player.png');
        this.load.image('player', 'assets/kenney/player_battle.png');
        this.load.image('bullet', 'assets/kenney/bullet_gun.png');
        this.load.image('weapon', 'assets/kenney/weapon_gun.png');
        this.load.image('weapon_silencer', 'assets/kenney/weapon_silencer.png');
        this.load.image('weapon_machine', 'assets/kenney/weapon_machine.png');
        this.load.image('enemy_hold', 'assets/kenney/robot1_hold.png');
        this.load.image('enemy', 'assets/kenney/robot_battle.png');
        this.load.image('tile_01', 'assets/kenney/tile_01.png');
        this.load.image('tile_02', 'assets/kenney/tile_02.png');
        this.load.image('tile_03', 'assets/kenney/tile_03.png');
        this.load.image('tile_04', 'assets/kenney/tile_04.png');
        this.load.image('tile_05', 'assets/kenney/tile_05.png');
        this.load.image('tile_06', 'assets/kenney/tile_06.png');
        this.load.image('ammoPack', 'assets/kenney/ammo_bullet.png'); 
        this.load.image('healthPack', 'assets/kenney/health.png');

        // Загрузка препятствий и декора
        this.load.image('tile_156', 'assets/kenney/decor/tile_156.png');
        this.load.image('tile_157', 'assets/kenney/decor/tile_157.png');
        this.load.image('tile_183', 'assets/kenney/decor/tile_183.png');
        this.load.image('tile_237', 'assets/kenney/decor/tile_237.png');
        this.load.image('tile_205', 'assets/kenney/decor/tile_205.png');
        this.load.image('tile_238', 'assets/kenney/decor/tile_238.png');
        this.load.image('tile_239', 'assets/kenney/decor/tile_239.png');
        this.load.image('tile_240', 'assets/kenney/decor/tile_240.png');
        this.load.image('tile_262', 'assets/kenney/decor/tile_262.png');
        this.load.image('tile_263', 'assets/kenney/decor/tile_263.png');
        this.load.image('tile_264', 'assets/kenney/decor/tile_264.png');
        this.load.image('tile_317', 'assets/kenney/decor/tile_317.png');
        this.load.image('tile_318', 'assets/kenney/decor/tile_318.png');
        this.load.image('tile_359', 'assets/kenney/decor/tile_359.png');
        this.load.image('tile_368', 'assets/kenney/decor/tile_368.png');
        this.load.image('tile_523', 'assets/kenney/decor/tile_523.png');
    }

    async create() {
        this.input.setDefaultCursor("url('assets/kenney/aim.png'), auto");

        this.setupWorld();
        this.setupWalls();
        
        // Создание игрока
        this.player = new Player(this, 100, this.cameras.main.centerY);      
          
        if (this.isMultiplayer) {
            // Мультиплеерный режим
            await this.setupMultiplayer();
        } else {
            // Соло режим - создаем врага
            this.enemy = new Enemy(this, this.sys.game.config.width - 100, this.cameras.main.centerY);
            this.player.body.setImmovable(false);
            this.enemy.body.setImmovable(false);
        }

        // Создание UI
        this.hud = new HUD(this, this.player);

        this.effects = new Effects(this);
        
        // Группы для предметов
        this.healthPacks = this.physics.add.group();
        this.ammoPacks = this.physics.add.group();
        
        this.playerBullets = this.physics.add.group({
            maxSize: 100
        });
        this.playerBullets.setDepth(1);
        this.enemyBullets = this.physics.add.group({
            maxSize: 100
        });
        
        // Создание предметов на карте
        this.spawnItems();
        
        // Настройка коллизий
        this.setupCollisions();
        
        // Настройка ввода
        this.setupInput();
        
        // Переменные для спавна предметов 
        this.time.addEvent({
            delay: 30000,
            callback: this.spawnItems,
            callbackScope: this,
            loop: true
        });
        
        this.maxItemsOnMap = 4;
        this.gameOver = false;

        this.cameras.main.update();
        this.isInputLocked = false;
        this.setupExitHandler();
    }

    async setupMultiplayer() {
        console.log('Запуск мультиплеерного режима');
    
        if (typeof io === 'undefined') {
            console.error('Socket.IO не загружен!');
            this.showMessage('Ошибка: Socket.IO не загружен', 3000);
            return;
        }
        
        try {
            await multiplayerSocket.connect(this.playerId || 1, this.playerName);
            console.log('WebSocket подключен');
            
            if (this.roomId) {
                multiplayerSocket.roomId = this.roomId;
            } else {
                multiplayerSocket.findMatch();
                this.showSearchingUI();
            }
            
            this.setupMultiplayerEvents();
        } catch (error) {
            console.error('Ошибка подключения к WebSocket:', error);
            this.showConnectionError();
        }
    }

    showSearchingUI() {
        // Создаем UI для ожидания соперника
        this.searchingText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            '🔍 Поиск соперника...\nОжидание игрока',
            {
                fontSize: '28px',
                fill: '#ffffff',
                align: 'center',
                backgroundColor: '#000000aa',
                padding: { x: 20, y: 15 }
            }
        ).setOrigin(0.5).setDepth(1000);
        
        // Анимация пульсации
        this.tweens.add({
            targets: this.searchingText,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    hideSearchingUI() {
        if (this.searchingText) {
            this.searchingText.destroy();
            this.searchingText = null;
        }
    }

    setupMultiplayerEvents() {
        // Ожидание игрока
        multiplayerSocket.onWaitingForPlayer((data) => {
            console.log('Ожидание соперника...', data);
            if (!this.searchingText) {
                this.showSearchingUI();
            }
        });

        // Матч найден
        multiplayerSocket.onMatchFound((data) => {
            console.log('Соперник найден!', data);
            this.hideSearchingUI();
            this.roomId = data.roomId;
            
            // Создаем оппонента
            this.opponent = new OpponentPlayer(
                this,
                data.opponent.x || this.sys.game.config.width - 150,
                data.opponent.y || this.cameras.main.centerY,
                data.opponent.nickname
            );
        });

        // Отмена поиска
        multiplayerSocket.onSearchCancelled(() => {
            this.hideSearchingUI();
            this.showMessage('Поиск отменён', 2000);
        });

        // Обновление позиции оппонента
        multiplayerSocket.onOpponentUpdate((data) => {
            if (this.opponent) {
                this.opponent.updateFromServer(data);
            }
        });

        // Выстрел оппонента
        multiplayerSocket.onOpponentShot((bulletData) => {
            this.createOpponentBullet(bulletData);
        });

        // Попадание в оппонента
        multiplayerSocket.onOpponentHit((data) => {
            if (this.opponent && data.hitX && data.hitY) {
                this.opponent.takeDamage(data.damage);
                this.effects.hitEffect(data.hitX, data.hitY, true);
            }
        });

        // Оппонент вышел
        multiplayerSocket.onOpponentLeft(() => {
            this.showMessage('Соперник покинул игру', 3000);
            this.gameDefeat();
        });

        // Конец игры
        multiplayerSocket.onGameEnd((data) => {
            if (data.winnerId === multiplayerSocket.userId) {
                this.gameVictory();
            } else {
                this.gameDefeat();
            }
        });
    }

    createOpponentBullet(bulletData) {
        const bullet = this.enemyBullets.create(bulletData.x, bulletData.y, 'bullet');
        bullet.setScale(1);
        bullet.body.allowGravity = false;
        bullet.setTint(0xff8888);
        bullet.rotation = bulletData.angle + 1.6;
        
        const bulletSpeed = 350;
        bullet.body.setVelocity(
            Math.cos(bulletData.angle) * bulletSpeed,
            Math.sin(bulletData.angle) * bulletSpeed
        );
        
        // Устанавливаем размер хитбокса
        if (Math.abs(bulletData.angle) < 0.9) bullet.body.setSize(15, 7, true);
        else if (Math.abs(bulletData.angle) < 2.3) bullet.body.setSize(7, 15, true);
        else bullet.body.setSize(15, 7, true);
        
        // Проверка попадания в игрока
        this.physics.add.overlap(bullet, this.player, (b, p) => {
            b.destroy();
            p.takeDamage(10);
            
            // Отправляем на сервер информацию о попадании
            multiplayerSocket.socket?.emit('playerHit', {
                roomId: this.roomId,
                damage: 10,
                newHp: p.hp,
                hitX: p.x,
                hitY: p.y
            });
        });
        
        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    showMessage(text, duration) {
        const msg = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            text,
            {
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#000000aa',
                padding: { x: 15, y: 10 }
            }
        ).setOrigin(0.5).setDepth(1000);
        
        this.time.delayedCall(duration, () => msg.destroy());
    }

    showConnectionError() {
        const errorText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Не удалось подключиться к серверу\nПроверьте запущен ли бэкенд',
            {
                fontSize: '24px',
                fill: '#ff3333',
                align: 'center',
                backgroundColor: '#000000aa',
                padding: { x: 20, y: 15 }
            }
        ).setOrigin(0.5).setDepth(1000);
        
        // Кнопка возврата
        this.time.delayedCall(3000, () => {
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'GAME_END', data: { result: 'defeat' } }, '*');
            }
        });
    }

    setupWorld() {
        this.createTileBackground();
        
        const borderSize = 20;
        this.physics.world.setBounds(borderSize, borderSize, 
            this.sys.game.config.width - borderSize * 2, 
            this.sys.game.config.height - borderSize * 2);
        
        // Создание видимых стен
        const walls = this.physics.add.staticGroup();
        
        const topWall = this.add.rectangle(0, 0, this.sys.game.config.width, borderSize, 0x000000);
        topWall.setOrigin(0, 0);
        this.physics.add.existing(topWall, true);
        walls.add(topWall);
        
        const bottomWall = this.add.rectangle(0, this.sys.game.config.height - borderSize + 4, 
            this.sys.game.config.width, borderSize, 0x000000);
        bottomWall.setOrigin(0, 0);
        this.physics.add.existing(bottomWall, true);
        walls.add(bottomWall);
        
        const leftWall = this.add.rectangle(0, 0, borderSize, this.sys.game.config.height, 0x000000);
        leftWall.setOrigin(0, 0);
        this.physics.add.existing(leftWall, true);
        walls.add(leftWall);
        
        const rightWall = this.add.rectangle(this.sys.game.config.width - borderSize, 0, 
            borderSize, this.sys.game.config.height, 0x000000);
        rightWall.setOrigin(0, 0);
        this.physics.add.existing(rightWall, true);
        walls.add(rightWall);
        
        this.borderWalls = walls;
    }

    createTileBackground() {
        const tileSize = 64;
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        
        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);
        
        const grassTiles = ['tile_01', 'tile_02', 'tile_03', 'tile_04'];
        const sandTiles = ['tile_05', 'tile_06'];
        
        this.backgroundTiles = this.add.group();
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * tileSize;
                const y = row * tileSize;
                
                let tileKey;
                
                const isBorder = row < 2 || row > rows - 3 || col < 2 || col > cols - 3;
                
                const isSandPatch = !isBorder && Math.random() < 0.1;
                
                if (isBorder || isSandPatch) {
                    
                    const sandIndex = Math.floor(Math.random() * sandTiles.length);
                    tileKey = sandTiles[sandIndex];
                } else {
                    const grassIndex = Math.floor(Math.random() * grassTiles.length);
                    tileKey = grassTiles[grassIndex];
                }
                
                const tile = this.add.image(x, y, tileKey);
                tile.setOrigin(0, 0);
                tile.setDisplaySize(tileSize, tileSize);
                this.backgroundTiles.add(tile);
            }
        }
        this.addDecorations();
    }

    addDecorations() {
        // Можно добавить случайные кусты, камни и т.д.
        // Пока оставим пустым, но можно расширить позже
    }

    setupWalls() {
        this.wallSegments = this.physics.add.staticGroup();
        
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        
        const wallTileSize = 64;
        
        // Центр арены
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        const startingWall = (startX, startY, count) => {
            const x = startX;
            let y = startY;
            if(startY == -1){
                y = (centerY - 2 * wallTileSize);
            } 
            for(let i = 0; i < count; i++){
                const wallSegment = this.wallSegments.create(x, y + (i * wallTileSize), 'tile_523');
                wallSegment.setOrigin(0.5, 0.5);
                
                wallSegment.body.setSize(wallTileSize / 2, wallTileSize);
                wallSegment.setRotation(Math.PI / 2);
                
                wallSegment.body.updateCenter();
            }
        }
    
        const centralWall = () => {
            const x = centerX - 2 * wallTileSize;
            const y = centerY - 3.5 * wallTileSize;
    
            for(let i = 0; i < 5; i++){
                const wallSegment = this.wallSegments.create(x + (i * wallTileSize), y, 'tile_523');
                wallSegment.setOrigin(0.5, 0.5);

                wallSegment.body.setSize(wallTileSize, wallTileSize / 2);
                
                wallSegment.body.updateCenter();
            }
    
            startingWall(x - 2 - wallTileSize * 0.25, y + wallTileSize * 0.25 + 3, 3);
            startingWall(x + 2 + wallTileSize * 4.25, y + wallTileSize * 0.25 + 3, 3);
        }
        
        startingWall(200, -1, 5);
        startingWall(width - 200, -1, 5);
    
        centralWall();
    }

    setupCollisions() {
        this.physics.add.collider(this.player, this.wallSegments);
        this.physics.add.collider(this.player, this.borderWalls);
        
        this.physics.add.collider(this.playerBullets, this.borderWalls, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.borderWalls, (bullet) => bullet.destroy());

        if (this.enemy) {
            this.physics.add.collider(this.enemy, this.wallSegments);
            this.physics.add.collider(this.enemy, this.borderWalls);
            this.physics.add.overlap(this.playerBullets, this.enemy, this.onBulletHitEnemy, null, this);
        }
        
        if (this.opponent) {
            this.physics.add.collider(this.opponent, this.wallSegments);
            this.physics.add.collider(this.opponent, this.borderWalls);
        }
        
        this.physics.add.collider(this.playerBullets, this.wallSegments, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.wallSegments, (bullet) => bullet.destroy());
        
        this.physics.add.overlap(this.playerBullets, this.enemy, this.onBulletHitEnemy, null, this);
        
        this.physics.add.overlap(this.player, this.healthPacks, this.onCollectHealth, null, this);

        this.physics.add.overlap(this.player, this.ammoPacks, this.onCollectAmmo, null, this);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // Дэш на кнопку Shift
        this.dashKeyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
            
        // Стрельба мышью
        this.mousePressed = false;
        this.lastShotTime = 0;
        this.shotDelay = 150;
        
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.mousePressed = true;
        });
        
        this.input.on('pointerup', (pointer) => {
            if (pointer.leftButtonReleased()) this.mousePressed = false;
        });
        
        this.input.mouse.disableContextMenu();
        
        // Перезарядка
        this.input.keyboard.on('keydown-R', () => this.player.reload());
    }

    spawnItems() {
        // Проверяем, сколько предметов уже на карте
        const currentItems = this.healthPacks.getChildren().length + this.ammoPacks.getChildren().length;
        
        if (currentItems >= this.maxItemsOnMap) return;
        
        // Спавн 1-2 предметов, но не больше лимита
        const itemsToSpawn = Math.min(2, this.maxItemsOnMap - currentItems);
        
        for (let i = 0; i < itemsToSpawn; i++) {
            // Случайно выбираем тип предмета
            const isHealth = Phaser.Math.Between(0, 1) === 0;
            
            const x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
            const y = Phaser.Math.Between(100, this.sys.game.config.height - 100);

            const collides = this.physics.overlapRect(x, y, 1, 1)
                .some(hit => hit.gameObject === this.wallSegments);
            
            if (collides) return;
            
            // Проверяем, не спавнится ли предмет на игроке или враге
            const distanceToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
            const distanceToEnemy = Phaser.Math.Distance.Between(x, y, this.enemy.x, this.enemy.y);
            
            if (distanceToPlayer > 50 && distanceToEnemy > 50) {
                if (isHealth) {
                    new HealthPack(this, x, y, this.healthPacks);
                } else {
                    new AmmoPack(this, x, y, this.ammoPacks);
                }
            }
        }
    }

    onBulletHitEnemy(enemy, bullet) {
        bullet.destroy();
        this.enemy.takeDamage(10);
        
        if (this.enemy.hp <= 0 && !this.gameOver) {
            this.gameVictory();
        }
    }

    onCollectHealth(player, healthPack) {
        this.effects.pickupEffect(healthPack.x, healthPack.y, 'health');

        healthPack.destroy();
        this.player.heal(20);
    }

    onCollectAmmo(player, ammoPack) {
        this.effects.pickupEffect(ammoPack.x, ammoPack.y, 'ammo');

        ammoPack.destroy();
        this.player.addAmmo(10);
    }

    wallSegmentsColloder(player, wallSegment) {
        const dx = player.x - wallSegment.x;
        const dy = player.y - wallSegment.y;
        const angle = Math.atan2(dy, dx);
        
        player.x -= Math.cos(angle) * 2;
        player.y -= Math.sin(angle) * 2;
    }

    gameVictory() {
        this.gameOver = true;
        this.physics.pause();
        
        if (this.isMultiplayer && multiplayerSocket.socket) {
            multiplayerSocket.socket.emit('playerDeath', {
                roomId: this.roomId,
                winnerId: multiplayerSocket.userId
            });
            multiplayerSocket.disconnect();
        }
        
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'GAME_END',
                data: { result: 'victory', kills: 1, time: 0 }
            }, '*');
        }
    }

    gameDefeat() {
        this.gameOver = true;
        this.physics.pause();
        
        if (this.isMultiplayer && multiplayerSocket.socket) {
            multiplayerSocket.disconnect();
        }
        
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'GAME_END',
                data: { result: 'defeat', kills: 0, time: 0 }
            }, '*');
        }
    }

    setupExitHandler() {
        // Обработчик нажатия ESC
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this.gameOver) {
                if (!this.isInputLocked) {
                    this.lockPlayerControl();
                } else {
                    this.unlockPlayerControl();
                }
            }
        });
        
        // Слушаем сообщения от родительского окна
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'RESUME_GAME') {
                this.unlockPlayerControl();
            }
        });
    }

    lockPlayerControl() {
        if (this.isInputLocked) return;
        this.isInputLocked = true;
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0, 0);
        }
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'SHOW_EXIT_MODAL', data: {} }, '*');
        }
    }

    unlockPlayerControl() {
        if (!this.isInputLocked) return;
        this.isInputLocked = false;
    }

    update() {
        if (this.gameOver) return;

        if (!this.player || !this.input || !this.input.keyboard) {
            return;
        }
        
        if (!this.cursors || !this.wasd || !this.dashKeyShift) {
            return;
        }
        
        // Обработка коллизии между игроком и врагом (отталкивание)
        if (!this.isMultiplayer && this.player && this.enemy && this.enemy.active) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y);
            const minDistance = (this.player.width * 0.5) + (this.enemy.width * 0.5);
            
            if (distance < minDistance) {
                const angle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
                const overlap = minDistance - distance;
                const pushForce = overlap * 0.8;
                
                this.player.x += Math.cos(angle) * pushForce;
                this.player.y += Math.sin(angle) * pushForce;
                this.enemy.x -= Math.cos(angle) * pushForce;
                this.enemy.y -= Math.sin(angle) * pushForce;
            }
        }
        
        const dashJustPressed = Phaser.Input.Keyboard.JustDown(this.dashKeyShift);
        
        if (dashJustPressed && !this.player.isDashing && this.player.dashCooldown <= 0) {
            // Получаем направление движения
            let moveX = 0, moveY = 0;
            if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
            if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;
            if (this.cursors.up.isDown || this.wasd.up.isDown) moveY = -1;
            if (this.cursors.down.isDown || this.wasd.down.isDown) moveY = 1;
            
            this.player.dash(moveX, moveY);
        }

        // Обновление игрока
        this.player.update(this.cursors, this.wasd, this.mousePressed, this.input.activePointer);
        
        // Стрельба игрока
        if (this.mousePressed && !this.player.isReloading) {
            const now = Date.now();
            if (now - this.lastShotTime >= this.shotDelay) {
                this.lastShotTime = now;
                this.player.shoot(this.input.activePointer, this.playerBullets);
            }
        }
        
        // Обновление врага
        if (this.enemy && this.enemy.active) {
            this.enemy.update(this.player);
        }
        
        // Обновление UI
        this.hud.update();

        if (this.isMultiplayer && multiplayerSocket.connected && multiplayerSocket.roomId && !this.gameOver) {
            const now = Date.now();
            if (now - this.lastSyncTime >= this.syncInterval) {
                this.lastSyncTime = now;
                multiplayerSocket.updatePlayerPosition({
                    x: this.player.x,
                    y: this.player.y,
                    rotation: this.player.rotation,
                    hp: this.player.hp,
                    ammo: this.player.ammo
                });
            }
        }
        
        // Проверка смерти игрока
        if (this.player.hp <= 0) {
            this.gameDefeat();
        }
    }
}