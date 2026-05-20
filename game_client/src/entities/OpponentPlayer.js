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
      
      // Имя оппонента
      this.nameText = scene.add.text(x, y - 35, nickname, {
        fontSize: '14px',
        fill: '#88ff88',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      // Полоска здоровья
      this.healthBarBg = scene.add.rectangle(x, y - 25, 50, 6, 0x000000, 0.7);
      this.healthBarBg.setOrigin(0.5, 0.5);
      
      this.healthBar = scene.add.rectangle(x, y - 25, 50, 4, 0xff3333, 1);
      this.healthBar.setOrigin(0.5, 0.5);
    }
    
    updateFromServer(data) {
      // Плавное перемещение (интерполяция)
      this.scene.tweens.add({
        targets: this,
        x: data.x,
        y: data.y,
        rotation: data.rotation,
        duration: 50,
        ease: 'Linear'
      });
      
      // Обновление оружия
      if (this.weapon) {
        this.scene.tweens.add({
          targets: this.weapon,
          x: data.x + Math.cos(data.rotation) * 20,
          y: data.y + Math.sin(data.rotation) * 20,
          rotation: data.rotation,
          duration: 50,
          ease: 'Linear'
        });
      }
      
      // Обновление имени и хп-бара
      this.nameText.setPosition(data.x, data.y - 35);
      this.healthBarBg.setPosition(data.x, data.y - 25);
      this.healthBar.setPosition(data.x, data.y - 25);
      
      // Обновление HP
      if (data.hp !== undefined) {
        this.hp = data.hp;
        const percent = this.hp / this.maxHp;
        this.healthBar.setSize(50 * percent, 4);
      }
    }
    
    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      const percent = this.hp / this.maxHp;
      this.healthBar.setSize(50 * percent, 4);
      
      // Визуальный эффект
      this.setTint(0xff8888);
      this.scene.time.delayedCall(100, () => this.setTint(0x33ff33));
    }
    
    destroy() {
      if (this.weapon) this.weapon.destroy();
      if (this.nameText) this.nameText.destroy();
      if (this.healthBarBg) this.healthBarBg.destroy();
      if (this.healthBar) this.healthBar.destroy();
      super.destroy();
    }
  }