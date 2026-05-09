export default class Effects {
    constructor(scene) {
        this.scene = scene;
    }

    // Эффект дэша (следы)
    dashEffect(x, y, dirX, dirY) {
        // Создаем полосу движения
        for (let i = 0; i < 15; i++) {
            const offset = i * 8;
            const particle = this.scene.add.circle(
                x - dirX * offset, 
                y - dirY * offset, 
                4, 
                0x33aaff, 
                0.6 - i * 0.04
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }
        
        // Круговая вспышка
        const ring = this.scene.add.circle(x, y, 10, 0x33aaff, 0.8);
        this.scene.tweens.add({
            targets: ring,
            scale: 3,
            alpha: 0,
            duration: 200,
            onComplete: () => ring.destroy()
        });
        
        // Добавляем искры
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spark = this.scene.add.circle(x, y, 2, 0x88ddff, 0.9);
            
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
    }

    // Эффект завершения дэша
    dashEndEffect(x, y) {
        // Ударная волна
        const shockwave = this.scene.add.circle(x, y, 5, 0xaaffff, 0.7);
        this.scene.tweens.add({
            targets: shockwave,
            scale: 4,
            alpha: 0,
            duration: 250,
            onComplete: () => shockwave.destroy()
        });
        
        // Частицы
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const particle = this.scene.add.circle(x, y, 3, 0x66ccff, 0.8);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // Вспышка выстрела
    muzzleFlash(x, y, angle) {
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffaa00, 8);
        
        // Рисуем вспышку в виде луча
        const length = 13;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        flash.beginPath();
        flash.moveTo(x, y);
        flash.lineTo(endX, endY);
        flash.lineWidth = 20;
        flash.strokePath();
        
        // Добавляем свечение
        const glow = this.scene.add.circle(x + Math.cos(angle) * length, y + Math.sin(angle) * length, 7, 0xffaa00, 0.5);
        
        // Анимация исчезновения
        this.scene.tweens.add({
            targets: [flash, glow],
            alpha: 0,
            duration: 100,
            onComplete: () => {
                flash.destroy();
                glow.destroy();
            }
        });
    }
    
    // Взрыв/попадание пули
    hitEffect(x, y, isEnemy = true) {
        const color = isEnemy ? 0xff3333 : 0xffaa00;
        
        // Создаем несколько частиц
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(x, y, 3, color, 0.8);
            
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 100;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
        
        // Добавляем вспышку
        const flash = this.scene.add.circle(x, y, 10, color, 0.8);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }
    
    // Кровавый эффект при попадании в игрока
    bloodEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            const particle = this.scene.add.circle(x, y, 2, 0xff0000, 0.8);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // Дым от пули при пролете
    bulletTrail(x, y) {
        const smoke = this.scene.add.circle(x, y, 2, 0xcccccc, 0.5);
        this.scene.tweens.add({
            targets: smoke,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => smoke.destroy()
        });
    }
    
    // Эффект поднятия предмета
    pickupEffect(x, y, type) {
        const color = type === 'health' ? 0x33ff33 : 0xffaa00;
        const text = type === 'health' ? '+20 HP' : '+10 AMMO';
        
        // Парящий текст
        const floatingText = this.scene.add.text(x, y - 20, text, {
            fontSize: '16px',
            fill: color === 0x33ff33 ? '#33ff33' : '#ffaa00',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        });
        
        this.scene.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatingText.destroy()
        });
        
        // Вспышка
        const flash = this.scene.add.circle(x, y, 15, color, 0.6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }
}