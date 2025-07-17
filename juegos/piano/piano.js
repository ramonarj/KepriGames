// Kepri Studios, 2025
const ANCHO_TECLA = 80;
const ANCHO_TECLA_NEGRA = 60;
const ALTO_TECLA = 140;
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

var tiempo = 0;
var gameRunning = false;
var fpsText;

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
}

function create ()
{
    // Teclas blancas
    for(let i = 0; i < NUM_TECLAS; i++) {
        this.add.image(i * ANCHO_TECLA, 0, 'teclaBlanca').setOrigin(0, 0);
    }

    const negras = [1, 1, 0, 1, 1, 1, 0];
    for(let i = 0; i < 7; i++) {
        if(negras[i])
            this.add.image(i * ANCHO_TECLA + ANCHO_TECLA / 2, 0, 'teclaNegra').setOrigin(0, 0);
    }

    // HUD
    if(DEBUG_INFO)
        fpsText = this.add.text(game.config.width - 144, game.config.height - 32, 'FPS', 
            { fontSize: SCORE_FONT + 'px', fill: '#fff' });

    // Para poder
    this.time.advancedTiming = true;

    // - - - - Callbacks para el ratón - - - - //
    this.input.on("pointerdown", mouseDown);
}

function update (time, delta)
{
    if (!gameRunning) { return; }

    // FPS (Nota: está función destroza el rendimiento)
    if(DEBUG_INFO)
        fpsText.setText('FPS: ' + game.loop.actualFps);

    tiempo+=delta;
}


//-------------------------Lógica----------------------//




//--------------------Callbacks------------------//

function mouseDown(pointer){
    if(gameRunning) { return; }

    console.log("Clic");
}

function mouseUp(pointer){
    // Botón izquierdo
    if(!pointer.leftButtonReleased){ // ????????
        //console.log("Botón izquierdo levantado");
    }
}