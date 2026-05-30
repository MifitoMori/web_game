// game_client/src/entities/OpponentPlayer.js
export default class OpponentPlayer extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, nickname) {
      super(scene, x, y, 'player');
      
      this.scene = scene;
      this.nickname = nickname;
      this.hp = 100;
      this.maxHp = 100;
      
      scene.physics.world.enable(this);
      scene.add.existing(this);
      
      this.setDepth(2);
      this.setScale(1);
      this.setTint(0x33ff33); // Зеленый оттенок для отличия
      this.body.allowGravity = false;
      
      this.body.setSize(this.width * 0.7, this.height * 0.7);
      this.body.setOffset(this.width * 0.15, this.height * 0.15);
      
      // Оружие оппонента
      this.weapon = scene.add.image(x, y, 'weapon');
      this.weapon.setScale(1);
      this.weapon.setTint(0x88ff88);
      this.weapon.setDepth(2);
      this.setAimRotation(0);
      
      // Имя оппонента
      // Полоска здоровья
    }

    setAimRotation(bodyRotation) {
      if (!this.weapon) return;

      const weaponRotation = bodyRotation + 1.6;
      this.weapon.setPosition(
        this.x + Math.cos(weaponRotation) * 20,
        this.y + Math.sin(weaponRotation) * 20
      );
      this.weapon.rotation = weaponRotation;
    }

    getClosestRotation(currentRotation, targetRotation) {
      const diff = Math.atan2(
        Math.sin(targetRotation - currentRotation),
        Math.cos(targetRotation - currentRotation)
      );

      return currentRotation + diff;
    }
    
    updateFromServer(data) {
      const bodyRotation = this.getClosestRotation(this.rotation, data.rotation);

      // Плавное перемещение (интерполяция)
      this.scene.tweens.add({
        targets: this,
        x: data.x,
        y: data.y,
        rotation: bodyRotation,
        duration: 50,
        ease: 'Linear'
      });
      
      // Обновление оружия
      if (this.weapon) {
        const weaponRotation = this.getClosestRotation(
          this.weapon.rotation,
          data.rotation + 1.6
        );

        this.scene.tweens.add({
          targets: this.weapon,
          x: data.x + Math.cos(weaponRotation) * 20,
          y: data.y + Math.sin(weaponRotation) * 20,
          rotation: weaponRotation,
          duration: 50,
          ease: 'Linear'
        });
      }
      
      // Обновление имени и хп-бара
      // Обновление HP
      if (data.maxHp !== undefined) {
        this.maxHp = data.maxHp;
      }

      if (data.hp !== undefined) {
        this.hp = data.hp;
      }
    }
    
    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      // Визуальный эффект
      this.setTint(0xff8888);
      this.scene.time.delayedCall(100, () => this.setTint(0x33ff33));
    }

    setServerHp(hp) {
      this.hp = Math.max(0, Math.min(this.maxHp, hp));
      this.setTint(0xff8888);
      this.scene.time.delayedCall(100, () => this.setTint(0x33ff33));
    }
    
    destroy() {
      if (this.weapon) this.weapon.destroy();
      super.destroy();
    }
  }
