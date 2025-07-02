// Kepri Studios, 2025
import { loadFile } from '../utils.js';

const COLS = 26; //Sin contar paredes
const FILS = 29; //""
const TAM_CASILLA = 16;
var config = {
    type: Phaser.AUTO,
    width: TAM_CASILLA * COLS,
    height: TAM_CASILLA * FILS,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var gameOver = false;
var cursors;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('fondo', 'pacman/assets/mapa.png');
    this.load.image('punto', 'pacman/assets/punto.png');
    this.load.spritesheet('pacman', 'pacman/assets/pacman.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('ojos', 'pacman/assets/ojos.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('ghosts', 'pacman/assets/ghosts.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('vitamina', 'pacman/assets/vitamina.png', { frameWidth: 16, frameHeight: 16 });

    this.load.bitmapFont('whiteFont', '_shared/fonts/white.png', '_shared/fonts/white.fnt');
}

var blinkyCont;
var pacman;
const ghostNames = ["Blinky", "Pinky", "Inky", "Clyde"];
function create ()
{
    // - - Animaciones - - //
    this.anims.create({
        key: 'pacman',
        frames: this.anims.generateFrameNumbers('pacman', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    // Fantasmas
    for(let i = 0; i < 4; i++){
        this.anims.create({
            key: ghostNames[i],
            frames: this.anims.generateFrameNumbers('ghosts', { start: i * 4, end: i * 4 + 1 }),
            frameRate: 10,
            repeat: -1
        });
    }
    // Vitamina
    this.anims.create({
        key: 'vitamina',
        frames: this.anims.generateFrameNumbers('vitamina', { start: 0, end: 1 }),
        frameRate: 6,
        repeat: -1
    });

    // - - Fondo - - //
    this.add.image(TAM_CASILLA * COLS / 2,  TAM_CASILLA * FILS / 2, 'fondo');

    // Cargar nivel y rellenar con puntos, vitaminas y muros
    let level = loadFile("pacman/levels.txt");
    console.log(level);
    for(let i = 1; i < FILS + 2; i++){
        const linea = level.split('\r')[i];
        for(let j = 0; j < COLS + 1; j++){
            switch(linea[j*2 + 1])
            {
                case '2':
                    this.add.image(j * TAM_CASILLA - TAM_CASILLA / 2,  i * TAM_CASILLA - TAM_CASILLA / 2, 'punto');
                    break;
                case '3':
                    let vitamina = this.add.sprite(j * TAM_CASILLA - TAM_CASILLA / 2,  i * TAM_CASILLA - TAM_CASILLA / 2, 'vitamina');
                    vitamina.play("vitamina");
                default:
                    break;                
            }
        }
    }

    // - - Personajes - - //
    pacman = this.add.sprite(300, 400, 'pacman');
    pacman.dirX = 0;
    pacman.dirY = 0;
    pacman.setDir = function(dirX, dirY) { 
        this.dirX = dirX; this.dirY = dirY; 
        if(dirX == 1) this.angle = 0;
        else if(dirX == -1) this.angle = 180;
        else if(dirY == 1) this.angle = 90;
        else if(dirY == -1) this.angle = 270;
        };
    pacman.mueve = function(delta) 
    {
        this.x += this.dirX * delta * 0.1; 
        this.y += this.dirY * delta * 0.1;
        // Toroide
        if(this.x > game.config.width) this.x = this.x - game.config.width;
        else if(this.x < 0) this.x = game.config.width + this.x;
        if(this.y > game.config.height) this.y = this.y - game.config.height;
        else if(this.y < 0) this.y = game.config.height + this.y;
    };

    let blinky = this.add.sprite(0, 0, 'ghosts');
    let ojosBlinky = this.add.sprite(0, 0, 'ojos');
    ojosBlinky.setName("ojos");

    blinkyCont = this.add.container(100, 100, [blinky, ojosBlinky]);

    cursors = this.input.keyboard.createCursorKeys();

    var tab = new Tablero();

    // HUD
    let scoreText = this.add.bitmapText(TAM_CASILLA / 2, 0, 'whiteFont',`1UP 0`, 16);
    let hiscoreText = this.add.bitmapText(game.config.width - TAM_CASILLA * 7, 0, 'whiteFont',`HIGH 0`, 16);

    //
    pacman.play("pacman");
    blinky.play("Pinky");
    //vitamina.play("vitamina");
    lookAt(blinkyCont, 3);
}

function update (time, delta)
{
    if (gameOver) { return; }

        // Movimiento en 4 direcciones
    if (cursors.down.isDown) {
        pacman.setDir(0, 1);
    }
    else if (cursors.up.isDown) {
        pacman.setDir(0, -1);
    }
    else if (cursors.right.isDown){
        pacman.setDir(1, 0);
    }
    else if (cursors.left.isDown) {
        pacman.setDir(-1, 0);
    }

    pacman.mueve(delta);

    blinkyCont.x += delta * 0.1;
}

// -----------------------------------------------------------------------//

function lookAt(ghost, dir){
    ghost.getByName("ojos").setFrame(dir);
}

// ------------------------------------------------------------------------//

function Tablero () {
    // dimensiones del tablero
    this.FILS = 0;
    this.COLS = 0;
    var FILS, COLS;
    // contenido de las casillas
    const Casilla = Object.freeze({
        Blanco:0, 
        Muro: 1, 
        Comida: 2, 
        Vitamina: 3, 
        MuroCelda: 4
    });

    // matriz de casillas (tablero)
    var cas;
    // representacion de los personajes (Pacman y fantasmas)
    function Personaje () {
        var posX, posY; // posicion del personaje
        var dirX, dirY; // direccion de movimiento
        var defX, defY; // posiciones de partida por defecto
    }
    // vector de personajes, 0 es Pacman y el resto fantasmas
    var pers;
    var lapFantasmas; // tiempo de retardo de salida del los fantasmas
    var numComida; // numero de casillas retantes con comida o vitamina
    var numNivel; // nivel actual de juego
    // generador de numeros aleatorios para el movimiento de los fantasmas
    var rnd;
    // flag para mensajes de depuracion en consola
    var Debug = true;
}