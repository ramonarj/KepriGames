// Ramón Arjona Quiñones, 2025
import { ActualizaTop, menorQue } from "../utils.js";
const FILAS = 20;
const COLUMNAS = 30;
const TAM_CASILLA = 32;
const BACKGROUND_LAYER = 0;
const FOREGROUND_LAYER = 1;
const CANVAS_LAYER = 2;

export function muteGame(){
    game.sound.mute = !game.sound.mute;
}

// Interceptar los eventos correspondientes a la flechas de dirección para que no muevan la ventana
window.addEventListener("keydown", function(e) {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        onKeyDown(e);
        e.preventDefault();
    }
}, false);


var config = {
    type: Phaser.AUTO,
    width: COLUMNAS * TAM_CASILLA,
    height: FILAS * TAM_CASILLA,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var gameOver = false;

var game = new Phaser.Game(config);

var tab = null;
var contador = 0;
var movimientos = [];
var player;
var scoreText;
var nivel = 7; // TODO: a partir del 8 inclusive falla

var sonidos;
var nombresSonidos = ['fanfare', 'error', 'empujar', 'click'];
var musica;

function preload ()
{
    this.load.image('fondo', 'sokoban/assets/');
    this.load.image('blanco', 'sokoban/assets/blanco.png');
    this.load.image('caja', 'sokoban/assets/caja.png');4
    this.load.image('muro', 'sokoban/assets/muro.png');
    this.load.image('player', 'sokoban/assets/player.png');
    this.load.image('destino', 'sokoban/assets/destino.png');

    for(let i = 0; i < nombresSonidos.length; i++)
        this.load.audio(nombresSonidos[i], 'sokoban/assets/' + nombresSonidos[i] + '.wav'); 

    this.load.audio('music', 'sokoban/assets/music.mp3');
}

function create ()
{
    // No sé qué es esto pero queda bien
    //this.add.image(0, 0, 'fondo').setScale(game.config.width, game.config.height);
    //this.add.image(32, 32, 'bloque').setScale(TAM_CASILLA, TAM_CASILLA);

    player = game.scene.scenes[0].add.image(0, 0, 'player');
    player.setDepth(FOREGROUND_LAYER);

    initBoard();

    //readAsync("levels.txt");

    // HUD
    scoreText = this.add.text(8, 8, 'Movimientos: 0', { fontSize: '18px', fill: '#fff' });
    scoreText.setDepth(CANVAS_LAYER);

    // - - - Sonidos y música - - - //
    sonidos = new Map();
    for(let i = 0; i < nombresSonidos.length; i++){
        let s = this.sound.add(nombresSonidos[i]);
        sonidos.set(nombresSonidos[i], s);
    }
    sonidos.get('error').volume = 0.25;
    sonidos.get('fanfare').volume = 0.4;
    musica = this.sound.add('music', {volume: 0.6});
    musica.loop = true;
    musica.play();

    console.log("Create");
    this.input.keyboard.on('keydown', onKeyDown);
}

async function initBoard(){
    tab = await LeeNivel("levels.txt", nivel);

    DibujaTablero(tab, 0);
    console.log(tab.fils);
    console.log(tab.cols);

    // Reducir el tamaño del canvas a lo necesario
    game.canvas.width = tab.cols * TAM_CASILLA;
    //game.canvas.height = tab.fils * TAM_CASILLA * 1.5;
    //game.scene.scene[0].scene.cameras.main.setBounds(0, 0, 200, 100);
}

function update ()
{
    if (gameOver) { return; }
}


//------------------Declaración de tipos-----------------//

function Movimiento(x, y, nx, ny, mueve){
    this.x = x;
    this.y = y;
    this.nx = nx;
    this.ny = ny;

    if(typeof(mueve) === 'undefined') {mueve = false;}
    this.mueve = mueve;
}

/* El tipo enumerado "Casilla" tiene 3 valores posibles, 
dependiendo de si en la casilla en cuestión hay un Muro, 
un Destino o está Libre */
const Casilla = Object.freeze({
    Muro: 0,
    Libre: 1,
    Destino: 2
});


/*La estructura "Tablero" guarda información sobre el tablero de juego 
    en un momento dado. Contiene las dimensiones del nivel (filas y
    columnas), la posición del jugador (en ambas dimensiones) y dos arrays
    bidimiensionales; uno para las casillas fijas del nivel y otro para
    saber en qué casillas hay cajas*/
function Tablero()
{
    this.fils = 0;
    this.cols = 0;
    this.fijas = []; // matriz de casillas

    /*NOTA: el nº de cajas debe ser igual al de posiciones destino.
        Las posiciones con cajas deben corresponder a posiciones 
        libre/destino en la matriz fijas[,] */
    this.cajas = []; //matriz de booleanos indicando si hay cajas
    //Añadido para Phaser
    this.images = [];

    //NOTA: las posiciones del jugador deben corresponder a una casilla libre/destino y sin caja.
    this.jugX = 0;
    this.jugY = 0;
}


//----------------------Utilidades----------------------//

//3.CREACIÓN DE UN TABLERO VACÍO
function CreaTableroVacio(fils, cols)
{
    var tab = new Tablero();
    //Inicializamos la matriz de casillas fijas y la de cajas
    tab.fijas = new Array(fils);
    tab.cajas = new Array(fils);
    tab.images = new Array(fils);
    for (let i = 0; i < fils; i++){
        tab.fijas[i] = new Array(cols);
        tab.cajas[i] = new Array(cols);
        tab.images[i] = new Array(cols);
        for (let j = 0; j < cols; j++){
            tab.fijas[i][j] = Casilla.Muro; //Con el valor Muro
            tab.cajas[i][j] = false; //Con el valor false
            tab.images[i][j] = null; //Con el valor false
        }
    }

    //Inicializamos todos los enteros a 0
    tab.fils = tab.cols = tab.jugX = tab.jugY = 0;

    return tab;
}

async function readAsync(file){
    const req = new Request('sokoban/' + file);
    const resp = await fetch(req);
    const levels = await resp.text();

    return levels;
}



//4.LECTURA DE UN NIVEL SOLICITADO
async function LeeNivel(file, nivel) // string, int
{
    //Creamos el lector de archivo "Niveles.txt"
    let niveles = (await readAsync(file)).split('\n');
    let s = "";

    //Recorremos el archivo hasta llegar al nivel
    let k = 0;
    while (k < 100 && s !== ("Level " + nivel + '\r')){
        s = niveles[k];
        k++;
    }

    //Creamos el tablero vacío
    var tab = CreaTableroVacio(FILAS, COLUMNAS);
    
    //Mientras no hayamos llegado al final del nivel:
    let i = 0; //Fila 
    while (s !== '\r')//&& !entrada.EndOfStream)
    {
        s = niveles[k]; k++; //Leemos la línea
        let j = 0; //Nos situamos en el primer caracter de la línea
                    //Comprobamos el ancho del nivel
        if (tab.cols < s.length)
            tab.cols = s.length;

        while (s !== "" && j < s.length)
        {
            //console.log(s[j]);
            //Convertimos cada caracter de la cadena de esa línea y comprobamos de qué casilla se trata
            //
            //    NOTA: no leemos las almohadillas, porque hemos inicializado la matriz de Casillas
            //    a "Muro" y la de cajas a false
            //
            if (s[j] === ' ') //Casilla vacía
            {
                tab.fijas[i][j] = Casilla.Libre;
            }
            else if (s[j] === '.') //Casilla destino
            {
                tab.fijas[i][j] = Casilla.Destino;
            }
            else if (s[j] === '$') //Casilla con caja
            {
                tab.fijas[i][j] = Casilla.Libre;
                tab.cajas[i][j] = true;
            }
            else if (s[j] === '@') //Casilla con jugador
            {
                tab.fijas[i][j] = Casilla.Libre;
                tab.jugY = i;
                tab.jugX = j;
            }
            else if (s[j] === '*') //Caja sobre casilla destino
            {
                tab.fijas[i][j] = Casilla.Destino;
                tab.cajas[i][j] = true;
            }
            else if (s[j] === '+') //Jugador sobre casilla destino
            {
                tab.fijas[i][j] = Casilla.Destino;
                tab.jugY = i;
                tab.jugX = j;
            }
            j++; //Pasamos al siguiente caracter
        }
        //Comprobamos el alto del nivel
        if (tab.fils < i)
            tab.fils = i;

        i++; //Pasamos a la siguiente fila
    }
    //if (entrada.EndOfStream) //Para que el último nivel se dibuje bien
    //    tab.fils++;

    return tab;
}

//5.RENDERIZADO DEL TABLERO
function DibujaTablero(tab, mov)
{
    for (let i = 0; i < tab.fils; i++) //Recorremos las filas
    {
        for (let j = 0; j < tab.cols; j++) //Recorremos las columnas
        {
            //Casillas libres
            if (tab.fijas[i][j] === Casilla.Libre)
            {
                if (tab.cajas[i][j] === true) //O hay una caja...
                {
                    tab.images[i][j] = game.scene.scenes[0].add.image(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2, 'caja');
                    tab.images[i][j].setDepth(FOREGROUND_LAYER);
                }

                else if (tab.jugX === j && tab.jugY === i) //...o está el jugador...
                {
                    player.setPosition(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2);
                }

                // En cualquier caso, habrá que poner un fondo
                let fondo = game.scene.scenes[0].add.image(j * TAM_CASILLA + TAM_CASILLA / 2,
                        i * TAM_CASILLA + TAM_CASILLA / 2, 'muro').setTint(0x604060);
                fondo.setDepth(BACKGROUND_LAYER);
            }

            //Casillas muro
            else if (tab.fijas[i][j] === Casilla.Muro)
            {
                tab.images[i][j] = game.scene.scenes[0].add.image(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2, 'muro');
            }

            //Casillas destino
            else
            {
                tab.images[i][j] = game.scene.scenes[0].add.image(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2, 'destino');
                tab.images[i][j].setDepth(BACKGROUND_LAYER + 0.5);
                // caja sobre destino
                if(tab.cajas[i][j]){
                    tab.images[i][j] = game.scene.scenes[0].add.image(j * TAM_CASILLA + TAM_CASILLA / 2, i * TAM_CASILLA + TAM_CASILLA / 2, 'caja');
                    tab.images[i][j].setDepth(FOREGROUND_LAYER);
                }
            }
        }
    }
}


//7.COMPROBACIÓN DEL LÍMITE DE LA PANTALLA
function Siguiente(x, y, dir, tab, newPos) //newPos sale por referencia
{
    let dentro = true;
    newPos.x = x;
    newPos.y = y;

    //Establecemos la posición siguiente según la dirección pulsada
    if (dir == 'u')
        newPos.y--;
    else if (dir == 'd')
        newPos.y++;
    else if (dir == 'l')
        newPos.x--;
    else if (dir == 'r')
        newPos.x++;

    //Si hay un muro o está fuera del mapa, la próxima posición no es viable
    if ((newPos.x < 0 || newPos.x > tab.cols) || (newPos.y < 0 || newPos.y > tab.fils) || tab.fijas[newPos.y][newPos.x] === Casilla.Muro) 
        dentro = false;

    return dentro;
}

function MueveJugador(newPos){
    // logica
    tab.jugX = newPos.x;
    tab.jugY = newPos.y;
    // graficos
    player.setPosition(tab.jugX * TAM_CASILLA + TAM_CASILLA / 2, tab.jugY * TAM_CASILLA + TAM_CASILLA / 2);
}

function MueveCaja(origen, destino){
    tab.cajas[origen.y][origen.x] = false;
    tab.cajas[destino.y][destino.x] = true;

    // gráficos
    tab.images[origen.y][origen.x].setPosition(TAM_CASILLA * destino.x + TAM_CASILLA / 2, TAM_CASILLA * destino.y + TAM_CASILLA / 2);
    tab.images[destino.y][destino.x] = tab.images[origen.y][origen.x];

    sonidos.get('empujar').play();
}

//8.MUEVE AL JUGADOR (Y CAJAS) EN EL TABLERO:
function Mueve(tab, dir)
{
    var newPos = { x: 0, y: 0 }; //La posición a la que queremos ir
    let dentro = Siguiente(tab.jugX, tab.jugY, dir, tab, newPos); //Vemos si donde queremos ir 
                                                                            //hay un muro o no
    let movido = false; //Indica si el jugador se ha movido

    if (dentro) //Si no hay un muro:
    {
        //Puede haber una caja
        if (tab.cajas[newPos.y][newPos.x] === true)
        {
            var newPos2 = { x: 0, y: 0 }; //La posición detrás de la caja 
            dentro = Siguiente(newPos.x, newPos.y, dir, tab, newPos2); //Calculamos nx2 e ny2
                                                                    //para ver qué hay detrás de la caja
            if (dentro && !tab.cajas[newPos2.y][newPos2.x]) //Si detrás de la caja no hay ni muro ni caja:
            {
                movimientos.push(new Movimiento(tab.jugX,  tab.jugY, newPos.x, newPos.y, true));

                //Movemos al jugador
                MueveJugador(newPos);
                movido = true;

                //Desplazamos la caja
                MueveCaja(newPos, newPos2);
                if(tab.fijas[newPos2.y][newPos2.x] === Casilla.Destino)
                    sonidos.get("click").play();
            }
            else
                sonidos.get('error').play();
        }

        //O estar libre para desplazarnos
        else
        {
            movimientos.push(new Movimiento(tab.jugX,  tab.jugY, newPos.x, newPos.y));

            //Movemos al jugador
            MueveJugador(newPos);
            movido = true;
        }
    }
    else
        sonidos.get('error').play();

    return movido;
}


//9. COMPRUEBA SI LA PARTIDA HA TERMINADO
function Terminado(tab)
{
    //Suponemos terminado a true
    let terminado = true;
    let i = 0;

    //Si encuentra una posición destino sin cajas encima, pone terminado a false y sale de los bucles
    while (i < tab.fijas.length && terminado)
    {
        let j = 0;
        while (j < tab.fijas[0].length && terminado)
        {
            if (tab.fijas[i][j] === Casilla.Destino && tab.cajas[i][j] === false)
                terminado = false;
            j++;
        }
        i++;
    }
    return terminado;
}

function SiguienteNivel(){
    console.log("Siguiente nivel");
    console.log(game.scene);

    game.scene.scenes[0].registry.destroy(); // destroy registry
    game.scene.scenes[0].events.off();// disable all active events
    game.scene.scenes[0].scene.restart();
}

//-------------------------Callbacks----------------------//

function onKeyDown(event){
    if(gameOver) { return; }

    let dir = '';
    if(event.key === "ArrowRight"){
        dir = 'r';
    }
    else if(event.key === "ArrowLeft"){
        dir = 'l';
    }
    else if(event.key === "ArrowDown"){
        dir = 'd';
    }
    else if(event.key === "ArrowUp"){
        dir = 'u';
    }
    else if(event.key === "Backspace"){
        dir ='z';
    }
    else return;

    // Deshacer movimiento
    if(dir === 'z'){
        if(contador > 0){
            let ultimoMov = movimientos[movimientos.length - 1];
            MueveJugador({ x: ultimoMov.x, y: ultimoMov.y});
            if(ultimoMov.mueve){
                dir = { x: ultimoMov.nx - ultimoMov.x, y: ultimoMov.ny - ultimoMov.y };
                MueveCaja({ x: ultimoMov.nx + dir.x, y: ultimoMov.ny + dir.y }, { x: ultimoMov.nx, y: ultimoMov.ny });
            }
            movimientos.pop();
            contador--;
            scoreText.setText('Movimientos: ' + contador);
        }
    }
    // Mover al personaje
    else if(Mueve(tab, dir)){
        contador++;
        scoreText.setText('Movimientos: ' + contador);
        if(Terminado(tab)){ //Comprobamos si el jugador ha ganado
            gameOver = true;
            musica.stop();
            sonidos.get('fanfare').play();
            // Actualizar top puntuaciones
            ActualizaTop(contador, 2, 'sokoban', menorQue);
            console.log("Ganaste en " + contador);
            // Pasar al siguiente nivel
            setTimeout(SiguienteNivel, 3500);
        } 
    }
}


/*
class MainClass
	{

		//2.MÉTODO PRINCIPAL 
		public static void Main(string[] args)
		{
			//Bucle principal del juego:
			while (true)
			{
				//Establecemos lo necesario para empezar un nuevo nivel
				int contador = 0;
				bool terminado = false; //Indica si la partida ha terminado
				bool movido = false; //Indica si nos movimos en el turno anterior
				char dir = ' ';
				Console.Clear();

				//Pide el nivel al jugador
				Tablero tab = PideNivel();

				//Creamos una copia del tablero para poder deshacer movimientos
				Tablero copia;
				CreaTableroVacío(out copia);

				//Lo dibujamos una vez
				DibujaTablero(tab, contador);

				//Mientras el jugador no haya ganado o quiera volver al menú:
				while (!terminado && dir != 'm')
				{
					dir = LeeEntrada(); //Leemos la entrada
					Console.SetCursorPosition(0, tab.fils + 4); //Para que no podamos escribir cosas

					//Si no se pulsa ninguna tecla, no se hace nada
					if (dir != ' ')
					{
						//Podemos deshacer movimiento...
						if (dir == 'z')
						{
							//Si no deshicimos en el turno anterior, llevamos más de un turno y nos movimos:
							if  (contador > 0 && movido)
							{
								CopiaTablero(copia, ref tab);
								contador--;
								DibujaTablero(tab, contador);
								movido = false;
							}
						}

						//...o movernos
						else
						{
							//Hacemos la copia del tablero
							CopiaTablero(tab, ref copia); 
							//Modificamos el tablero
							movido = Mueve(ref tab, dir);

							//Si el jugador se ha movido:
							if (movido)
							{
								contador++; //Incrementamos el contador
								DibujaTablero(tab, contador); //Dibujamos el tablero
								terminado = Terminado(tab); //Comprobamos si el jugador ha ganado
							}
						}
					}
				}

				if (terminado)
				{
					Console.ForegroundColor = ConsoleColor.DarkYellow;
					Console.Write("\n"+"¡Ganaste! ");
					Console.ForegroundColor = ConsoleColor.White;
					Console.Write("Movimientos usados: " + contador + "\n" + "Pulsa cualquier tecla para volver al menú ");

					//Para volver al inicio del bucle, el usuario debe pulsar una tecla
					string tecla = " ";
					while (tecla == " ")
					{
						tecla = Console.ReadKey().Key.ToString();
					}
				}
			}
		}

		//6.RECOGIDA DEL INPUT DEL USUARIO
		static char LeeEntrada()
		{
			char dir = ' ';
			if (Console.KeyAvailable)
			{
				//Codificamos la dirección en la que va el jugador
				string tecla = Console.ReadKey().Key.ToString();

				if (tecla == "UpArrow")
					dir = 'u';
				else if (tecla == "DownArrow")
					dir = 'd';
				else if (tecla == "LeftArrow")
					dir = 'l';
				else if (tecla == "RightArrow")
					dir = 'r';
				else if (tecla == "M") //Volver al menú
					dir = 'm';
				else if (tecla == "D") //Deshacer
					dir = 'z'; //La "d" ya está pillada
			}
			return (dir);
		}


		//10.MÉTODO PARA PEDIR NIVEL AL JUGADOR
		static Tablero PideNivel()
		{
			//Pedimos al jugador que elija el nivel
			Console.Write("Elija un nivel (0 - 50): ");
			int nivel = int.Parse(Console.ReadLine());

			//Leemos el nivel
			Console.Clear();
			Tablero tab = LeeNivel("Niveles.txt", nivel);

			return (tab);
		}

		//11.MÉTODO PARA ALMACENAR LA INFORMACIÓN NO FIJA DEL TABLERO ACTUAL
		static void CopiaTablero(Tablero tab, ref Tablero copia) 
		{
			//Copiamos la posición del jugador
			copia.jugX = tab.jugX;
			copia.jugY = tab.jugY;

			//Y la posición de de las cajas
			for (int i = 0; i < tab.cajas.GetLength(0); i++) 
				for (int j = 0; j < tab.cajas.GetLength(1); j++) 
				{
					if (tab.cajas[i][j] == true)
						copia.cajas[i][j] = true;
					else
						copia.cajas[i][j] = false;
				}
		}
	}

    */