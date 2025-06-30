import { Menu } from './Menu.js';
import { Carga } from './Carga.js';
import { PlayScene } from './1player.js';

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

var BootScene = 
{
  preload: function ()
   {
    
  },

  create: function () 
  {
    this.game.scene.start('preloader');
  }
};


var PreloaderScene = 
{
  preload: function () 
  {
    this.load.crossOrigin = 'anonymous';
    // 1) Cargar recursos compartidos
    //Música
    this.load.audio('remix', '../../_shared/audio/song.mp3');
    //Fuentes
    this.load.bitmapFont('whiteFont', '../../_shared/fonts/white.png', '../../_shared/fonts/white.fnt');
    this.load.bitmapFont('redFont', '../../_shared/fonts/red.png', '../../_shared/fonts/red.fnt');

    // 2) Cargar recursos específicos de este juego
    this.load.baseURL = "arkanoid/assets/";

    // Sprites 
    this.load.image('fondo', './arkanoid-thumb.png');
    this.load.image('ball', 'images/Pelota.png');
    this.load.image('pared', 'images/pared.png');
    this.load.image('techo', 'images/techo.png');
    this.load.image('bullet', 'images/bullet_pair.png');
    this.load.image('vidas', 'images/Vidas.png');
    this.load.image('menu', 'images/Menu.png');
    this.load.image('cursor', 'images/Cursor.png');
    this.load.image('black', 'images/Negro.png');
    
    
    // Spritesheets: 'key', 'ruta', 'ancho de cada frame (en px)', 'alto de cada frame (en px)', 'nº de frames' (opcional)
    this.load.spritesheet('PowerUps', 'images/PowerUps.png', { frameWidth: 40, frameHeight: 18 }); //42 frames
    this.load.spritesheet('ladrillos', 'images/Ladrillos.png', { frameWidth: 44, frameHeight: 22 }); //Ladrillos
    this.load.spritesheet('ladrillosEsp', 'images/LadrillosEspeciales.png', { frameWidth: 44, frameHeight: 22 }); //Ladrillos
    this.load.spritesheet('enemigos', 'images/Enemigos.png', { frameWidth: 31, frameHeight: 37 }); //Enemigos
    this.load.spritesheet('compuertas', 'images/Compuertas.png', { frameWidth: 68, frameHeight: 20 }); //Compuertas
    this.load.spritesheet('fondos', 'images/Fondos.png', { frameWidth: 530, frameHeight: 580 }); //Fondos
    this.load.spritesheet('player', 'images/Player.png', { frameWidth: 80, frameHeight: 20 }); //Jugador
    this.load.spritesheet('door', 'images/Puerta.png', { frameWidth: 23, frameHeight: 69 }); //Puerta

    // Sonidos
    this.load.audio('ball&dBrick', 'audio/collision_ball_dBrick.wav');
    this.load.audio('ball&uBrick', 'audio/collision_ball_uBrick.mp3');
    this.load.audio('ball&player', 'audio/collision_ball_player.mp3');

    this.load.audio('enemyDeath', 'audio/enemy_death.wav');
    this.load.audio('playerDeath', 'audio/player_death.wav');
    this.load.audio('playerShot', 'audio/player_shot.wav');
    this.load.audio('seleccion', 'audio/player_attach.wav');

    this.load.audio('extraLife', 'audio/life.wav');
    this.load.audio('getWide', 'audio/wider.wav');
    this.load.audio('intro', 'audio/intro.wav');

    // Niveles
    this.load.text('levels', 'levels.json');
  },

  create: function () 
  {
    this.game.scene.start('menu');
  }
};

/* Añadir las escenas que se van a usar */
window.onload = function ()
 {
  var game = new Phaser.Game(config);

  game.scene.add('boot', BootScene);
  game.scene.add('preloader', PreloaderScene);
  game.scene.add('1player', PlayScene);
  //game.scene.add('2player', twoPlayer);
  game.scene.add('carga', Carga);
  game.scene.add('menu', Menu);

  game.scene.start('boot');
};
