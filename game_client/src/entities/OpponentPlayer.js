import { getSkinTextureKey } from '../config/skins.js?v=20260531-skins-v2';

export default class OpponentPlayer extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, nickname, skinSlug) {
      super(scene, x, y, getSkinTextureKey(skinSlug));

      this.scene = scene;
      this.nickname = nickname;
      this.skinSlug = skinSlug;
      this.hp = 100;
      this.maxHp = 100;

      scene.physics.world.enable(this);
      scene.add.existing(this);

      this.setDepth(2);
      this.setScale(1);
      this.body.allowGravity = false;
      this.updateBodyBounds();

      this.weapon = scene.add.image(x, y, 'weapon');
      this.weapon.setScale(1);
      this.weapon.setDepth(2);
      this.setAimRotation(0);
    }

    updateBodyBounds() {
      this.body.setSize(this.width * 0.7, this.height * 0.7);
      this.body.setOffset(this.width * 0.15, this.height * 0.15);
    }

    setSkin(skinSlug) {
      const textureKey = getSkinTextureKey(skinSlug);

      if (this.texture?.key === textureKey) {
        return;
      }

      this.skinSlug = skinSlug;
      this.setTexture(textureKey);
      this.updateBodyBounds();
    }

    setAimRotation(bodyRotation) {
      if (!this.weapon) return;

      const weaponRotation = bodyRotation;
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
      if (data.skinSlug) {
        this.setSkin(data.skinSlug);
      }

      const bodyRotation = this.getClosestRotation(this.rotation, data.rotation);

      this.scene.tweens.add({
        targets: this,
        x: data.x,
        y: data.y,
        rotation: bodyRotation,
        duration: 50,
        ease: 'Linear'
      });

      if (this.weapon) {
        const weaponRotation = this.getClosestRotation(
          this.weapon.rotation,
          data.rotation
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

      if (data.maxHp !== undefined) {
        this.maxHp = data.maxHp;
      }

      if (data.hp !== undefined) {
        this.hp = data.hp;
      }
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.setTint(0xff8888);
      this.scene.time.delayedCall(100, () => this.clearTint());
    }

    setServerHp(hp) {
      this.hp = Math.max(0, Math.min(this.maxHp, hp));
      this.setTint(0xff8888);
      this.scene.time.delayedCall(100, () => this.clearTint());
    }

    destroy() {
      if (this.weapon) this.weapon.destroy();
      super.destroy();
    }
  }
