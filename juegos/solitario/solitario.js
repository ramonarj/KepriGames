// Ramón Arjona Quiñones, 2025
import { getRandomInt } from "../utils.js";
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

    // TODO: barajarlas
    cartas = baraja(cartas);

    // Montones destino
    montonesDestino = new Array(NUM_PALOS);
    let iniPos = MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * 3;
    for(let i = 0; i < NUM_PALOS; i++) {
        montonesDestino[i] = new Monton(iniPos + (anchoReal + MARGEN_CARTAS) * i, MARGEN_ARR, true);
    }

    // Montones normales
    montones = new Array(NUM_MONTONES);
    for(let i = 0; i < NUM_MONTONES; i++) 
    {
        montones[i] = new Monton(MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, INICIO_MONTONES_Y, false);

        // Cartas tapadas
        for(let j = 0; j < i; j++)
        {
            cartas[count].image.setTexture('reverso');
            montones[i].addCard(cartas[count]);
            count++;
        }
        // La última destapada
        montones[i].addCard(cartas[count]);
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


// ------------------------- Clases ---------------------- //

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

    // - - Funciones - - //
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
        //console.log(this.count);
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

function Monton(posX, posY, destino)
{
    this.posX = posX; // int
    this.posY = posY; // int
    this.cartas = new Array(); // Array<Carta>
    this.destino = destino; // bool

    // Marca
    creaMarca(posX, posY, gScene);

    // - - Funciones - - //
    this.addCard = function(carta)
    {
        let incrY = this.destino ? 0 : MARGEN_CARTAS_Y;

        carta.image.setPosition(posX, posY + incrY * this.cartas.length);
        carta.image.setDepth(carta.image.y);
        this.cartas.push(carta);
        carta.setMonton(this);
    }

    this.devuelveTop = function()
    {
        let len = this.cartas.length; let incrY = this.destino ? 0 : MARGEN_CARTAS_Y;
        this.cartas[len - 1].image.setPosition(this.posX, this.posY + (len - 1) * incrY);
    }

    this.top = function() { return this.cartas[this.cartas.length - 1]; }

    this.pop = function()
    {
        this.cartas.pop();
    }

    this.vacio = function() { return this.cartas.length <= 0; }
}

//--------------------Callbacks------------------//

function cardClicked(){
    //gScene.sound.play("pop"); // Se puede hacer, pero no conserva el volumen dado al inicio
    popSound.play();
}

function cardDropped(pointer, dragX, dragY)
{
    // 1) Calcular el sitio donde se quiere dejar
    let w = anchoReal + MARGEN_CARTAS;
    let col = Math.floor((cartaSel.image.x - MARGEN_IZQ / 2) / w);
    let destino = cartaSel.image.y <= (INICIO_MONTONES_Y - 50);

    let mon = null;
    if(destino && col >= 3 && col < NUM_MONTONES)
        mon = montonesDestino[col - 3];
    else if(!destino && col >= 0 && col < NUM_MONTONES)
        mon = montones[col];

    // 2) Comprobar que la carta se puede colocar en el sitio deseado
    if(puedeColocar(cartaSel, mon)) 
        colocaCarta(cartaSel, mon);
    else // Error colocando
    {
        gScene.sound.play("error");
        //errorSound.play();

        // Devolverla a su sitio físicamente, TODO: hacer animación para que vuelva a su sitio
        if(cartaSel.monton === null) { mazo.devuelve(); } // Venía del mazo
        else { // Venía de un montón
            cartaSel.monton.devuelveTop();
        }
    }
}

function mazoClicked(){
    mazoSound.play();
    mazo.siguiente();
}

// ------------------------- Lógica ---------------------- //

function paloNum(nombre)
{
    return nombrePalos.indexOf(nombre);
}

function creaMarca(x, y, scene)
{
    let marca = scene.add.image(x, y, 'marca').setScale(4,4);
    return marca;
}

function puedeColocar(carta, mon)
{
    // Comprobar que no es nulo
    if(mon === null || carta === null) { return false; }

    // Colocar en los montones normales
    if(!mon.destino && !mon.vacio())
    {
        let numDestino = mon.top().numero;
        let paloDestino = mon.top().palo; 

        // Tienen que formar una escalera
        if(numDestino - carta.numero !== 1) { return false; }
        // Y que sea de colores alternos
        if(Math.floor(paloNum(carta.palo) / 2) === Math.floor(paloNum(paloDestino) / 2)) { return false; }
    }

    // Colocar en los montones destino
    if(mon.destino)
    {
        if(!mon.vacio())
        {
            let numDestino = mon.top().numero; 
            let paloDestino = mon.top().palo; 

            // Tiene que ser el consecutivo
            if(carta.numero - numDestino !== 1) { return false; }
            // Y que sean del mismo palo
            if(carta.palo !== paloDestino) { return false; }
        }
        // La primera carta tiene que ser un as
        else if(carta.numero !== 1) { return false; }
    } 
    return true;
}

function colocaCarta(carta, nuevoMonton)
{
    popSound.play();

    // a) Colocarla físicamente
    let incrY = nuevoMonton.destino ? 0 : MARGEN_CARTAS_Y;
    carta.image.setPosition(nuevoMonton.posX, nuevoMonton.posY + incrY * (nuevoMonton.cartas.length - 1));
    // b) Sacarla del anterior montón/mazo
    if(carta.monton === null) { mazo.sacaActual(); } // Se ha sacado del mazo
    else
    {
        carta.monton.pop();
        if(!carta.monton.vacio())
        {
            // Destapar la de abajo
            let destapada = carta.monton.top();
            destapada.image.setTexture('baraja');
            destapada.image.setFrame(paloNum(destapada.palo) * CARTAS_PALO + (destapada.numero - 1)); 
        }
    }

    // c) Ponerla en el nuevo montón
    nuevoMonton.addCard(carta);

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
        victoria = montones[i].vacio();
        i++;   
    }
    return victoria;
}

function baraja(cartas)
{
    // Complejidad lineal (con 'n' swaps) y sin espacio extra, evitando repetidos
    let aux;
    for (let k = 0; k < cartas.length; k++)
    {
        // Cogemos una carta al azar entre las (len - k) restantes
        let al = getRandomInt(k, cartas.length);
        // La cambiamos por la de la posición k-ésima
        aux = cartas[k];
        cartas[k] = cartas[al];
        cartas[al] = aux;
    }

    return cartas;
}

//-----------------------------------------------------------------------------------