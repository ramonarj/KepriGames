// Ramón Arjona Quiñones, 2017-2025
const FILS = 10;
const COLS = 10;
const NUM_MINAS = 10;
let TAM_CASILLA = 64;
const TAM_SPRITES = 32;
const TOP_PLAYERS = 5;

//import { muteGame, desdeMovil } from '../utils.js';
import { getRandomInt } from "../utils.js";


export function muteGame(){
    game.sound.mute = !game.sound.mute;
}

var config = {
    type: Phaser.AUTO,
    width: TAM_CASILLA * COLS,
    height: TAM_CASILLA * FILS,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    antialias: false
};

var numberColors = [0x0000ff, 0x00a000, 0xff0000, 0x000060, 0x800000, 0xff008b8b, 0xa000a0, 0x404040];

var gameOver = false;
var tab = null;
// Añadido para Phaser
var sonidos;
var tiempo;

var game = new Phaser.Game(config);

var nombresSonidos = ['bandera', 'bomba'];
var sharedSonidos = ['seleccion', 'fanfare'];

function preload ()
{
    this.load.image('fondo', 'buscaminas/assets/buscaminas-thumb.png');
    this.load.image('bandera', 'buscaminas/assets/bandera.png');
    this.load.image('casilla', 'buscaminas/assets/casilla.png');
    this.load.image('hundida', 'buscaminas/assets/hundida.png');
    this.load.image('bomba', 'buscaminas/assets/bomba.png');

    for(let i = 0; i < nombresSonidos.length; i++)
        this.load.audio(nombresSonidos[i], 'buscaminas/assets/' + nombresSonidos[i] + '.wav'); // se pueden indicar varias fuentes alternativas
     for(let i = 0; i < sharedSonidos.length; i++)
        this.load.audio(sharedSonidos[i], '_shared/audio/' + sharedSonidos[i] + '.wav');
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'fondo');

    let s = '';
    tab = CreaTablero(FILS, COLS, NUM_MINAS);
    for(let i = 0; i < FILS; i ++){
        for(let j = 0; j < COLS; j++){
            tab.cas[i][j].fondo = this.add.image(j * TAM_CASILLA + TAM_CASILLA / 2, 
                i * TAM_CASILLA + TAM_CASILLA / 2, 'casilla').setDisplaySize(TAM_CASILLA, TAM_CASILLA);
            if(tab.cas[i][j].mina){
                s+="X";
                //this.add.image(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2,'bandera');
            }
                
            else {
                //let num = Numero(i, j, 7);
                s+="o";
            }
        }
        s+="\n";
    }
    console.log(s);

    // - - - Sonido - - - //
    sonidos = new Map();
    for(let i = 0; i < nombresSonidos.length; i++){
        let s = this.sound.add(nombresSonidos[i]);
        sonidos.set(nombresSonidos[i], s);
    }
    for(let i = 0; i < sharedSonidos.length; i++){
        let s = this.sound.add(sharedSonidos[i]);
        sonidos.set(sharedSonidos[i], s);
    }

    // Input
    this.input.on("pointerdown", mouseDown);

    // Para desactivar el menú contextual que se abre por defecto con el click derecho
    this.input.mouse.disableContextMenu();
    tiempo = 0;
}

function update (time, delta)
{
    if (gameOver) {
        return;
    }
    tiempo += delta;
}

//----------------------------------------------------------------------------------------------------------------------------------

//0.ESTRUCTURAS//
//CASILLAS
function Casilla()
{
    this.mina = false; // contiene mina o no
                        // ’o’ no destapada, ’x’ marcada como mina, ’*’ mina destapada
                        // ’0’..’8’ indica el numero de minas alrededor (casilla destapada)
    this.estado = 'o';
    // Añadido para Phaser
    this.fondo = null;
    this.bandera = null;
}

//TABLERO DE JUEGO
function Tablero()
{
    this.cas = []; // matriz de casillas [][]
    this.posX = 0;
    this.posY = 0; // posicion del cursor
}

//PAR DE POSICIONES 
function Par(x, y)
{
    this.x = x;
    this.y = y;
}

function Numero(fil, col, valor){
    let num = game.scene.scenes[0].add.text(col * TAM_CASILLA + TAM_CASILLA / 2, fil * TAM_CASILLA + TAM_CASILLA / 2, 
    valor, { fontSize: '28px' }).setOrigin(0.5, 0.5).setScale(TAM_CASILLA / TAM_SPRITES);
    num.setTint(numberColors[valor - 1]);

    return num;
}

function hundeCasilla(t, fil, col){
    t.cas[fil][col].fondo.destroy();
    t.cas[fil][col].fondo = game.scene.scenes[0].add.image(col * TAM_CASILLA + TAM_CASILLA / 2, 
        fil * TAM_CASILLA + TAM_CASILLA / 2,'hundida').setDisplaySize(TAM_CASILLA, TAM_CASILLA);
}

//2.CREA TABLERO//
/* Devuelve un tablero ya creado */
function CreaTablero(fils, cols, numMinas)
{
    //2.1.Creamos el tablero 
    var tab = new Tablero();
    tab.posX = tab.posY = 0;
    tab.cas = new Array(fils);

    for(let i = 0; i < fils; i++) {
        tab.cas[i] = new Array(cols);
        for(let j = 0; j < cols; j++) {
            tab.cas[i][j] = new Casilla();
        }
    }

    //2.2.Inicializamos el par de posiciones y ponemos todas las posiciones del tablero cubiertas
    let posiciones = new Array(fils * cols);
    for (let i = 0; i < fils; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            tab.cas[i][j].estado = 'o';
            posiciones[i * cols + j] = new Par(j, i); //El array contiene las coordenadas de todas las casillas
        }
    }

    //2.3.Ponemos las minas con un bucle for de "numMinas" vueltas
    for (let k = 0; k < numMinas; k++)
    {
        //Hacemos un aleatorio entre los elementos del array
        let al = getRandomInt(k, posiciones.length);
        //Ponemos la mina en esa posición del tablero
        tab.cas[posiciones[al].y][posiciones[al].x].mina = true;
        //Traemos la k-ésima posición del vector a la posición aleatoria
        posiciones[al] = new Par(posiciones[k].x, posiciones[k].y);
    }
    return tab;
}

//13.COMPRUEBA SI UN PAR ESTÁ EN EL ARRAY DE PARES//
function ParRepetido(x, y, puntero, pares)
{
    let repe = false;
    let l = 0;

    while (l < puntero && !repe)
    {
        if (pares[l].x === x && pares[l].y === y)
            repe = true;
        l++;
    }
    return repe;
}

//4.DESCUBRE ADYACENTES//
function DescubreAdyacentes(t, x, y)
{
    //4.1.Declaramos las variables necesarias (fils y cols son para programar más cómodamente)
    let fils = t.cas.length;
    let cols = t.cas[0].length;

    let pares = new Array(fils * cols); //Array de pares sin explorar de tamaño fils*cols
    for(let i = 0; i < pares.length; i++)
        pares[i] = new Par();
    pares[0] = new Par(x, y); //La primera posición a explorar es la (x,y)
    let puntero = 1; //Primera posición libre en el array
    let k = 0; //Posición que estamos explorando

    //4.2.Hacemos la adyacencia
    while (k < puntero)
    {
        //Creamos dos variables para las posiciones
        let posX = pares[k].x;
        let posY = pares[k].y;

        //Contamos el nº de bombas que hay
        let bombas = 0;
        for (let i = Math.max(0, posY - 1); i < Math.min(posY + 2, fils); i++)
            for (let j = Math.max(0, posX - 1); j < Math.min(posX + 2, cols); j++)
                if (t.cas[i][j].mina)
                    bombas++;

        //Cambiamos el estado de la casilla dependiendo del nº de bombas alrededor
        t.cas[posY][posX].estado = bombas;

        // Y el sprite y número
        hundeCasilla(t, posY, posX);
        if(bombas > 0)   
            Numero(posY, posX, bombas);

        //Si no hay bombas alrededor, exploramos las casillas adyacentes en las 8 direcciones (sin salirnos del tablero)
        if (bombas === 0)
        {
            for (let i = Math.max(0, posY - 1); i < Math.min(posY + 2, fils); i++)
            {
                for (let j = Math.max(0, posX - 1); j < Math.min(posX + 2, cols); j++)
                {
                    //Si la casilla está tapada y no está ya en el array de pares, la guardamos para explorar
                    if (t.cas[i][j].estado === 'o' && !ParRepetido(j, i, puntero, pares))
                    {
                        pares[puntero].x = j;
                        pares[puntero].y = i;
                        puntero++;
                    }
                }
            }
        }
        //Damos la posición por explorada
        k++;
    }
}

//5.CLICK CASILLA//
function ClickCasilla(t)
{
    let clickBomba = false;

    //Si la casilla tiene mina y está cubierta (sin 'x'), ponemos gameover a true
    if (t.cas[t.posY][t.posX].mina && t.cas[t.posY][t.posX].estado === 'o')
    {
        clickBomba = true;
        t.cas[t.posY][t.posX].estado = '*';
    }
    //Si la casilla no tiene mina y está cubierta, llamamos a DescubreAdyacentes
    else if (t.cas[t.posY][t.posX].estado == 'o'){
        DescubreAdyacentes(t, t.posX, t.posY);
        sonidos.get('seleccion').play();
    }
        

    return clickBomba;
}

function explotaBomba(){
    gameOver = true;
    // Fondo rojo
    hundeCasilla(tab, tab.posY, tab.posX);
    tab.cas[tab.posY][tab.posX].fondo.setTint(0xff0000);
    // Sprite bomba
    game.scene.scenes[0].add.image(tab.posX * TAM_CASILLA + TAM_CASILLA / 2, 
        tab.posY * TAM_CASILLA + TAM_CASILLA / 2,'bomba').setDisplaySize(TAM_CASILLA, TAM_CASILLA);
    sonidos.get('bomba').play();
}

//8.COMPRUEBA SI EL JUEGO HA TERMINADO//
function Terminado(t)
{
    let terminado = true;

    //Encadenamos dos whiles para salir en cuanto encontremos una casilla que:
    // a)Esté tapada
    // b)Esté marcada pero no tenga mina
    let i = 0;
    while (i < t.cas.length && terminado)
    {
        let j = 0;
        while (j < t.cas[0].length && terminado)
        {
            if (t.cas[i][j].estado === 'o' || (!t.cas[i][j].mina && t.cas[i][j].estado === 'x'))
                terminado = false;
            j++;
        }
        i++;
    }
    return terminado;
}

//--------------------Callbacks------------------//
import { ActualizaTop, menorQue } from '../utils.js';

function mouseDown(pointer){
    if(gameOver) { return; }

    const fila = Math.floor(pointer.y / TAM_CASILLA);
    const columna = Math.floor(pointer.x / TAM_CASILLA);
    tab.posX = columna;
    tab.posY = fila;

    // Botón izquierdo -> revelar una casilla
    if(pointer.leftButtonDown()){
        // Comprobar que no explote una bomba
        if(ClickCasilla(tab)){
            explotaBomba();
        }
    }
    // Botón derecho -> poner/quitar una bandera
    else if(pointer.rightButtonDown()){
        // poner
        if (tab.cas[tab.posY][tab.posX].estado == 'o'){
            tab.cas[tab.posY][tab.posX].estado = 'x';
            tab.cas[tab.posY][tab.posX].bandera = game.scene.scenes[0].add.image(tab.posX * TAM_CASILLA + TAM_CASILLA / 2, 
                tab.posY * TAM_CASILLA + TAM_CASILLA / 2,'bandera').setDisplaySize(TAM_CASILLA, TAM_CASILLA);
            sonidos.get('bandera').play();
        }
        // quitar
        else if (tab.cas[tab.posY][tab.posX].estado == 'x'){
            tab.cas[tab.posY][tab.posX].estado = 'o';
            tab.cas[tab.posY][tab.posX].bandera.destroy();
            sonidos.get('bandera').play();
        }
    }

    // Comprobar si hemos ganado
    if(!gameOver && Terminado(tab)){
        ActualizaTop(parseFloat((tiempo/1000).toFixed(2)), TOP_PLAYERS, 'buscaminas', menorQue);
        sonidos.get('fanfare').play();
        console.log("Has ganado en " + (tiempo/1000).toFixed(2) + " segundos");
        gameOver = true;
    }
}