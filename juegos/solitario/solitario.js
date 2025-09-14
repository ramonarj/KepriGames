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

// Info del juego
var cartaSel;
var mazo;
var montones = [];
var montonesDestino = [];

// Auxiliares
var anchoReal = ANCHO_CARTAS * ESCALA;

var game = new Phaser.Game(config);

var sprites = ['carta', 'reverso', 'marca'];

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
    this.load.audio('error', '_shared/audio/error.wav')
}

function create ()
{
    gScene = this;

    // Huecos para colocar las escaleras
    montonesDestino = new Array(NUM_PALOS);
    let iniPos = MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * 3;
    for(let i = 0; i < NUM_PALOS; i++) {
        creaMarca(iniPos + (anchoReal + MARGEN_CARTAS) * i, MARGEN_ARR, this);
        montonesDestino[i] = new Array();
    }

    // Montones
    montones = new Array(NUM_MONTONES);
    for(let i = 0; i < NUM_MONTONES; i++) {
        // Marca
        creaMarca(MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, 270, this);

        montones[i] = new Array(i + 1);
        // Cartas tapadas
        for(let j = 0; j < i; j++)
        {
            montones[i][j] = new Carta("Rombos", 10, MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, 270 + MARGEN_CARTAS_Y * j, this);
            montones[i][j].image.setTexture('reverso');
            montones[i][j].setMonton(montones[i]);
        }
        // La última destapada
        montones[i][i] = new Carta("Rombos", i + 1, MARGEN_IZQ + (anchoReal + MARGEN_CARTAS) * i, 270 + MARGEN_CARTAS_Y * i, this);
        montones[i][i].setMonton(montones[i]);
    }

    // Mazo
    mazo = new Mazo(5, MARGEN_IZQ, MARGEN_ARR);

    // Para poder
    this.time.advancedTiming = true;

    // - - - Sonido - - - //
    popSound = this.sound.add('pop', {volume: 0.25});
    mazoSound = this.sound.add('mazo', {volume: 0.5});
    errorSound = this.sound.add('error', {volume: 0.5});
}

function update (time, delta)
{

}


//-------------------------Lógica----------------------//


function Mazo(cantidad, x, y)
{
    this.index = cantidad;
    this.count = cantidad;
    // Descubiertas
    this.cartas = new Array(cantidad);
    let elThis = this;
    for(let i = 0; i < cantidad; i++)
    {
        this.cartas[i] = new Carta("Picas", i + 1, x + anchoReal + MARGEN_CARTAS, y, gScene);
        this.cartas[i].image.visible = false;
        this.cartas[i].setMonton(elThis);
    }
    // Marca
    creaMarca(MARGEN_IZQ, MARGEN_ARR, gScene);

    // Carta del revés
    this.cubierta = gScene.add.image(MARGEN_IZQ, MARGEN_ARR, 'reverso').setScale(4,4);
    this.cubierta.setInteractive();
    this.cubierta.on('pointerdown', mazoClicked);  

    // Funciones
    this.siguiente = function()
    {
        if(this.index != this.count)
            this.cartas[this.index].image.visible = false;
        // Siguiente carta
        this.index = (this.index + 1) % (this.count + 1);

        if(this.index != this.count)
            this.cartas[this.index].image.visible = true;
    }

    this.sacaActual = function()
    {
        this.cartas.splice(this.index, 1);
        this.count--;
        // Se acabó el mazo
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
}

/* Constructora de la clase "Carta" */
function Carta(palo, numero, x, y, scene)
{
    this.palo = palo;
    this.numero = numero;
    this.monton = null;

    palo = paloNum(palo);
    //// Aleatoria
    //let palo = Math.floor(Math.random() * NUM_PALOS);
    //let num = Math.floor(Math.random() * CARTAS_PALO)
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

        carta.setDepth(0);
        cardDropped();
        cartaSel = null;
    });

    carta.on('pointerdown', (pointer, x, y, event) => {
        if(carta.texture.key === "reverso") { return; } 

        cartaSel = elThis;
        carta.setDepth(2);
        cardClicked();
    });

    this.image = carta;

    this.setMonton = function(monton)
    {
        this.monton = monton;
    }
}

function paloNum(nombrePalo)
{
    let num = -1;
    if(nombrePalo === "Rombos") { num = 0;}
    if(nombrePalo === "Corazones") {num = 1;}
    if(nombrePalo === "Treboles") {num = 2;}
    if(nombrePalo === "Picas") {num = 3;}
    return num;
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
    let w = anchoReal + MARGEN_CARTAS;

    let col = Math.floor((cartaSel.image.x - MARGEN_IZQ / 2) / w);
    let enMonton = cartaSel.image.y > (270 - 50);

    // Error colocando
    //console.log(montones[col - 1][montones[col - 1].length - 1].numero);
    //let numDestino = montones[col - 1][montones[col - 1].length - 1].numero; 
    if(!puedeColocar(col, enMonton))// || (numDestino - cartaSel.numero !== 1))
    {
        errorSound.play();
        // TODO: hacer animación para que vuelva a su sitio

        // Devolverla a su sitio físicamente
        let numElems = cartaSel.monton.length;
        let posX = cartaSel.monton[numElems - 2].image.x;
        let posY = cartaSel.monton[numElems - 2].image.y + MARGEN_CARTAS_Y;
        cartaSel.image.setPosition(posX, posY);
    }

    // Carta bien colocada (en otro sitio distinto)
    else
    {
        popSound.play();

        // Colocarla física
        let posY = enMonton ? 270 + MARGEN_CARTAS_Y * montones[col].length : MARGEN_ARR;
        cartaSel.image.setPosition(MARGEN_IZQ + col * w, posY);
        // y lógicamente
        if(cartaSel.monton != null)
        {
            // Se ha sacado del mazo
            if(cartaSel.monton === mazo) {
                mazo.sacaActual();
            }
            else
            {
                cartaSel.monton.pop();
                if(cartaSel.monton.length > 0)
                {
                    let destapada = cartaSel.monton[cartaSel.monton.length - 1];
                    destapada.image.setTexture('baraja');
                    destapada.image.setFrame(paloNum(destapada.palo) * CARTAS_PALO + (destapada.numero - 1)); 
                }
            }
        }

        if(enMonton)
        {
            montones[col].push(cartaSel);
            cartaSel.monton = montones[col];
        }
        else
        {
            montonesDestino[col - 3].push(cartaSel);
            cartaSel.monton = montonesDestino[col];
        }
    }

    // Se queda en su sitio
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
        let sumaPalos = paloNum(cartaSel.palo) + paloNum(paloDestino);
        if(sumaPalos < 2 || sumaPalos > 4) { return false; }
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
            if(cartaSel.palo != paloDestino) { return false; }
        }
        // La primera carta tiene que ser un as
        else
        {
            if(cartaSel.numero != 1) { return false; }
        }
    } 

    return true;
}


//-----------------------------------------------------------------------------------