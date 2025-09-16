// Kepri Studios, 2025
const ANCHO_TECLA = 60;
const ANCHO_TECLA_NEGRA = 20;
const ALTO_TECLA = 170;
const NUM_TECLAS = 8;
const DEBUG_INFO = false;
const SCORE_FONT = 18;

var config = {
    type: Phaser.AUTO,
    width: ANCHO_TECLA * NUM_TECLAS,
    height: ALTO_TECLA,
    scene: {
        preload: preload,
        create: create,
        update: update
    }  
};


var pianoSound;

var game = new Phaser.Game(config);

var sprites = ['teclaBlanca', 'teclaNegra'];

function Casilla(x, y){
    this.x = x;
    this.y = y;
}

function preload ()
{
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'piano/assets/' + sprites[i] + '.png');

    this.load.audio('piano', 'piano/assets/piano.wav');
}

function create ()
{
    pianoSound = this.sound.add('piano', {volume: 0.5});

    // Teclas blancas
    for(let i = 0; i < NUM_TECLAS; i++) {
        let blanca = this.add.image(i * ANCHO_TECLA, 0, 'teclaBlanca').setOrigin(0, 0).setScale(1.8, 5.25);
        blanca.setInteractive();
        blanca.on('pointerdown', (pointer, x, y, event) => {
            console.log("Pulsada blanca " + i);
            pianoSound.play();
        });
    }

    const negras = [1, 1, 0, 1, 1, 1, 0];
    for(let i = 0; i < 7; i++) {
        if(negras[i])
        {
            let negra = this.add.image((i + 1) * ANCHO_TECLA - ANCHO_TECLA_NEGRA, 0, 'teclaNegra').setOrigin(0, 0).setScale(1.15, 2.75);
            negra.setInteractive();
            negra.on('pointerdown', (pointer, x, y, event) => {
                console.log("Pulsada negra " + i);
                pianoSound.play();
            });
        }
    }
}

function update (time, delta)
{

}


//-------------------------Lógica----------------------//




//--------------------Callbacks------------------//


