// Kepri Studios, 2025
const ANCHO_TECLA = 60;
const ANCHO_TECLA_NEGRA = 20;
const ALTO_TECLA = 170;
const NUM_TECLAS = 13;
const NUM_BLANCAS = 8;
const MARGEN_UI = 20;

var config = {
    type: Phaser.AUTO,
    width: ANCHO_TECLA * NUM_BLANCAS,
    height: ALTO_TECLA,
    scene: {
        preload: preload,
        create: create,
        update: update
    }  
};


var pianoSound;

var game = new Phaser.Game(config);

const frecuencias = [1, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41, 1.5, 1.59, 1.68, 1.78, 1.89, 2 ];
const colores = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0]; // 0 = Blanco, 1 = Negro
const sprites = ['teclaBlanca', 'teclaNegra'];
const NUM_INSTRUMENTOS = 2;
var teclas = [];
var instrumentos = [];

var instr = 0;


function preload ()
{
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'piano/assets/' + sprites[i] + '.png');

    this.load.audio('piano', 'piano/assets/piano.wav');
    this.load.audio('flauta', 'piano/assets/flauta.wav');
}

function create ()
{
    teclas = new Array(NUM_TECLAS);
    instrumentos = new Array(NUM_INSTRUMENTOS);
    instrumentos[0] = this.sound.add('piano', {volume: 0.5});
    instrumentos[1] = this.sound.add('flauta', {volume: 0.5});

    let colores = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0]; // 0 = Blanco, 1 = Negro

    // Crear todas las teclas
    let b = 0; let n = 0;
    for(let i = 0; i < NUM_TECLAS; i++) {
        let tecla;
        // Negra
        if(colores[i])
        {
            tecla = this.add.image(b * ANCHO_TECLA - ANCHO_TECLA_NEGRA, 0, 'teclaNegra').setOrigin(0, 0).setScale(1.15, 3);
            tecla.setDepth(1);
            n++;
        }
        // Blanca
        else
        {
            tecla = this.add.image(b * ANCHO_TECLA, 0, 'teclaBlanca').setOrigin(0, 0).setScale(1.8, 5.25);
            b++;
        }
        tecla.setInteractive();

        // Callbacks
        tecla.on('pointerdown', (pointer, x, y, event) => {
            //console.log("Pulsada tecla " + i);
            instrumentos[instr].rate = frecuencias[i];
            instrumentos[instr].play();
            tecla.setTint(0xC0C0C0);
        });

        tecla.on('pointerup', (pointer, x, y, event) => {
            tecla.setTint(0xFFFFFF);
        });
    }

    this.input.keyboard.on('keydown-RIGHT', event =>
    {
        instr = (instr + 1) % NUM_INSTRUMENTOS;

    });
}

function update (time, delta)
{

}


//-------------------------Lógica----------------------//




//--------------------Callbacks------------------//


