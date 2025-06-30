// Ramón Arjona Quiñones, 2024-2025
const TAM_CASILLA = 50;
const FILAS = 10;
const COLUMNAS = 12;
const LONGITUD_INICIAL = 3;
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

var tiempo = 0;
var frameTime = 0.3 * 1000;
var cursors;
var gameOver = false;
var score = 0;
var scoreText, localHiText;
var fpsText;
var fruta;
var tablero = []; // cada celda es true (hay serpiente) o false (no la hay)
var serpiente = [];
var cabeza, cola;
var selectSound;
var comerSound;
var gameoverSound;
var debeCrecer;

var game = new Phaser.Game(config);

var sprites = ['cuerpo', 'cabeza', 'cola', 'fruta'];

function Casilla(x, y){
    this.x = x;
    this.y = y;
}

// Estructuras
function creaAnillo(cas, dir, next, tipo, scene){
    var anillo = scene.add.image(TAM_CASILLA * cas.x + TAM_CASILLA / 2,
        TAM_CASILLA * cas.y + TAM_CASILLA / 2, tipo);
    anillo.casilla = cas;
    anillo.dir = dir;
    anillo.next = next;
    anillo.comida = false;

    // Funciones
    anillo.setDir = function(dirX, dirY) { this.dir.x = dirX; this.dir.y = dirY; };
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
    this.add.image(game.config.width/2, game.config.height/2, 'cuerpo').setScale(COLUMNAS, FILAS).setTint(0x6080b0);

    
    // - - - - Serpiente - - - - //
    // Cabeza
    serpiente.push(creaAnillo(new Casilla(COLUMNAS / 2, FILAS / 2), { x:1, y:0}, null, 'cabeza', this));
    cabeza = serpiente[0];
    cabeza.mueve = mueve;
    // Cuerpo
    for(let i = 0; i < LONGITUD_INICIAL - 2; i++){
        serpiente.push(creaAnillo({ x: serpiente[i].casilla.x - 1, y: serpiente[0].casilla.y}, { x:1, y:0}, null, 'cuerpo', this));
    }
    // Cola
    serpiente.push(creaAnillo({ x: serpiente[LONGITUD_INICIAL - 2].casilla.x - 1, y: serpiente[LONGITUD_INICIAL - 2].casilla.y  }, 
        { x:1, y:0}, null, 'cola', this));
    cola = serpiente[LONGITUD_INICIAL - 1];
    cola.next = null;

    for(let i = 0; i < LONGITUD_INICIAL - 1; i++){
        serpiente[i].next = serpiente[i + 1];
    }

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
    if (cursors.down.isDown) {
        cabeza.setDir(0, 1);
    }
    else if (cursors.up.isDown) {
        cabeza.setDir(0, -1);
    }
    else if (cursors.right.isDown){
        cabeza.setDir(1, 0);
    }
    else if (cursors.left.isDown) {
        cabeza.setDir(-1, 0);
    }

    // Mover la serpiente
    if(tiempo > frameTime)
    {
        tiempo -= frameTime;
        mueveSerpiente();
    }
    tiempo+=delta;
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


function mueveSerpiente(){
    var newCas = siguiente(cabeza.casilla, cabeza.dir);

    // a) Chocarse consigo mismo (con los bordes no; es un toroide)
    if(tablero[newCas.y][newCas.x])
    {
        endGame();
        return;
    }

    // Mover la serpiente
    mueve(cabeza, cabeza.dir);

    // Ver si ha comido una fruta
    if (fruta.casilla.x === newCas.x && fruta.casilla.y === newCas.y)
    {
        eatFruit();
        scoreText.setText('Score: ' + score);
    }
}

function dentroLimites(cas){
    return (cas.x >= 0 && cas.x < COLUMNAS && cas.y >= 0 && cas.y < FILAS);
}

// Mueve un eslabón de la serpiente
function mueve(anillo, newDir) {

    // 1) Avanza en la dirección que ya traía lógicamente...
    tablero[anillo.casilla.y][anillo.casilla.x] = false;
    anillo.casilla = siguiente(anillo.casilla, anillo.dir);
    tablero[anillo.casilla.y][anillo.casilla.x] = true;

    // ...y físicamente
    anillo.x = TAM_CASILLA * anillo.casilla.x + TAM_CASILLA / 2;
    anillo.y = TAM_CASILLA * anillo.casilla.y + TAM_CASILLA / 2;

    // 2) Llama recursivamente a que se mueva el siguiente eslabón
    if(anillo.next != null){
        mueve(anillo.next, anillo.dir)
    }

    // 3) Actualiza su dirección según la del eslabón anterior
    anillo.dir.x = newDir.x;
    anillo.dir.y = newDir.y;
    updateAngle(anillo);

    // 4) Hacer avanzar la comida
    if(anillo.comida)
    {
        // Crecer
        if(anillo === cola){
            console.log("Digerido");
            grow();
        }
        // Pasar la comida al siguiente
        else{
            anillo.next.comida = true;
            anillo.next.setTint(0x0000c0);
        }
        anillo.comida = false;
    }
    anillo.setTint(0xffffff);
}

function updateAngle(anillo){
    if(anillo.dir.x == 1)
        anillo.angle = 0;
    else if(anillo.dir.x == -1)
        anillo.angle = 180;
    else if(anillo.dir.y == 1)
        anillo.angle = 90;
    else
        anillo.angle = -90;
}

function eatFruit(){
    // Colocarla aleatoriamente
    let fil = Math.floor(Math.random() * FILAS);
    let col = Math.floor(Math.random() * COLUMNAS);
    fruta.setPosition(col * TAM_CASILLA + TAM_CASILLA / 2, fil * TAM_CASILLA + TAM_CASILLA / 2);
    fruta.casilla.x = col;
    fruta.casilla.y = fil;

    // Hacer crecer a la serpiente en el siguiente movimiento
    debeCrecer = true;
    cabeza.comida = true;
    cabeza.setTint(0x0000ff);

    // Sonido
    score++;
    comerSound.play();
}

function grow(){
    let nuevo = creaAnillo(new Casilla(cola.casilla.x, cola.casilla.y), {x: cola.dir.x, y: cola.dir.y}, cola, 'cuerpo', game.scene.scenes[0]);
    serpiente[serpiente.length - 1] = nuevo;
    serpiente[serpiente.length - 2].next = nuevo;
    //serpiente.push(cola);
    cola.setPosition(cola.x - cola.dir.x * TAM_CASILLA, cola.y - cola.dir.y * TAM_CASILLA);
    /*
    // Mandar la cola al final
    serpiente.push(cola);
    cola.setPosition(cola.x - cola.dir.x * TAM_CASILLA, cola.y - cola.dir.y * TAM_CASILLA);
    // Usar el hueco para un nuevo anillo
    serpiente[serpiente.length - 2] = nuevo;
    serpiente[serpiente.length - 3].next = nuevo;
    debeCrecer = false;
    */
}

import { ActualizaTop, mayorQue } from '../utils.js';

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