export default class Player extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        this.scene = scene;
        this.speed = 2;
        this.hp = 100;
        this.maxHp = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.reserveAmmo = 30;
        this.maxReserveAmmo = 30;
        this.isReloading = false;
        this.reloadDelay = 2000;

        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashCooldownMax = 3000; 
        this.dashDistance = 150; 
        this.dashDuration = 150; 
        this.dashInvincible = true; 
        
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        this.setDepth(2);
        this.setScale(1);
        this.body.allowGravity = false;
        
        this.body.setSize(this.width * 0.7, this.height * 0.7);
        this.body.setOffset(this.width * 0.15, this.height * 0.15);
        
        this.weapon = scene.add.image(x, y, 'weapon');
        this.weapon.setScale(1);
        this.weapon.setDepth(2);
        
        this.setupReloadIndicator();
        this.setupDashIndicator();
    }
    
    setupReloadIndicator() {
        this.reloadBarBg = this.scene.add.rectangle(this.x, this.y - 42, 40, 4, 0x333333, 0.7);
        this.reloadBarBg.setOrigin(0.5, 0.5);
        this.reloadBarBg.setVisible(false);
        
        this.reloadBar = this.scene.add.rectangle(this.x, this.y - 42, 40, 3, 0xffaa00, 1);
        this.reloadBar.setOrigin(0.5, 0.5);
        this.reloadBar.setVisible(false);
    }

    setupDashIndicator() {
        this.dashIndicatorBg = this.scene.add.rectangle(this.x, this.y - 40, 40, 4, 0x333333, 0.7);
        this.dashIndicatorBg.setOrigin(0.5, 0.5);
        
        this.dashIndicator = this.scene.add.rectangle(this.x, this.y - 40, 40, 3, 0x33aaff, 1);
        this.dashIndicator.setOrigin(0.5, 0.5);
    }

    dash(directionX, directionY) {
        if (this.isDashing) return;
        if (this.dashCooldown > 0) return;
        
        let dashDirX = directionX;
        let dashDirY = directionY;
        
        if (dashDirX === 0 && dashDirY === 0) {
            const angle = this.rotation + 1.6;
            dashDirX = Math.cos(angle);
            dashDirY = Math.sin(angle);
        } else {
            const length = Math.hypot(dashDirX, dashDirY);
            dashDirX /= length;
            dashDirY /= length;
        }
        
        this.isDashing = true;
        
        this.scene.effects.dashEffect(this.x, this.y, dashDirX, dashDirY);
        this.scene.cameras.main.shake(100, 0.005);
        
        const newX = this.x + dashDirX * this.dashDistance;
        const newY = this.y + dashDirY * this.dashDistance;
        
        const bounds = this.scene.physics.world.bounds;
        this.x = Phaser.Math.Clamp(newX, bounds.x + this.width/2, bounds.x + bounds.width - this.width/2);
        this.y = Phaser.Math.Clamp(newY, bounds.y + this.height/2, bounds.y + bounds.height - this.height/2);
        
        this.setTint(0xffffff);
        this.scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: this.dashDuration / 2,
            yoyo: true,
            onComplete: () => {
                this.clearTint();
                this.setAlpha(1);
            }
        });
        
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.dashCooldown = this.dashCooldownMax;
            this.scene.effects.dashEndEffect(this.x, this.y);
        });
    }
    
    update(cursors, wasd, mousePressed, pointer) {        
        // Обновление кулдауна дэша
        if (this.dashCooldown > 0) {
            this.dashCooldown -= 16;
            if (this.dashCooldown < 0) this.dashCooldown = 0;
            
            const percent = 1 - (this.dashCooldown / this.dashCooldownMax);
            this.dashIndicator.setSize(40 * percent, 3);
            
            this.dashIndicator.setFillStyle(0x33aaff);
        } else {
            this.dashIndicator.setSize(40, 3);
            this.dashIndicator.setFillStyle(0x33aaff);
        }
        
        if (this.dashIndicatorBg) {
            this.dashIndicatorBg.x = this.x;
            this.dashIndicatorBg.y = this.y - 40;
            this.dashIndicator.x = this.x;
            this.dashIndicator.y = this.y - 40;
        }
        
        if (this.reloadBarBg) {
            this.reloadBarBg.x = this.x;
            this.reloadBarBg.y = this.y - 44;
            this.reloadBar.x = this.x;
            this.reloadBar.y = this.y - 44;
        }
        
        if (this.isDashing) {
            const angleToPointer = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
            this.weapon.x = this.x + Math.cos(angleToPointer) * 20;
            this.weapon.y = this.y + Math.sin(angleToPointer) * 20;
            this.weapon.rotation = angleToPointer;
            this.rotation = angleToPointer - 1.6;
            return;
        }
        
        let moveX = 0, moveY = 0;
        if (cursors.left.isDown || wasd.left.isDown) moveX = -1;
        if (cursors.right.isDown || wasd.right.isDown) moveX = 1;
        if (cursors.up.isDown || wasd.up.isDown) moveY = -1;
        if (cursors.down.isDown || wasd.down.isDown) moveY = 1;
        
        if (moveX !== 0 || moveY !== 0) {
            const angle = Math.atan2(moveY, moveX);
            this.body.setVelocity(
                Math.cos(angle) * this.speed * 100,
                Math.sin(angle) * this.speed * 100
            );
        } else {
            this.body.setVelocity(0, 0);
        }
        
        const angleToPointer = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
        this.weapon.x = this.x + Math.cos(angleToPointer) * 20;
        this.weapon.y = this.y + Math.sin(angleToPointer) * 20;
        this.weapon.rotation = angleToPointer;
        this.rotation = angleToPointer - 1.6;
    }
    
    shoot(pointer, bulletsGroup) {
        if (this.ammo <= 0 || this.isReloading) return;
        
        this.ammo--;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y);
        const offsetX = Math.cos(angle) * 5;
        const offsetY = Math.sin(angle) * 5;
        const spawnX = this.x + Math.cos(angle) * 5;
        const spawnY = this.y + Math.sin(angle) * 5;

        if (this.scene.effects) {
            this.scene.effects.muzzleFlash(this.weapon.x, this.weapon.y, angle);
        }

        const collides = this.scene.physics.overlapRect(spawnX, spawnY, 1, 1)
            .some(hit => hit.gameObject === this.scene.wallSegments);
            
        if (collides) return;
    
        const bullet = bulletsGroup.create(this.x + offsetX, this.y + offsetY, 'bullet');
        bullet.owner = 'player'
        bullet.setScale(1); 
        bullet.body.allowGravity = false;
        bullet.rotation = angle + 1.6;
        
        const bulletSpeed = 400;
        bullet.body.setVelocity(
            Math.cos(angle) * bulletSpeed,
            Math.sin(angle) * bulletSpeed
        );

        if (Math.abs(angle) < 0.9) bullet.body.setSize(15, 7, true);
        else if(Math.abs(angle) < 2.3) bullet.body.setSize(7, 15, true);
        else if(Math.abs(angle) < 3.14) bullet.body.setSize(15, 7, true);
        
        this.scene.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    createConfirmedShot(bulletData, bulletsGroup, ammo, reserveAmmo) {
        if (typeof ammo === 'number') {
            this.ammo = ammo;
        }

        if (typeof reserveAmmo === 'number') {
            this.reserveAmmo = reserveAmmo;
        }

        const angle = bulletData.angle;
        const spawnX = bulletData.x;
        const spawnY = bulletData.y;

        if (this.scene.effects) {
            this.scene.effects.muzzleFlash(this.weapon.x, this.weapon.y, angle);
        }

        const collides = this.scene.physics.overlapRect(spawnX, spawnY, 1, 1)
            .some(hit => hit.gameObject === this.scene.wallSegments);

        if (collides) return;

        const bullet = bulletsGroup.create(spawnX, spawnY, 'bullet');
        bullet.owner = 'player';
        bullet.setScale(1);
        bullet.body.allowGravity = false;
        bullet.rotation = angle + 1.6;

        const bulletSpeed = 400;
        bullet.body.setVelocity(
            Math.cos(angle) * bulletSpeed,
            Math.sin(angle) * bulletSpeed
        );

        if (Math.abs(angle) < 0.9) bullet.body.setSize(15, 7, true);
        else if(Math.abs(angle) < 2.3) bullet.body.setSize(7, 15, true);
        else if(Math.abs(angle) < 3.14) bullet.body.setSize(15, 7, true);

        this.scene.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }
    
    reload(onComplete) {
        if (this.isReloading || this.ammo === this.maxAmmo || this.reserveAmmo <= 0) return;
        
        this.isReloading = true;
        this.reloadBarBg.setVisible(true);
        this.reloadBar.setVisible(true);
        
        this.reloadBar.setSize(0, 3);
        
        const startTime = this.scene.time.now;
        
        const updateBar = () => {
            if (!this.isReloading) return;
            const elapsed = this.scene.time.now - startTime;
            const progress = Math.min(1, elapsed / this.reloadDelay);
            
            this.reloadBar.setSize(40 * progress, 3);
            
            if (progress < 1) {
                this.scene.time.delayedCall(16, updateBar);
            }
        };
        updateBar();
        
        this.scene.time.delayedCall(this.reloadDelay, () => {
            const neededAmmo = this.maxAmmo - this.ammo;
            const loadedAmmo = Math.min(neededAmmo, this.reserveAmmo);

            this.ammo += loadedAmmo;
            this.reserveAmmo -= loadedAmmo;
            this.isReloading = false;
            this.reloadBarBg.setVisible(false);
            this.reloadBar.setVisible(false);
            onComplete?.();
        });
    }
    
    takeDamage(amount) {
        if (this.isDashing && this.dashInvincible) return;
        
        this.hp = Math.max(0, this.hp - amount);

        if (this.scene.effects) {
            this.scene.effects.bloodEffect(this.x, this.y);
        }
        
        this.setTint(0xff3333);
        this.scene.time.delayedCall(100, () => this.clearTint());
    }

    setServerHp(hp) {
        this.hp = Math.max(0, Math.min(this.maxHp, hp));

        if (this.scene.effects) {
            this.scene.effects.bloodEffect(this.x, this.y);
        }

        this.setTint(0xff3333);
        this.scene.time.delayedCall(100, () => this.clearTint());
    }
    
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        
        this.setTint(0x33ff33);
        this.scene.time.delayedCall(200, () => this.clearTint());
    }
    
    addAmmo(amount) {
        this.reserveAmmo = Math.min(this.maxReserveAmmo, this.reserveAmmo + amount);
    }
}
