// Kepri Studios, 2024-2025
// Dedicado a Inmaculada Quiñones Morata
// TODO:
// 1) Usar algoritmo del buscaminas para que no pueda aparecer fruta en casillas ocupadas por la serpiente
import { ActualizaTop, mayorQue } from '../utils.js';

const TAM_CASILLA = 50;
const FILAS = 10;
const COLUMNAS = 12;
const LONGITUD_INICIAL = 2;
const DEBUG_INFO = true;
const SCORE_FONT = 18;
const TOP_PLAYERS = 3;

var config = {
    type: Phaser.AUTO,
    width: TAM_CASILLA * COLUMNAS,
    height: TAM_CASILLA * FILAS,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Control
var tiempo = 0;
var frameTime = 0.3 * 1000;
var cursors;
var gameOver = false;
var score = 0;
// Canvas
var scoreText, localHiText;
var fpsText;
// Entidades del juego
var fruta;
var tablero = []; // cada celda es true (hay serpiente) o false (no la hay)
var serpiente;
// Sonidos
var comerSound;
var gameoverSound;
var gScene;

var game = new Phaser.Game(config);

var sprites = ['cuerpo', 'cabeza', 'cola', 'fruta'];

function Casilla(x, y){
    this.x = x;
    this.y = y;
}

function Serpiente(scene)
{
    /* Constructora */
    this.cuerpo = [];
    for(let i = 0; i < LONGITUD_INICIAL; i++){
        this.cuerpo.push(creaAnillo({ x: 6 - i, y: 5}, scene));
    }
    this.cabeza = this.cuerpo[0];
    this.cola = this.cuerpo[LONGITUD_INICIAL - 1];

    this.dir = new Casilla(1, 0);
    this.nextDir = new Casilla(0, 0);
    this.debeCrecer = false;
    // Funciones //
    this.setDir = function(dirX, dirY)
    {
        this.nextDir.x = dirX;
        this.nextDir.y = dirY;
    }

    this.updateDir = function()
    {
        if(this.nextDir.x === 0 && this.nextDir.y === 0) { return; }

        this.dir.x = this.nextDir.x;
        this.dir.y = this.nextDir.y;
        this.nextDir.x = this.nextDir.y = 0;
    }

    /* Mueve un paso la serpiente, teniendo en cuenta la dirección que lleva la cabeza */
    this.mueve = function()
    {
        var newCas = siguiente(this.cabeza.casilla, this.dir);

        // a) Chocarse consigo mismo (con los bordes no; es un toroide)
        if(tablero[newCas.y][newCas.x])
        {
            endGame();
            return;
        }

        // b) Actualizar el tablero (solo en la cabeza y cola)
        tablero[newCas.y][newCas.x] = true;
        tablero[this.cola.casilla.y][this.cola.casilla.x] = false;

        //
        if(!this.debeCrecer){
            let sigCas = this.cuerpo[this.cuerpo.length - 2].casilla;
            this.mueveAnillo(this.cola, sigCas.y, sigCas.x);
        } else {this.debeCrecer = false;}

        // c) Mover cada anillo del cuerpo empezando por atrás
        for(let i = this.cuerpo.length - 2; i > 0; i--)
        {
            let sigCas = this.cuerpo[i - 1].casilla;
            this.mueveAnillo(this.cuerpo[i], sigCas.y, sigCas.x);
        }   

        // d) Mover la cabeza lógica y físicamente en la dirección que lleve
        this.mueveAnillo(this.cabeza, newCas.y, newCas.x);

        // e) Ver si tenía pendiente crecer
        /*
        if(this.debeCrecer)
        {
            this.crece();
            this.debeCrecer = false;
        }*/

        // e) Ver si ha comido una fruta
        if (fruta.casilla.x === newCas.x && fruta.casilla.y === newCas.y)
        {
            serpiente.comeFruta();
            scoreText.setText('Score: ' + score);
        }
    }

    /* Mueve el anillo a la posición del tablero dada */
    this.mueveAnillo = function(anillo, fil, col)
    {
        // Lógica
        anillo.casilla.x = col;
        anillo.casilla.y = fil;
        // Física
        anillo.x = TAM_CASILLA * col + TAM_CASILLA / 2;
        anillo.y = TAM_CASILLA * fil + TAM_CASILLA / 2;
    }

    /* Se come la fruta, aumentando la puntuación */
    this.comeFruta = function(){
        // Colocarla aleatoriamente
        let fil = Math.floor(Math.random() * FILAS);
        let col = Math.floor(Math.random() * COLUMNAS);
        fruta.setPosition(col * TAM_CASILLA + TAM_CASILLA / 2, fil * TAM_CASILLA + TAM_CASILLA / 2);
        fruta.casilla.x = col;
        fruta.casilla.y = fil;

        // Crecer
        this.crece();

        // Sonido
        score++;
        comerSound.play();
    }

    this.crece = function()
    {
        this.cuerpo.push(creaAnillo({ x: this.cola.casilla.x, y: this.cola.casilla.y}, gScene));
        this.cola = this.cuerpo[this.cuerpo.length - 1];
    }
}


// Estructuras
function creaAnillo(cas, scene){
    var anillo = scene.add.image(TAM_CASILLA * cas.x + TAM_CASILLA / 2,
        TAM_CASILLA * cas.y + TAM_CASILLA / 2, 'cuerpo');
    anillo.casilla = cas;

    return anillo;
}

function preload ()
{
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'snake/assets/' + sprites[i] + '.png');

    this.load.audio('comer', ['snake/assets/comer.wav']); // se pueden indicar varias fuentes alternativas
    this.load.audio('gameover', 'snake/assets/gameover.wav');

    this.load.bitmapFont('whiteFont', '_shared/fonts/white.png', '_shared/fonts/white.fnt');
}

function create ()
{
    gScene = this;
    let localHi = 0;
    if(document.cookie){
        localHi = document.cookie.split('=')[1];
        console.log(localHi);
    }
    // Tablero lógico
    for(let i = 0; i < FILAS; i++) {
        tablero[i] = new Array(COLUMNAS);
        for(let j = 0; j < COLUMNAS; j++) {
            tablero[i][j] = false;
        }
    }

    //  Fondo
    this.add.image(game.config.width/2, game.config.height/2, 'cuerpo').setScale(COLUMNAS + 1, FILAS + 1).setTint(0x6080b0);
    
    // - - - - Serpiente - - - - //
    serpiente = new Serpiente(this);

    // - - - -  Frutas - - - - //
    fruta = this.add.image(TAM_CASILLA * 2 + TAM_CASILLA / 2,TAM_CASILLA * 5 + TAM_CASILLA / 2, 'fruta');
    fruta.casilla = {x: 2, y:5};

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    // HUD
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: SCORE_FONT + 'px', fill: '#fff' });
    //localHiText = this.add.text(game.config.width - 120, 16, `Best: ${localHi}`, { fontSize: SCORE_FONT + 'px', fill: '#fff' });
    localHiText = this.add.bitmapText(game.config.width - 140, 16, 'whiteFont',`Best: ${localHi}`, 15);

    if(DEBUG_INFO)
        fpsText = this.add.text(game.config.width - 144, game.config.height - 32, 'FPS', 
            { fontSize: SCORE_FONT + 'px', fill: '#fff' });

    // Para poder
    this.time.advancedTiming = true;

    // - - - Sonido - - - //
    comerSound = this.sound.add('comer');
    gameoverSound = this.sound.add('gameover');

    // - - - - Callbacks para el ratón - - - - //
    this.input.on("pointerdown", mouseDown);
    this.input.on("pointerup", mouseUp);
}

function update (time, delta)
{
    if (gameOver) { return; }

    // FPS (Nota: está función destroza el rendimiento)
    if(DEBUG_INFO)
        fpsText.setText('FPS: ' + game.loop.actualFps);

    // Movimiento en 4 direcciones
    readInput();

    // Mover la serpiente
    if(tiempo > frameTime)
    {
        tiempo -= frameTime;
        serpiente.updateDir();
        serpiente.mueve();
        console.log("Mueve");
    }
    tiempo+=delta;
}

function readInput(){
    if (cursors.down.isDown) {
        if(serpiente.dir.y != -1)
            serpiente.setDir(0, 1);
    }
    else if (cursors.up.isDown) {
        if(serpiente.dir.y != 1)
            serpiente.setDir(0, -1);
    }
    else if (cursors.right.isDown){
        if(serpiente.dir.x != -1)
            serpiente.setDir(1, 0);
    }
    else if (cursors.left.isDown) {
        if(serpiente.dir.x != 1)
            serpiente.setDir(-1, 0);
    }
}


//-------------------------Lógica----------------------//

/* Devuelve la casilla a la que se llegará desde una posición y dirección dadas */
function siguiente(pos, dir){
    let newPos = new Casilla(pos.x + dir.x, pos.y + dir.y);
    if(newPos.x < 0) { newPos.x += COLUMNAS; }
    else if(newPos.x >= COLUMNAS) { newPos.x %= COLUMNAS; }

    if(newPos.y < 0) { newPos.y += FILAS; }
    else if(newPos.y >= FILAS) { newPos.y %= FILAS; }

    return newPos;
}

/* No se usa porque es un toroide */
function dentroLimites(cas){
    return (cas.x >= 0 && cas.x < COLUMNAS && cas.y >= 0 && cas.y < FILAS);
}

function endGame(){
    gameOver = true;
    gameoverSound.play();
    for(let i = 0; i < serpiente.length; i++)
        serpiente[i].setTint(0xff0000);
    let json = JSON.stringify(score);

    // Actualizar punt. máxima si entra en el top 3
    ActualizaTop(score, TOP_PLAYERS, 'snake', mayorQue);

    // Actualizar la máxima local (cookie)
    if(!document.cookie || score > document.cookie.split('=')[1]){
        document.cookie = `hiscore=${score}`;
        localHiText.setText('Best: ' + score).setTint(0xd0d000);
    }
}

//------------------Highscore local (cookies)---------------//

async function getHighscore(){
    // Por defecto es de tipo GET
        const myRequest = new Request('/' + score, {
        method: "GET",
        body: score
    });
    const response = await fetch(myRequest);
    const hiscore = await response.json();

    // Esto debería haber una forma mejor de hacerlo
    localHi = game.scene.scenes[0].add.text(game.config.width / 4, 16, 'Hi-Score(local): ' + hiscore, 
        { fontSize: SCORE_FONT + 'px', fill: '#000' });
    return hiscore;
}


//--------------------Callbacks------------------//

function mouseDown(pointer){
    // Botón izquierdo
    if(pointer.leftButtonDown()){
        console.log("Botón izquierdo pulsado");
    }
}

function mouseUp(pointer){
    // Botón izquierdo
    if(!pointer.leftButtonReleased){ // ????????
        //console.log("Botón izquierdo levantado");
    }
}