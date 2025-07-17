// Ramón Arjona Quiñones, 2017-2025
//TODO: permitir guardar una configuración concreta para luego cargarla de archivo, mostrando todas las que se han
// guardado y permitiendo también borrarlas
const TAM_CASILLA = 16;
const FILAS = 40;
const COLUMNAS = 40;
const DEBUG_INFO = false;
const SCORE_FONT = 18;
const DEFAULT_SIM_TIME = 0.25 * 1000;

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
var simulationTime = DEFAULT_SIM_TIME;
var gameRunning = false;
var score = 0;
var gen = 0;
var poblacion = 0;
var genText, poblacionText;
var fpsText;
var tablero = []; // guarda los sprites
var auxTab = []; // booleanos
var selectSound;
var musica, popSound;
var playButton;
var forwardButton;

var game = new Phaser.Game(config);

var sprites = ['fondo', 'celula'];

function Casilla(x, y){
    this.x = x;
    this.y = y;
}

function preload ()
{
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'vida/assets/' + sprites[i] + '.png');

    this.load.spritesheet('buttons', 'vida/assets/buttons.png', { frameWidth: 64, frameHeight: 32 });

    this.load.audio('music', 'vida/assets/music_2.wav');
    this.load.audio('pop', 'vida/assets/pop.wav');
}

function create ()
{
    // Tablero lógico de booleanos
    for(let i = 0; i < FILAS; i++) {
        tablero[i] = new Array(COLUMNAS);
        auxTab[i] = new Array(COLUMNAS);
        for(let j = 0; j < COLUMNAS; j++) {
            tablero[i][j] = null;
            auxTab[i][j] = false;
        }
    }

    //  Fondo
    this.add.image(game.config.width/2, game.config.height/2, 'fondo').setScale(COLUMNAS * TAM_CASILLA, FILAS * TAM_CASILLA);

    // HUD
    genText = this.add.text(game.config.width - 120, 16, `Gen: 0`, { fontSize: SCORE_FONT + 'px', fill: '#fff' });
    poblacionText = this.add.text(16, 16, `Poblacion: 0`, { fontSize: SCORE_FONT + 'px', fill: '#fff' });
    playButton = this.add.image(game.config.width/2 - 32, 32, 'buttons');
    playButton.setFrame(0);
    playButton.setInteractive();
    playButton.on('pointerdown', playButtonClick);
    playButton.on('pointerover', playButtonHover);
    playButton.on('pointerout', playButtonOut);

    forwardButton = this.add.image(game.config.width/2 + 48, 32, 'buttons');
    forwardButton.setFrame(4);
    forwardButton.setInteractive();
    forwardButton.on('pointerdown', forwardButtonClick);
    forwardButton.on('pointerup', forwardButtonUp);
    forwardButton.on('pointerover', forwardButtonHover);
    forwardButton.on('pointerout', forwardButtonOut);

    if(DEBUG_INFO)
        fpsText = this.add.text(game.config.width - 144, game.config.height - 32, 'FPS', 
            { fontSize: SCORE_FONT + 'px', fill: '#fff' });

    // Para poder
    this.time.advancedTiming = true;

    // - - - Sonido - - - //
    popSound = this.sound.add('pop', {volume: 0.25});
    musica = this.sound.add('music', {volume: 0.4});
    musica.loop = true;
    musica.setRate(0.5);
    musica.play();
    musica.pause();

    // - - - - Callbacks para el ratón - - - - //
    this.input.on("pointerdown", mouseDown);
}

function update (time, delta)
{
    if (!gameRunning) { return; }

    // FPS (Nota: está función destroza el rendimiento)
    if(DEBUG_INFO)
        fpsText.setText('FPS: ' + game.loop.actualFps);

    // Avanzar la simulación
    if(tiempo > simulationTime)
    {
        tiempo -= simulationTime;
        simulationStep();
    }
    tiempo+=delta;
}


//-------------------------Lógica----------------------//

//1.4.MÉTODOS PARA CALCULAR POSICIONES ADYACENTES
//Arriba
function up(i) 
{
    i--;
    if (i < 0)
        i = FILAS-1;
    return i;
}

//Abajo
function down(i)
{
    i++;
    if (i > FILAS - 1)
        i=0;
    return i;
}

//Izquierda
function left(i)
{
    i--;
    if (i < 0)
        i = COLUMNAS - 1;
    return i;
}

//Derecha
function right(i)
{
    i++;
    if (i > COLUMNAS - 1)
        i = 0;
    return i;
}

function vecinos(i, j) 
{
    let numVirus = 0;

    for (let k=up(i); k != down(down(i)); k=down(k)) 
    {
        for (let l = left(j); l != right(right(j)); l=right(l))
        {
            if (tablero[k][l] !== null && (k !== i || l !== j))
                numVirus++;	
        }
    }
    return numVirus;
}

function simulationStep(){
    gen++;
    genText.text = 'Gen: ' + gen;

    // Calcular el siguiente estado
    for (let i = 0; i < FILAS; i++)
    {
        for (let j = 0; j < COLUMNAS; j++)
        {
            let virus = vecinos(i, j);
            // Crea vida
            if (virus === 3 || (tablero[i][j] !== null && virus === 2))
                auxTab[i][j] = true;
            // Mata
            else
                auxTab[i][j] = false;
        }
    }

    // Plasmarlo en el tablero real
    poblacion = 0;
    for (let i = 0; i<FILAS; i++)
    {
        for (let j = 0; j<COLUMNAS; j++)
        {
            if(auxTab[i][j]){
                poblacion++;
                if(tablero[i][j] === null){
                    let cel = game.scene.scenes[0].add.image(j*TAM_CASILLA,i*TAM_CASILLA, 'celula').setScale(TAM_CASILLA).setOrigin(0);
                    tablero[i][j] = cel;
                }
            }
            else{
                if(tablero[i][j] !== null){
                    tablero[i][j].destroy();
                    tablero[i][j] = null;
                }
            }
        }
    }
    //tab = aux
    poblacionText.text = "Poblacion: " + poblacion;
}

/* Devuelve la casilla a la que se llegará desde una posición y dirección dadas */
function siguiente(pos, dir){
    let newPos = new Casilla(pos.x + dir.x, pos.y + dir.y);
    if(newPos.x < 0) { newPos.x += COLUMNAS; }
    else if(newPos.x >= COLUMNAS) { newPos.x %= COLUMNAS; }

    if(newPos.y < 0) { newPos.y += FILAS; }
    else if(newPos.y >= FILAS) { newPos.y %= FILAS; }

    return newPos;
}


function dentroLimites(cas){
    return (cas.x >= 0 && cas.x < COLUMNAS && cas.y >= 0 && cas.y < FILAS);
}


//--------------------Callbacks------------------//

function mouseDown(pointer){
    if(gameRunning) { return; }

    const fila = Math.floor(pointer.y / TAM_CASILLA);
    const columna = Math.floor(pointer.x / TAM_CASILLA);

    // Botón izquierdo ->  crear/quitar vida
    if(pointer.leftButtonDown())
    {
        if(tablero[fila][columna] === null){
            let cel = this.scene.add.image(columna * TAM_CASILLA, fila * TAM_CASILLA, 'celula').setScale(TAM_CASILLA).setOrigin(0);
            tablero[fila][columna] = cel;
        }
        else{
            tablero[fila][columna].destroy();
            tablero[fila][columna] = null;
        }
        popSound.play();
    }
}

function playButtonClick(){
    if(gameRunning){
        playButton.setFrame(0);
        musica.pause();
    }
    else{
        playButton.setFrame(2);
        musica.resume();
    }

    gameRunning = !gameRunning; // pausar/reanudar la simulación
}

function playButtonHover(){
    if(gameRunning)
        playButton.setFrame(3);
    else
        playButton.setFrame(1);
}
function playButtonOut(){
    if(gameRunning)
        playButton.setFrame(2);
    else
        playButton.setFrame(0);
}

function forwardButtonClick(){
    if(gameRunning){
        simulationTime *= 0.25; // 4 veces más rápido
        musica.setRate(1.5);
    }
}

function forwardButtonUp(){
    if(gameRunning){
        simulationTime = DEFAULT_SIM_TIME
        musica.setRate(1);
    }
}

function forwardButtonHover(){
    forwardButton.setFrame(5);
}
function forwardButtonOut(){
    forwardButton.setFrame(4);
}


function mouseUp(pointer){
    // Botón izquierdo
    if(!pointer.leftButtonReleased){ // ????????
        //console.log("Botón izquierdo levantado");
    }
}


//-----------------------------------------------------------------------------------

/*

//1.2.CONSTRUCTORA DE ARCHIVO
public JuegoVida(string file) 
{
    StreamReader entrada = new StreamReader("colonia");
    int fils = int.Parse(entrada.ReadLine());
    int cols = int.Parse(entrada.ReadLine());
    tab = new bool[fils, cols];

    for (int i = 0; i < fils; i++)
    {
        string s = entrada.ReadLine();
        for (int j = 0; j < cols; j++)
            tab[i, j] = (s[j]== '1');
    }
    entrada.Close();
}

//1.7.POBLACIÓN MUERTA (AÑADIDO)
public bool pobMuerta ()
{
    bool muerta = true;
    int i = 0;
    while (i < tab.GetLength(0) && muerta)
    {
        int j = 0;
        while (j < tab.GetLength(1) && muerta)
        {
            if (tab[i, j])
                muerta = false;
            j++;
        }
        i++;
    }
    return muerta;
}
}

//2.CLASE MAINCLASS
class MainClass
{
//2.1.MÉTODO MAIN
public static void Main(string[] args)
{
    JuegoVida tab = menu();
    tab.Dibuja();
    System.Threading.Thread.Sleep(500);

    while (!tab.pobMuerta()) 
    {
        Console.Clear();
        tab.Siguiente();
        tab.Dibuja();
        System.Threading.Thread.Sleep(500);
    }
}
*/