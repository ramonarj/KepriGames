'use strict';

import { ActualizaTop, mayorQue } from '../utils.js';
const TOP_PLAYERS = 3;

//JERARQUÍA DE OBJETOS
import { SoundSource, Par } from './SoundSource.js';
import { HUD, GATES_POSY, DEFAULT_HIGHSCORE } from './HUD.js';
import { Destroyable } from './Destroyable.js';
import { Movable } from './Movable.js';
import { Enemy, CreateEnemyAnimations } from './Enemy.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';

//Todos los Power-ups
import { PowerUp, POWERUP_COLORS, GreenPowerUp, GreyPowerUp, RedPowerUp, BluePowerUp, 
    OrangePowerUp, LightBluePowerUp, PinkPowerUp} from './PowerUp.js';

//CONSTANTES
const NUM_LEVELS = 11;

const NUM_POWERUPS = 7;
const POWERUP_CHANCE = 1/3;

const LEFTLIMIT = 147;
const RIGHTLIMIT = 633;
const FIRST_BRICK_Y = 84;

const BRICK_WIDTH = 44;
const BRICK_HEIGHT = 22;
const SILVER_BRICK = 8;
const GOLDEN_BRICK = 9;
const WHITE_BRICK_POINTS = 50;

const EXTRA_BALLS = 2;
const PLAYER_POSY = 526;
const HUD_POSY = 320;
const GATE1_POSX = 236;
const GATE2_POSX = 477;
const INITIAL_LIVES = 1;

//Variables globales necesarias (nivel, vidas y puntuación actual y máxima)...
var level = 1;
var lives = INITIAL_LIVES;
var score = 0;
var highscore = DEFAULT_HIGHSCORE;
var brickArray = null;

export class PlayScene extends Phaser.Scene
{
  /*
  contructor(){
      super({key: 'PlayScene'});
  }
  */

   //Función Create
  create() 
  {
    //Variables locales (de la escena)
     this.topBrickLimit= null;
     this.cursors=null;
     this.playerWeapon=null;
     this.enemigos= null;
     this.ball=null;
     this.ballsGroup=null;
     this.bricks=null;
     this.walls=null;
     this.powerUps=null;
     this.hud=null;
     this.activePowerUp=null;
     this.fallingPowerUp=null;
     this.player=null;
     this.levelDoor=null;
     this.doorOpen=null;
     this.breakableBricks=null;

     //Audio
     this.ball_dBrick=null;
     this.ball_uBrick=null;
     this.ball_player=null;

     this.enemyDeath=null;

     this.playerDeath=null;
     this.playerShot=null;
     
     this.extraLife=null;
     this.getWide=null;

    // AUDIO
    this.ball_dBrick = this.sound.add('ball&dBrick');
    this.ball_uBrick = this.sound.add('ball&uBrick');
    this.ball_player = this.sound.add('ball&player');

    this.enemyDeath = this.sound.add('enemyDeath');

    this.playerDeath = this.sound.add('playerDeath');
    this.playerShot = this.sound.add('playerShot');

    this.extraLife = this.sound.add('extraLife');
    this.getWide = this.sound.add('getWide');
    this.getWide.play();

    //Añadimos las variables
    //1.Paredes y techo (grupo walls)
    this.walls = this.physics.add.staticGroup();
    var techo = this.add.sprite(80, 0, 'techo').setOrigin(0);

    var pared1 = this.add.sprite(LEFTLIMIT, GATES_POSY, 'pared').setOrigin(0);
    pared1.x-=pared1.width;
    var pared2 = this.add.sprite(RIGHTLIMIT, GATES_POSY, 'pared').setOrigin(0);

    this.walls.add(techo);
    this.walls.add(pared1);
    this.walls.add(pared2);

    setAll(this.walls, 'body.inmovable', true);
    setAll(this.walls, 'visible', false);

    //2.HUD
    let hudPos = new Par(RIGHTLIMIT + 15, HUD_POSY);
    this.hud = new HUD(this, hudPos, 'vidas','e', lives, level);
    this.hud.renderRound(level);
    this.hud.renderScore(score, highscore); //Renders iniciales

    //3.Pelota(s)
    var ballSounds = [this.ball_player, this.ball_dBrick, this.ball_uBrick];
    this.ballsGroup = this.physics.add.group();
    this.ballsGroup.classType = Ball;

    var playerPos = new Par(this.game.config.width / 2, PLAYER_POSY);
    this.ball = new Ball(playerPos, 'ball', ballSounds, 1, this).setOrigin(0);
    this.ball.y -= this.ball.height;
    this.ballsGroup.add(this.ball);

    this.ball.body.velocity.setTo(this.ball._velocity._x, this.ball._velocity._y); //Físicas de la pelota
    this.ball.body.setBounce(1,1); //ESTO SIRVE PARA HACER QUE ACELERE
    this.ball.body.setCollideWorldBounds(true);
    this.add.existing(this.ball);

    //Pelotas extra
    for(var i = 0; i < EXTRA_BALLS; i++)  {
       var extraBall = new Ball(playerPos, 'ball', ballSounds, 1, this);
        this.ballsGroup.add(extraBall);
        extraBall.destroy();
    }

    //4.Ladrillos (grupo bricks)
    var actualBrick = 0;
    this.bricks = this.physics.add.staticGroup();
    this.bricks.classType = Destroyable;
    this.breakableBricks = 0;

    this.anims.create({
        key: 'gold-shine',
        frames: this.anims.generateFrameNumbers('ladrillosEsp', { start: 6, end: 11 }),
        frameRate: 10
    });
    this.anims.create({
        key: 'silver-shine',
        frames: this.anims.generateFrameNumbers('ladrillosEsp', { start: 0, end: 5 }),
        frameRate: 10
    });

    // Creación del nivel
    var JSONfile = JSON.parse(this.cache.text.get('levels'));

    var i, j;
    i = j = 0;
    JSONfile.levels[level].forEach(function(element)
    {
      j = 0;
      element.forEach(function(brickType)
      {
        let brick;
        let pos = new Par(LEFTLIMIT + (j*BRICK_WIDTH), FIRST_BRICK_Y + (i*BRICK_HEIGHT));

        if(brickType != 0)
        {
          //Ladrillos dorados
          if(brickType == GOLDEN_BRICK)
          {
            brick = new SoundSource(this.game, pos, 'ladrillosEsp', 'sound').setOrigin(0);
            brick.setFrame(6);
            this.add.existing(brick);
          } 

          else
          {    
            //Ladrillos plateados
            if(brickType == SILVER_BRICK)
            {
              brick = new Destroyable(this, pos, 'ladrillosEsp', 'sound', 3, WHITE_BRICK_POINTS * level).setOrigin(0);
              brick.setFrame(0);
              this.add.existing(brick);
            }
              
            //Ladrillos de colores
            else
            {
              brick = new Destroyable(this, pos, 'ladrillos', 'sound', 1, WHITE_BRICK_POINTS + brickType * 10).setOrigin(0);
              brick.setFrame(brickType);
              this.add.existing(brick);
            } 

            //Si lo tenemos que matar, lo matamos. Si no, aumentamos el número de ladrillos rompibles
            //if(brickArray !== null)
            //  console.log(brickArray);
            if(brickArray !== null && brickArray[actualBrick] === false) {
              //console.log(brickArray);
              brick.destroy();
            }
            else
              this.breakableBricks++;
          }   
         //Lo añadimos al grupo
          this.bricks.add(brick);
          actualBrick++;
        }
        j++;
      }, this)
      i++;
    }, this)
    setAll(this.bricks, 'body.immovable', true);

    //5. Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard.on('keydown', onKeyDown, this);

    //6.Balas
    this.playerWeapon = new Movable(this, playerPos, 'bullet', 'sound',3, playerVel);
    /*
    this.playerWeapon = this.add.weapon(8, 'bullet'); // TODO: ya no hay weapons en Bullet 3
    this.playerWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    this.playerWeapon.bullets.forEach((b) => {
        b.body.updateBounds();
    }, this);
    this.playerWeapon.bulletAngleOffset = 90; //Ángulo
    this.playerWeapon.bulletSpeed = 600; //Velocidad
    this.playerWeapon.fireRate = 500; //FireRate
    */

    //7.Jugador
    let playerSounds = [this.playerShot, this.getWide, this.extraLife];
    var playerVel = new Par(1,0);
    this.player = new Player(this, playerPos, 'player', playerSounds, 1, playerVel, this.cursors, 
                                               this.playerWeapon, LEFTLIMIT, RIGHTLIMIT, this.ballsGroup, this, false);
    // Añadirlo a la escena y a la simulación
    this.add.existing(this.player);
    this.physics.add.existing(this.player); // hay que añadirle rigidbody

    this.player.body.immovable = true;
    this.ball.attach(this.player); //La pegamos al jugador

    //8.PowerUps
    this.powerUps = this.physics.add.group();
    this.powerUps.classType = PowerUp;
    this.fallingPowerUp = null;
    this.activePowerUp = null;
    for(let i = 0; i < 7; i++){
        this.anims.create({
          key: 'rotate-' + POWERUP_COLORS[i],
          frames: this.anims.generateFrameNumbers('PowerUps', { start: i * 6, end: i * 6 + 5 }), // 7 animaciones, una por color
          frameRate: 6, // 6fps y en bucle
          repeat: -1
      });
    }
    //this.anims.add('rotate', [frame, frame+1, frame+2, frame+3, frame+4, frame+5]);
    // Comienza la animación: a 6 fps, y 'true' para repetirla en bucle
    //this.anims.play('rotate', 10, true); // TODO

    //9.Compuertas
    var gate1 = this.add.sprite(GATE1_POSX, GATES_POSY, 'compuertas').setOrigin(0);
    var gate2 = this.add.sprite(GATE2_POSX, GATES_POSY, 'compuertas').setOrigin(0);
    this.anims.create({
        key: 'open',
        frames: this.anims.generateFrameNumbers('compuertas', { start: 0, end: 2 }),
        frameRate: 9
    });

    // 10.Puerta al siguiente nivel
    this.levelDoor = this.add.sprite(RIGHTLIMIT + 10, PLAYER_POSY + 1, 'door');
    this.levelDoor.setOrigin(0.5,0.5);
    this.levelDoor.visible = false;
    this.doorOpen = false;
    this.physics.add.existing(this.levelDoor);

    //11.Enemigos
    this.enemigos = this.physics.add.group();
    this.enemigos.classType = Enemy;
    // Animaciones
    CreateEnemyAnimations(level, this);

    let enemyPos = new Par(gate1.x + gate1.width/2, gate1.y);
    var enem1 = new Enemy(this, enemyPos, 'enemigos', this.enemyDeath, 1, this.walls, this.bricks, 
                          this.enemigos, gate1, this.player.y, level).setOrigin(0.5);
    this.enemigos.add(enem1);
    this.add.existing(enem1);

    let enemyPos2 = new Par(gate2.x + gate2.width/2, gate2.y); 
    var enem2 = new Enemy(this, enemyPos2, 'enemigos', this.enemyDeath, 1, this.walls, this.bricks, 
                          this.enemigos, gate2, this.player.y, level).setOrigin(0.5);
    this.enemigos.add(enem2);
    this.add.existing(enem2);

    setAll(this.enemigos, 'body.inmovable', true);

    //12. Configurar las colisiones entre los distintos grupos
    // Jugador
    this.physics.add.collider(this.player, this.levelDoor, this.advanceLevel, null, this);
    this.physics.add.collider(this.player, this.ballsGroup, this.ballCollisions, null, this);
    this.physics.add.collider(this.player, this.powerUps, this.takePowerUp, null, this); 
    this.physics.add.collider(this.player, this.enemigos, this.playerCollisions, null, this);
    // Pelota(s)
    this.physics.add.collider(this.walls, this.ballsGroup, this.ballCollisions, null, this);
    this.physics.add.collider(this.bricks, this.ballsGroup, this.ballCollisions, null, this);
    this.physics.add.collider(this.enemigos, this.ballsGroup, this.ballCollisions, null, this);

    this.hack = {
      nextLevel: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    };
  }

  //FUNCIÓN UPDATE
  update(time, delta)
  {
    // Esto debería llamarse solo ¿?
    this.player.update(delta);
    this.ball.update();
    // Powerups
    if(this.powerUps.children !== undefined){
        this.powerUps.children.each(function(elem) {
          elem.update(delta);
      }, this);
    }
    // Enemigos
    if(this.enemigos.children !== undefined){
        this.enemigos.children.each(function(elem) {
          elem.update();
      }, this);
    }

    if(this.hack.nextLevel.isDown){
            this.nextLevel();
      console.log("Down");
    }

    // TODO
    // Para detectar solapamientos sin que las entidades reboten entre sí, se usa 'overlap'

    /*
    //Colisiones de la bala
    this.physics.arcade.overlap(this.playerWeapon.bullets, this.walls, this.bulletCollisions, null, this);
    this.physics.arcade.overlap(this.playerWeapon.bullets, this.bricks, this.bulletCollisions, null, this);
    this.physics.arcade.overlap(this.playerWeapon.bullets, this.enemigos, this.bulletCollisions, null, this);
    */
  }

//----------------------------Victoria/Derrota--------------------------//
  // Victoria (se llama desde 'takeDamage()' de Destroyable)
  checkWin()
  {
    //Ganaste

    if(this.breakableBricks < 1)
      this.nextLevel();
  }

  // Derrota (se llama desde 'takeDamage()' de Ball)
  checkGameOver()
  {
    if(this.ballsGroup.getChildren().length === 0)
    {
      lives--;
      this.hud.takeLife();
      this.playerDeath.play();

      //Perdiste del todo
      //Restablecemos todos los valores a su valor inicial y volvemos al menú
      if(lives < 0)
      {
        if(score > highscore)
           highscore = score;

        ActualizaTop(score, TOP_PLAYERS, 'arkanoid', mayorQue);

        brickArray = null;
        this.scene.manager.stop('1player');
        this.exitGame();
      }
       
      //Solo perdiste una vida
      else
      {
        brickArray = [];
        //console.log(this.bricks.children.size);
        //Guardamos qué ladrillo quedan vivos
        this.bricks.children.each(function(elem){
          //console.log(elem);
        }, this);

        /*
        for(let i=0; i < this.bricks.children.size; i++)
        {
          console.log(this.bricks.children[i]);
          if(this.bricks.children[i].alive)
              brickArray[i] = true;
          else
              brickArray[i] = false;
        }
              */

       this.scene.manager.stop('1player');
       this.scene.manager.getScene('carga')._2player = false;
       this.scene.manager.getScene('carga')._scene = this;
       this.scene.manager.start('carga', true, false);
      }      
    }  
  }

  //-------------------------Callbacks para colisiones-------------------------//

  // Colisones con las balas
  bulletCollisions(bullet, obj)
  {
    //Si es un destruible, le quita vida
    if(obj.hasOwnProperty('_lives'))
        obj.takeDamage(this);

    bullet.destroy(); //Destruimos la bala
  }

  // Colisiones con la pelota
  ballCollisions(obj, ball)
  {
      //La pelota rebota en ese algo (siempre que no esté parada)
      if(!ball.isAttached())
         ball.bounce(obj, this);
  }

  // Colisones con el jugador
  playerCollisions(player, obj)
  {
     /* //Power-ups
      if(obj.hasOwnProperty('_powerUpNum'))
          this.takePowerUp(player, obj); // Ya que ahora no haría falta el _powerUpNum, y cuando colisiona con 'powerUps' llama directamente a 'takePowerUp()'
      //Enemigos    
      if (obj.constructor === Enemy)*/
      if(obj.active)
        obj.takeDamage(this, player);
  }

  // Colisiones con la puerta al siguiente nivel
  advanceLevel(player, door)
   {
     if(this.doorOpen)
       this.nextLevel();
   }
  
//--------------------------------------Power-Ups------------------------------------//

  // Suelta un Power-Up según una probabilidad
  dropPowerUp(brick, player)
  {
  if(this.activePowerUp != null && this.activePowerUp.constructor === LightBluePowerUp && this.ballsGroup.children.size <= 1)
    this.activePowerUp.disable();

  if(this.fallingPowerUp == null || this.fallingPowerUp.dropEnabled())
    {
      // 1) Obtenemos un número aleatorio del 0 (incluido) al 1 -> [0, 1)
      var num = Math.random();
      var drop = false;
      // 2) Según la constante de probabilidad, comprobamos si se va a soltar o no un Power-Up  
      // Ej: Si es 1/2, habrá drop mientras num < 0'5. Es decir, un 50% de probabilidades como bien se expone. Si es 1/4, mientras num < 0'25. Es decir, 25%
      if(num < POWERUP_CHANCE)
      drop = true;

      // 3) En caso de soltarlo:
      if(drop)
      {  // Math.floor(Math.random() * (max - min)) + min -> fórmula para obtener un valor concreto entre el rango [min, max)
        
          // a) Obtenemos un Power-Up de entre los que hay en total (en este caso, nuestro mínimo es "0", y por tanto no lo ponemos en la fórmula)
        num = Math.floor(Math.random() * (NUM_POWERUPS));
      
          // b) Lo creamos en la posición del ladrillo que se destruyó
        this.createPowerUp(brick, num);
      }
    } 
  }

  // Crea un Power-Up
  createPowerUp(brick, nPowerUp)
  {
      // 1) Obtenemos la posición del ladrillo que va a dropear el Power-Up
    var powerUp;
    var brickPosition = new Par(brick.x, brick.y)
      // 2) Creamos el Power-Up según el valor obtenido aleatoriamente 
      let vel = new Par(0,60);
    switch (nPowerUp)
    {
        case 0:
          powerUp = new RedPowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, true, false, this.player).setOrigin(0);
          break;
        case 1:
          powerUp = new GreyPowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, false, false, this.player).setOrigin(0);
          break;
        case 2: 
          powerUp = new BluePowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, true, false, this.player).setOrigin(0);
          break;
        case 3:
          powerUp = new GreenPowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, true, false, this.ballsGroup).setOrigin(0);
          break;
        case 4:
          powerUp = new OrangePowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, true, false, this.ballsGroup).setOrigin(0);
          break;
        case 5:
          powerUp = new LightBluePowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, true, false, this.ballsGroup).setOrigin(0);
          break;
        case 6:
          powerUp = new PinkPowerUp(this, brickPosition ,'PowerUps', 'noSound', 1, vel, false, false, this).setOrigin(0);
          break;
    }
    this.add.existing(powerUp);
    
    // 3) Lo añadimos al grupo de Power-Ups, activamos las colisiones con el jugador, etc.
    this.powerUps.add(powerUp);

    powerUp.body.immovable = true;
    powerUp.body.velocity.setTo(0, 2); //Físicas de la pelota

    this.fallingPowerUp = powerUp;
  }
 
  // Recoge un Power-Up y determina su función
  takePowerUp(player, powerUp)
  {
    // 1) Comprobamos si el Power-Up recogido tiene un efecto activo. Es decir, que se mantenga o bien desactive otros efectos activos
    /* Ej: El disparo es un Power-Up con efecto activo, decelerar la pelota no tiene efecto activo como tal, pero sí desactiva el resto,
        y ganar vida no hace ninguna de las anteriores */
    if (powerUp.isEffect())
    {
        // a) Desactivamos el efecto activo anterior, si es que lo hubiera (1ª comprobación) y si no es el mismo efecto que ya está activo (2ª comprobación)
        if(this.activePowerUp != null && powerUp.constructor != this.activePowerUp.constructor)
          this.activePowerUp.disable(player);


        // b) Una vez desactivado el anterior, ponemos éste como nuevo efecto activo
        this.activePowerUp = powerUp;
    }
    // 2) Activamos el Power-Up recogido como tal, y destruimos el objeto
    powerUp.enable(player);
    powerUp.takeDamage(this);
  }

   //-------------------------------Otros métodos-------------------------//

   openDoor()
   {
     this.doorOpen = true;
     this.levelDoor.visible = true;

     this.levelDoor.anims.play('open', true);
   }

   //Otros métodos
   addScore(i)
   {
     score+=i;
     this.hud.renderScore(score, highscore);
   }

   addLife()
   {
     lives++;
     this.hud.addLife();
   }

   getLevel() {
     return level;
   }

   getScore(i)
   {
    if(i==0)
       return score;
    else
      return highscore;
   }

   nextLevel()
   {
     brickArray = null;
     //Pasamos de nivel
     if(level < NUM_LEVELS)
     {
       level++;
       this.scene.manager.getScene('carga')._2player = false;
       this.scene.manager.getScene('carga')._scene = this;
       this.scene.manager.start('carga', true, false);
     }
     //Nos hemos pasado el juego
     else
     {
      this.exitGame();
     }
   }

   // Reinicia nivel, vidas, y puntuación y vuelve al menú
   exitGame()
   {
    level = 1;
    lives = INITIAL_LIVES;
    score = 0;
    this.scene.manager.start('menu');
   }
}

/* Función que existía en Phaser 2 pero ya no; hacemos una alternativa */
function setAll(grupo, nombreProp, valor){
    grupo.children.each(function(element) {
      element[nombreProp] = valor;
      //console.log(element[nombreProp]);
    }, this);
}

//-------------------------Callbacks---------------------//
function onKeyDown(event){
    if(event.key === "Enter"){
      console.log("Enter");
    }
    else if(event.key === "Escape"){
      // TODO comprobar que funciona
      console.log("Escape-> Exit Game");
      PlayScene.exitGame.apply(this);
    }
}