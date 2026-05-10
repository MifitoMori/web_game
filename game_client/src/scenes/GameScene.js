import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import HUD from '../ui/HUD.js';
import AmmoPack from '../items/AmmoPack.js';
import HealthPack from '../items/HealthPack.js';
import Effects from '../utils/Effects.js'; 

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Загрузка ассетов
        this.load.image('background', 'assets/background2.png');
        this.load.image('player_hold', 'assets/kenney/player.png');
        this.load.image('player', 'assets/kenney/player_battle.png');
        this.load.image('bullet', 'assets/kenney/bullet_gun.png');
        this.load.image('weapon', 'assets/kenney/weapon_gun.png');
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

    create() {
        this.setupWorld();

        this.setupWalls();
        
        // Создание игрока
        this.player = new Player(this, 100, this.cameras.main.centerY);        
        // Создание врага
        this.enemy = new Enemy(this, this.sys.game.config.width - 100, this.cameras.main.centerY);

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
        
        // Лимит предметов на карте
        this.maxItemsOnMap = 4;
        
        // Флаг окончания игры
        this.gameOver = false;
        
        // Добавляем отталкивание вручную через update
        this.player.body.setImmovable(false);
        this.enemy.body.setImmovable(false);

        this.cameras.main.update();
    }

    setupWorld() {

        this.createTileBackground();
        
        // Границы мира
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
        // Загружаем все тайлы
        const tileSize = 64;
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        
        // Количество тайлов по горизонтали и вертикали
        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);
        
        // Массивы тайлов
        const grassTiles = ['tile_01', 'tile_02', 'tile_03', 'tile_04'];
        const sandTiles = ['tile_05', 'tile_06'];
        
        // Создаем группу для фона (чтобы можно было управлять)
        this.backgroundTiles = this.add.group();
        
        // Проходим по всем ячейкам сетки
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * tileSize;
                const y = row * tileSize;
                
                // Выбираем тип тайла в зависимости от позиции
                let tileKey;
                
                // Создаем эффект "пляжа" - песок у границ
                const isBorder = row < 2 || row > rows - 3 || col < 2 || col > cols - 3;
                // Создаем случайные "проплешины" песка внутри
                const isSandPatch = !isBorder && Math.random() < 0.1;
                
                if (isBorder || isSandPatch) {
                    // Песок
                    const sandIndex = Math.floor(Math.random() * sandTiles.length);
                    tileKey = sandTiles[sandIndex];
                } else {
                    // Трава
                    const grassIndex = Math.floor(Math.random() * grassTiles.length);
                    tileKey = grassTiles[grassIndex];
                }
                
                // Создаем тайл
                const tile = this.add.image(x, y, tileKey);
                tile.setOrigin(0, 0);
                tile.setDisplaySize(tileSize, tileSize);
                this.backgroundTiles.add(tile);
            }
        }
        
        // Добавляем декоративные элементы (опционально)
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

        this.physics.add.collider(this.enemy, this.wallSegments);
        this.physics.add.collider(this.enemy, this.borderWalls);
        
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

    wallSegmentsColloder(player, wallSegment) {
        const dx = player.x - wallSegment.x;
        const dy = player.y - wallSegment.y;
        const angle = Math.atan2(dy, dx);
        
        player.x -= Math.cos(angle) * 2;
        player.y -= Math.sin(angle) * 2;
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

    gameVictory() {
        this.gameOver = true;
        this.physics.pause();
        
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
        
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'GAME_END',
                data: { result: 'defeat', kills: 0, time: 0 }
            }, '*');
        }
    }

    update() {
        if (this.gameOver) return;
        
        // Обработка коллизии между игроком и врагом (отталкивание)
        if (this.player && this.enemy && this.enemy.active) {
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
        this.enemy.update(this.player);
        
        // Обновление UI
        this.hud.update();
        
        // Проверка смерти игрока
        if (this.player.hp <= 0) {
            this.gameDefeat();
        }
    }
}