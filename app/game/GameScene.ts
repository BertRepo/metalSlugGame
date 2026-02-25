import Phaser from 'phaser';

// 游戏场景类
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private lastFired: number = 0;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private health: number = 100;
  private gameOver: boolean = false;
  private gameOverText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private playerSpeed: number = 200;
  private jumpForce: number = -400;
  private isJumping: boolean = false;
  private enemySpawnTimer!: Phaser.Time.TimerEvent;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // 加载游戏资源
    this.load.image('background', '/game/background.png');
    this.load.image('player', '/game/player.png');
    this.load.image('enemy', '/game/enemy.png');
    this.load.image('bullet', '/game/bullet.png');
  }

  create() {
    // 重置游戏状态
    this.score = 0;
    this.health = 100;
    this.gameOver = false;

    // 创建背景
    const bg = this.add.image(0, 0, 'background');
    bg.setOrigin(0, 0);
    bg.setScale(this.scale.width / bg.width, this.scale.height / bg.height);

    // 创建地面平台
    this.platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 20,
      this.scale.width,
      40,
      0x8B4513
    );
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    // 创建一些平台供跳跃
    const platform1 = this.add.rectangle(200, this.scale.height - 150, 150, 20, 0x654321);
    this.physics.add.existing(platform1, true);
    this.platforms.add(platform1);

    const platform2 = this.add.rectangle(500, this.scale.height - 250, 150, 20, 0x654321);
    this.physics.add.existing(platform2, true);
    this.platforms.add(platform2);

    const platform3 = this.add.rectangle(750, this.scale.height - 180, 150, 20, 0x654321);
    this.physics.add.existing(platform3, true);
    this.platforms.add(platform3);

    // 创建玩家
    this.player = this.physics.add.sprite(100, this.scale.height - 100, 'player');
    this.player.setScale(0.15);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);
    this.player.setSize(this.player.width * 0.5, this.player.height * 0.7);
    this.player.setOffset(this.player.width * 0.25, this.player.height * 0.15);

    // 创建子弹组
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 20,
      runChildUpdate: true
    });

    // 创建敌人组
    this.enemies = this.physics.add.group();

    // 设置键盘控制
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // 碰撞检测
    this.physics.add.collider(this.player, this.platforms, this.onPlayerLand, undefined, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.hitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 创建UI
    this.scoreText = this.add.text(16, 16, '分数: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    this.healthText = this.add.text(16, 50, '生命: 100', {
      fontSize: '24px',
      color: '#ff0000',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(100);

    // 游戏结束文字
    this.gameOverText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      '游戏结束!',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setScrollFactor(0);
    this.gameOverText.setDepth(100);
    this.gameOverText.setVisible(false);

    this.restartText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 20,
      '点击屏幕重新开始',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    this.restartText.setOrigin(0.5);
    this.restartText.setScrollFactor(0);
    this.restartText.setDepth(100);
    this.restartText.setVisible(false);

    // 定时生成敌人
    this.enemySpawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // 添加操作提示
    const controlsText = this.add.text(
      this.scale.width - 16,
      16,
      '操作说明:\n← → 移动\n↑ 跳跃\n空格 射击',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'right'
      }
    );
    controlsText.setOrigin(1, 0);
    controlsText.setScrollFactor(0);
    controlsText.setDepth(100);

    // 点击重新开始
    this.input.on('pointerdown', () => {
      if (this.gameOver) {
        this.scene.restart();
      }
    });
  }

  update(time: number) {
    if (this.gameOver) {
      return;
    }

    // 玩家移动控制
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // 跳跃
    if (this.cursors.up?.isDown && this.player.body?.touching.down) {
      this.player.setVelocityY(this.jumpForce);
      this.isJumping = true;
    }

    // 射击 - 空格键
    if (this.cursors.space?.isDown && time > this.lastFired + 200) {
      this.fireBullet();
      this.lastFired = time;
    }

    // TODO: 暂停功能 - P键
    if (this.cursors.p?.isDown) {
      this.gameOver = true;
      this.gameOverText.setVisible(true);
      this.restartText.setVisible(true);
      this.enemySpawnTimer.remove();
      this.enemies.getChildren().forEach((enemy) => {
        const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
        enemySprite.setVelocityX(0);
      });
    }

    // 更新敌人行为
    this.enemies.getChildren().forEach((enemy) => {
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
      if (enemySprite.active) {
        // 敌人向玩家移动
        const direction = this.player.x < enemySprite.x ? -1 : 1;
        enemySprite.setVelocityX(direction * 80);
        enemySprite.setFlipX(direction < 0);

        // 敌人偶尔跳跃
        if (Math.random() < 0.01 && enemySprite.body?.touching.down) {
          enemySprite.setVelocityY(-300);
        }
      }
    });

    // 清理超出边界的子弹
    this.bullets.getChildren().forEach((bullet) => {
      const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
      if (
        bulletSprite.x < 0 ||
        bulletSprite.x > this.scale.width ||
        bulletSprite.y < 0 ||
        bulletSprite.y > this.scale.height
      ) {
        bulletSprite.setActive(false);
        bulletSprite.setVisible(false);
      }
    });

    // 清理超出边界的敌人
    this.enemies.getChildren().forEach((enemy) => {
      const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
      if (enemySprite.x < -50 || enemySprite.x > this.scale.width + 50) {
        enemySprite.destroy();
      }
    });
  }

  private onPlayerLand() {
    this.isJumping = false;
  }

  private fireBullet() {
    const bullet = this.bullets.get(
      this.player.x + (this.player.flipX ? -30 : 30),
      this.player.y - 10
    );

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setScale(0.05);
      bullet.setAngle(90);

      const velocity = this.player.flipX ? -500 : 500;
      bullet.setVelocityX(velocity);
      bullet.setVelocityY(0);
      bullet.setGravityY(0);
    }
  }

  private spawnEnemy() {
    if (this.gameOver) return;

    const side = Math.random() > 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -30 : this.scale.width + 30;

    const enemy = this.enemies.create(x, this.scale.height - 100, 'enemy');
    enemy.setScale(0.12);
    enemy.setCollideWorldBounds(false);
    enemy.setSize(enemy.width * 0.5, enemy.height * 0.7);
    enemy.setOffset(enemy.width * 0.25, enemy.height * 0.15);

    // 给敌人一个初始速度
    const direction = side === 'left' ? 1 : -1;
    enemy.setVelocityX(direction * 80);
    enemy.setFlipX(direction < 0);
  }

  private hitEnemy(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    // 1. 类型断言：将通用类型转为具体的 Sprite 类型
    // 这样 TypeScript 就能识别 x, y, setVisible, setVelocity 等属性和方法了
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
  
    // 创建爆炸效果 (现在可以访问 x 和 y 了)
    const explosion = this.add.circle(enemySprite.x, enemySprite.y, 20, 0xff6600);
    this.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => explosion.destroy()
    });
  
    // 现在可以调用 setVisible 和 setVelocity 了
    bulletSprite.setActive(false);
    bulletSprite.setVisible(false);
    bulletSprite.setVelocity(0, 0);
    
    enemySprite.destroy();
  
    this.score += 100;
    this.scoreText.setText('分数: ' + this.score);
  }
  

  private playerHitEnemy(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ) {
    if (this.gameOver) return;

    this.health -= 20;
    this.healthText.setText('生命: ' + this.health);

    // 玩家闪烁效果
    (player as Phaser.Physics.Arcade.Sprite).setTint(0xff0000);
    this.time.delayedCall(100, () => {
      (player as Phaser.Physics.Arcade.Sprite).clearTint();
    });

    enemy.destroy();

    if (this.health <= 0) {
      this.endGame();
    }
  }

  private endGame() {
    this.gameOver = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.gameOverText.setVisible(true);
    this.restartText.setVisible(true);

    this.enemySpawnTimer.destroy();
  }
}
