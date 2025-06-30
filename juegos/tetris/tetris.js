const FILAS = 20;
const COLUMNAS = 10;
const TAM_CASILLA = 32;

const NUM_TETRIMINOS = 7;
const LINEAS_POR_NIVEL = 3;

var config = {
    type: Phaser.AUTO,
    width: COLUMNAS * TAM_CASILLA,
    height: FILAS * TAM_CASILLA,
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
    }
};

var gameOver = false;

var game = new Phaser.Game(config);

var pieza = null;

////
// Atributos
var casillas = []; // matriz
var nivel;
var lineas;
var puntMaxima;

// Tetriminos
var tetri;
var siguienteTetri;
var debug = false;

// HUD
var coloresPiezas = [];
var colorFondo;
var colorBorde;
/////

function preload ()
{
    this.load.image('fondo', 'tetris/assets/');
    this.load.image('bloque', 'tetris/assets/blanco.png');
}

function create ()
{
    // No sé qué es esto pero queda bien
    this.add.image(0, 0, 'fondo').setScale(game.config.width, game.config.height);
    this.add.image(32, 32, 'bloque').setScale(TAM_CASILLA, TAM_CASILLA);

    pieza = new Tetrimino(0);
}

function update ()
{
    if (gameOver) { return; }
}

//------------------Pares----------------------//

function Par(x, y) {
    // Parámetros por defecto
    if(typeof(x) === 'undefined') {x = 0;}
    if(typeof(y) === 'undefined') {y = 0;}
    
    this.x = x;
    this.y = y;
}

/* Copia profunda */
function CopiaPar(otro){
    return new Par(otro.x, otro.y);
}

/* Para paliar que JS no permite sobrecargar operadores (ni funciones) */
function ParIgual(a, b){
    return (a.x === b.x) && (a.y === b.y);
}

function SumaPar(a, b){
    return new Par(a.x + b.x, a.y + b.y);
}

function RestaPar(a, b){
    return new Par(a.x - b.x, a.y - b.y);
}

//-----------------Casillas--------------------//
function Casilla(){
    this.ocupada = true;
    this.color = null;
}

//-----------------Tetriminos------------------//

function Tetrimino(type)
{
    // Parámetros por defecto
    if(typeof(type) === 'undefined') { type = 0;}

    this.tipo = type;
    this.posiciones = new Array(4);
    this.pivote = 1; //entre 0 y 3, el pixel del tetrimino que sirve de eje para rotar
    this.numRotaciones = 4; //de cuántas formas distintas se podrá ver la pieza
    this.vecesRotada = 0;

    switch (type) 
    {
        // Largo
        case 0:
            this.posiciones[0] = new Par(0, 0);
            this.posiciones[1] = new Par(1, 0);
            this.posiciones[2] = new Par(2, 0);
            this.posiciones[3] = new Par(3, 0);
            this.pivote = 2;
            this.numRotaciones = 2;
            break;
        // L-invertida 
        case 1:
            this.posiciones[0] = new Par(0, 0);
            this.posiciones[1] = new Par(0, 1);
            this.posiciones[2] = new Par(1, 1);
            this.posiciones[3] = new Par(2, 1);
            this.pivote = 2;
            this.numRotaciones = 4;
            break;
        // L
        case 2:
            this.posiciones[0] = new Par(0, 1);
            this.posiciones[1] = new Par(1, 1);
            this.posiciones[2] = new Par(2, 1);
            this.posiciones[3] = new Par(2, 0);
            this.numRotaciones = 4;
            break;
        // Cuadrado
        case 3:
            this.posiciones[0] = new Par(0, 0);
            this.posiciones[1] = new Par(1, 0);
            this.posiciones[2] = new Par(0, 1);
            this.posiciones[3] = new Par(1, 1);
            this.numRotaciones = 1;
            break;
        // Z- invertida 
        case 4:
            this.posiciones[0] = new Par(0, 1);
            this.posiciones[1] = new Par(1, 1);
            this.posiciones[2] = new Par(1, 0);
            this.posiciones[3] = new Par(2, 0);
            this.numRotaciones = 2;
            //pivote = 2;
            break;
        // T
        case 5:
            this.posiciones[0] = new Par(0, 1);
            this.posiciones[1] = new Par(1, 0);
            this.posiciones[2] = new Par(1, 1);
            this.posiciones[3] = new Par(2, 1);
            this.numRotaciones = 4;
            this.pivote = 2;
            break;
        // Z 
        case 6:
            this.posiciones[0] = new Par(0, 0);
            this.posiciones[1] = new Par(1, 0);
            this.posiciones[2] = new Par(1, 1);
            this.posiciones[3] = new Par(2, 1);
            this.numRotaciones = 2;
            //pivote = 2;
            break;
        default:
            break;
    }
}

/*

// Métodos
public void Mueve(Par dir) 
{
    for (int i = 0; i < this.posiciones.Length; i++)
        this.posiciones[i] = new Par(this.posiciones[i] + dir);
}

public void Rota() 
{
    // No rota más hacia ese lado
    if (vecesRotada + 1 == numRotaciones) 
    {
        switch (numRotaciones)
        {
            // El cuadrado no rota
            case 1:
                return;
                break;
            case 2:
                Rota(false);
                vecesRotada = 0;
                break;
            case 3:
                vecesRotada = 0;
                break;
            case 4:
                Rota(true);
                vecesRotada = 0;
                break;
            default:
                break;
        }
    }

    // Todas las piezas menos el cuadrado
    else if(numRotaciones != 1) 
    {
        Rota(true);
        vecesRotada++;
    }
}

private void Rota(bool horario) 
{
    Par posPivote = this.posiciones[pivote];
    for (int i = 0; i < this.posiciones.Length; i++)
    {
        if (this.posiciones[i] != this.posiciones[pivote])
        {
            Par posRelativa = this.posiciones[i] - posPivote;
            if(horario)
                this.posicione[i] = posPivote + new Par(-posRelativa.y, posRelativa.x);
            else
                this.posicione[i] = posPivote + new Par(posRelativa.y, -posRelativa.x);
        }
    }
}

public bool Contiene(Par pos) 
{
    return (this.posicione[0] == pos || posiciones[1] == pos
        || posiciones[2] == pos || posiciones[3] == pos);
}

*/