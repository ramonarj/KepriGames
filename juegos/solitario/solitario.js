// Ramón Arjona Quiñones, 2025
const NUM_MONTONES = 7;
const NUM_PALOS = 4;
const CARTAS_PALO = 13;
const MARGEN_IZQ = 82;
const MARGEN_ARR = 100;

const ANCHO_CARTAS = 23;
const ALTO_CARTAS = 32;
const MARGEN_CARTAS = 10;
const MARGEN_CARTAS_Y = 30;
const INICIO_MONTONES_Y = 270;

const ESCALA = 4;

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: 'rgba(33, 96, 54, 0)',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    antialias: false  
};

var gScene;

// Sonidos
var selectSound;
var mazoSound;
var popSound;
var errorSound;
var victoriaSound;

// Info del juego
var cartaSel;
var mazo;
var montones = [];
var montonesDestino = [];

// Auxiliares
var anchoReal = ANCHO_CARTAS * ESCALA;
const nombrePalos = ["Rombos", "Corazones", "Treboles", "Picas"];

var game = new Phaser.Game(config);

const sprites = ['carta', 'reverso', 'marca'];

// Palos: 0 = Rombo | 1 = Corazón | 2 = Trébol | 3 = Pica
// Números: del 1 al 13


function preload ()
{
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'solitario/assets/' + sprites[i] + '.png');

    this.load.spritesheet('baraja', 'solitario/assets/baraja.png', { frameWidth: ANCHO_CARTAS, frameHeight: ALTO_CARTAS });

    //this.load.audio('music', 'vida/assets/music_2.wav');
    this.load.audio('pop', 'vida/assets/pop.wav');
    this.load.audio('mazo', 'solitario/assets/mazo.wav');
    this.load.audio('error', '_shared/audio/error.wav');
    this.load.audio('victoria', '_shared/audio/fanfare.wav');
}

function create ()
{
    gScene = this;

    // Crear las 52 cartas para repartirlas entre mazo y montones
    var cartas = new Array(NUM_PALOS * CARTAS_PALO);
    let count = 0;
    for(let i = 0; i < NUM_PALOS; i++) {
        for(let j = 0; j < CARTAS_PALO; j++) {
            cartas[count] = new Carta(nombrePalos[i], j + 1, 0,0, this);
            count++;
        }
    }
    count=0;

    // Montones destino
    montonesDestino = new Array(NUM_PALOS);
    let iniPos = MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * 3;
    for(let i = 0; i < NUM_PALOS; i++) {
        creaMarca(iniPos + (anchoReal + MARGEN_CARTAS) * i, MARGEN_ARR, this);
        montonesDestino[i] = new Array();
    }

    // Montones normales
    montones = new Array(NUM_MONTONES);
    for(let i = 0; i < NUM_MONTONES; i++) {
        // Marca
        creaMarca(MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, INICIO_MONTONES_Y, this);

        montones[i] = new Array(i + 1);
        // Cartas tapadas
        for(let j = 0; j < i; j++)
        {
            montones[i][j] = cartas[count];
            montones[i][j].image.setPosition(MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, INICIO_MONTONES_Y + MARGEN_CARTAS_Y * j);
            montones[i][j].image.setTexture('reverso');
            montones[i][j].image.setDepth(montones[i][j].image.y);
            montones[i][j].setMonton(montones[i]);
            count++;
        }
        // La última destapada
        montones[i][i] = cartas[count];
        montones[i][i].image.setPosition(MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, INICIO_MONTONES_Y + MARGEN_CARTAS_Y * i);
        montones[i][i].image.setDepth(montones[i][i].image.y);
        montones[i][i].setMonton(montones[i]);
        count++;
    }

    // Mazo
    var restantes = cartas.slice(count, cartas.length);
    mazo = new Mazo(restantes, MARGEN_IZQ, MARGEN_ARR);

    // - - - Sonidos - - - //
    popSound = this.sound.add('pop', {volume: 0.25});
    mazoSound = this.sound.add('mazo', {volume: 0.5});
    errorSound = this.sound.add('error', {volume: 0.4});
    victoriaSound = this.sound.add('victoria', {volume: 0.5});
}

function update (time, delta)
{

}


//-------------------------Lógica----------------------//


function Mazo(cartas, x, y)
{
    this.cartas = cartas;
    this.index = cartas.length;
    this.count = cartas.length;
    // Descubiertas
    for(let i = 0; i < this.count; i++)
    {
        this.cartas[i].image.setPosition(x + anchoReal + MARGEN_CARTAS, y);
        this.cartas[i].image.visible = false;
    }

    // Marca
    creaMarca(MARGEN_IZQ, MARGEN_ARR, gScene);

    // Carta del revés
    this.cubierta = gScene.add.image(MARGEN_IZQ, MARGEN_ARR, 'reverso').setScale(4,4);
    this.cubierta.setInteractive();
    this.cubierta.on('pointerdown', mazoClicked);  

    // Funciones
    /* Saca la siguiente carta del mazo */
    this.siguiente = function()
    {
        if(this.index != this.count)
            this.cartas[this.index].image.visible = false;
        // Siguiente carta
        this.index = (this.index + 1) % (this.count + 1);

        if(this.index != this.count)
            this.cartas[this.index].image.visible = true;
    }

    /* Elimina del mazo la carta boca arriba */
    this.sacaActual = function()
    {
        this.cartas.splice(this.index, 1);
        this.count--;
        // Se acabó el mazo
        console.log(this.count);
        if(this.count <= 0) { this.cubierta.visible = false; }
        // Volver a la carta anterior
        else {
            this.index--;
            // Inicio de la baraja
            if(this.index < 0) { this.index = this.count; }
            else
                this.cartas[this.index].image.visible = true;
        }
    }
    /* Devuelve al mazo la carta que se había elegido */
    this.devuelve = function()
    {
        cartaSel.image.setPosition(this.cubierta.x + anchoReal + MARGEN_CARTAS, this.cubierta.y);
    }
}

/* Constructora de la clase "Carta" */
function Carta(palo, numero, x, y, scene)
{
    this.palo = palo;
    this.numero = numero;
    this.monton = null;

    palo = paloNum(palo);

    let carta = scene.add.image(x, y, 'baraja').setScale(4,4);
    carta.setFrame(palo * CARTAS_PALO + (numero - 1)); // Aleatoria
    carta.setInteractive({ draggable: true });

    let elThis = this;

    // Callbacks
    carta.on('drag', (pointer, dragX, dragY) => {
        if(carta.texture.key === "reverso") { return; } // TODO: muy feo esto

        carta.setPosition(dragX, dragY);
    });

    carta.on('dragend', (pointer, go) => {
        if(carta.texture.key === "reverso") { return; }

        //carta.setDepth(0);
        cardDropped();
        carta.setDepth(carta.y);
        cartaSel = null;
    });

    carta.on('pointerdown', (pointer, x, y, event) => {
        if(carta.texture.key === "reverso") { return; } 

        cartaSel = elThis;
        cardClicked();
        carta.setDepth(600);
    });

    this.image = carta;

    this.setMonton = function(monton)
    {
        this.monton = monton;
    }
}

function paloNum(nombre)
{
    return nombrePalos.indexOf(nombre);
}

function creaMarca(x, y, scene)
{
    let marca = scene.add.image(x, y, 'marca').setScale(4,4);
    return marca;
}



//--------------------Callbacks------------------//

function cardClicked(){
    popSound.play();
}

function cardDropped(pointer, dragX, dragY)
{
    // 0) Calcular el sitio donde se quiere dejar
    let w = anchoReal + MARGEN_CARTAS;

    let col = Math.floor((cartaSel.image.x - MARGEN_IZQ / 2) / w);
    let enMonton = cartaSel.image.y > (INICIO_MONTONES_Y - 50);

    // 1) Comprobar que la carta se puede colocar en el sitio deseado
    if(!puedeColocar(col, enMonton))  // Error colocando
    {
        errorSound.play();

        // Devolverla a su sitio físicamente, TODO: hacer animación para que vuelva a su sitio
        if(cartaSel.monton === null) { mazo.devuelve(); } // Venía del mazo
        else if(montonesDestino.indexOf(cartaSel.monton) < 0) // Venía de un montón normal
        {
            let indMonton = montones.indexOf(cartaSel.monton);

            let posX = MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * indMonton;
            let posY = INICIO_MONTONES_Y + MARGEN_CARTAS_Y * (montones[indMonton].length - 1);
            cartaSel.image.setPosition(posX, posY);
        }
        else // Venía de un destino
        {
            let indMonton = montonesDestino.indexOf(cartaSel.monton);

            let posX = MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * (indMonton + 3);
            cartaSel.image.setPosition(posX, MARGEN_ARR);
        }
    }
    else // Carta bien colocada (en otro sitio distinto)
    {
        colocaCarta(col, enMonton, w);
    }
}

function mazoClicked(){
    mazoSound.play();
    mazo.siguiente();
}

function puedeColocar(mon, enMonton)
{
    // Comprobar que está dentro de los límites
    if(mon >= NUM_MONTONES || mon < 0) { return false; }
    if(!enMonton && mon < 3) { return false; }

    let tamañoMonton = enMonton ? montones[mon].length : montonesDestino[mon - 3].length;
    // Colocar en los montones normales
    if(enMonton && tamañoMonton > 0)
    {
        let numDestino = montones[mon][tamañoMonton - 1].numero; 
        let paloDestino = montones[mon][tamañoMonton - 1].palo; 

        // Tienen que formar una escalera
        if(numDestino - cartaSel.numero !== 1) { return false; }
        // Y que sea de colores alternos
        if(Math.floor(paloNum(cartaSel.palo) / 2) === Math.floor(paloNum(paloDestino) / 2)) { return false; }
    }

    // Colocar en los montones destino
    if(!enMonton)
    {
        if(tamañoMonton > 0)
        {
            mon -=3;
            let numDestino = montonesDestino[mon][tamañoMonton - 1].numero; 
            let paloDestino = montonesDestino[mon][tamañoMonton - 1].palo; 

            // Tiene que ser el consecutivo
            if(cartaSel.numero - numDestino !== 1) { return false; }
            // Y que sean del mismo palo
            if(cartaSel.palo !== paloDestino) { return false; }
        }
        // La primera carta tiene que ser un as
        else if(cartaSel.numero !== 1) { return false; }
    } 
    return true;
}

function colocaCarta(col, enMonton, w)
{
    popSound.play();

    // a) Colocarla físicamente
    let posY = enMonton ? INICIO_MONTONES_Y + MARGEN_CARTAS_Y * montones[col].length : MARGEN_ARR;
    cartaSel.image.setPosition(MARGEN_IZQ + col * w, posY);
    // b) Sacarla del anterior montón/mazo
    if(cartaSel.monton === null) { mazo.sacaActual(); } // Se ha sacado del mazo
    else
    {
        cartaSel.monton.pop();
        if(cartaSel.monton.length > 0)
        {
            // Destapar la de abajo
            let destapada = cartaSel.monton[cartaSel.monton.length - 1];
            destapada.image.setTexture('baraja');
            destapada.image.setFrame(paloNum(destapada.palo) * CARTAS_PALO + (destapada.numero - 1)); 
        }
    }

    // c) Ponerla en el nuevo montón
    let nuevoMonton = enMonton ? montones[col] : montonesDestino[col-3];
    nuevoMonton.push(cartaSel);
    cartaSel.monton = nuevoMonton;

    // d) Comprobar si hemos ganado
    if(compruebaVictoria()) {
        victoriaSound.play();
    }
}

function compruebaVictoria()
{
    if(mazo.count > 0) { return false; } // Quedan cartas en el mazo

    let victoria = true;
    let i = 0;
    while(i < montones.length && victoria)
    {
        victoria = (montones[i].length <= 0);
        i++;   
    }
    return victoria;
}

//-----------------------------------------------------------------------------------