export default class Enemy extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        
        this.scene = scene;
        this.speed = 1.5;
        this.hp = 50;
        this.maxHp = 50;
        
        this.spawnX = x;  
        this.spawnY = y;
        this.patrolRadius = 150;  
        this.patrolAngle = Math.random() * Math.PI * 2;  
        this.patrolSpeed = 0.02;  
        this.detectionRange = 300;
        
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        this.setScale(1);
        this.setTint(0xff3333);
        this.body.allowGravity = false;
        this.body.setImmovable(true); 
        
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);

        this.weapon = scene.add.image(x, y, 'weapon');
        this.weapon.setScale(1);
        this.weapon.setTint(0xff8888);
        
        this.healthBarBg = scene.add.rectangle(this.x, this.y - 25, 50, 6, 0x000000, 0.7);
        this.healthBarBg.setOrigin(0.5, 0.5);
        
        this.healthBar = scene.add.rectangle(this.x, this.y - 25, 50, 4, 0xff3333, 1);
        this.healthBar.setOrigin(0.5, 0.5);
        
        this.lastShotTime = 0;
        this.shootDelay = 2000;
    }
    
    update(player) {
        if (!player || !player.active) return;
        
        // Расчет расстояния до игрока
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        let angle;
        
        // Если игрок в зоне обнаружения - преследуем
        if (distanceToPlayer < this.detectionRange) {
            // Преследование игрока
            angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.body.setVelocity(
                Math.cos(angle) * this.speed * 100,
                Math.sin(angle) * this.speed * 100
            );
        } else {
            // Патрулирование по кругу вокруг точки спавна
            this.patrolAngle += this.patrolSpeed;
            
            const targetX = this.spawnX + Math.cos(this.patrolAngle) * this.patrolRadius;
            const targetY = this.spawnY + Math.sin(this.patrolAngle) * this.patrolRadius;
            
            angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            this.body.setVelocity(
                Math.cos(angle) * this.speed * 100,
                Math.sin(angle) * this.speed * 100
            );
        }
        
        this.rotation = angle - 1.6;

        this.weapon.x = this.x + Math.cos(angle) * 20;
        this.weapon.y = this.y + Math.sin(angle) * 20;
        this.weapon.rotation = angle;
        
        // Обновление полоски здоровья
        this.healthBarBg.x = this.x;
        this.healthBarBg.y = this.y - 25;
        this.healthBar.x = this.x;
        this.healthBar.y = this.y - 25;
        
        // Стрельба только если видит игрока
        if (distanceToPlayer < this.detectionRange) {
            const now = Date.now();
            if (now - this.lastShotTime >= this.shootDelay && this.active) {
                this.lastShotTime = now;
                this.shoot(player);
            }
        }
    }
    
    shoot(player) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        
        const offsetX = Math.cos(angle) * 30;
        const offsetY = Math.sin(angle) * 30;
        const bullet = this.scene.enemyBullets.create(this.x + offsetX, this.y + offsetY, 'bullet');
        
        bullet.setScale(1);
        bullet.body.allowGravity = false;
        bullet.owner = 'enemy'
        bullet.setTint(0xff3333);
        bullet.rotation = angle + 1.6;
        
        if (Math.abs(angle) < 0.9) bullet.body.setSize(15, 7, true);
        else if(Math.abs(angle) < 2.3) bullet.body.setSize(7, 15, true);
        else if(Math.abs(angle) < 3.14) bullet.body.setSize(15, 7, true);
        
        const bulletSpeed = 350;
        bullet.body.setVelocity(
            Math.cos(angle) * bulletSpeed,
            Math.sin(angle) * bulletSpeed
        );
        
        this.scene.physics.add.overlap(bullet, player, (b, p) => {
            b.destroy();
            p.takeDamage(10);
        });
        
        this.scene.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }
    
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        
        const percent = this.hp / this.maxHp;
        this.healthBar.setSize(50 * percent, 4);

        if (this.scene.effects) {
            this.scene.effects.hitEffect(this.x, this.y, true);
        }
        
        // Визуальный эффект
        this.setTint(0xff8888);
        this.scene.time.delayedCall(100, () => this.setTint(0xff3333));
    }
    
    destroy() {
        this.healthBarBg.destroy();
        this.healthBar.destroy();
        this.weapon.destroy(); 
        super.destroy();
    }
}