export default class AmmoPack extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, group, options = {}) {
        super(scene, x, y, 'ammoPack');
        
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        this.setDepth(1);
        this.setScale(0.8); // Нормальный размер (не уменьшенный)
        this.body.allowGravity = false;
        this.body.setSize(30, 30); // Явно задаем размер хитбокса
        
        // Добавление в группу
        group.add(this);
        
        // Анимация парения
        scene.tweens.add({
            targets: this,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        // Автоуничтожение через 15 секунд
        if (options.autoDestroy !== false) {
            scene.time.delayedCall(30000, () => {
                if (this.active) this.destroy();
            });
        }
    }
}
