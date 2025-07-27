var config = {
    type: Phaser.AUTO,
    width: 640,
    height: 640, // no necesitamos físicas
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const TAM_CASILLA = 80;
var gameOver = false;
var fpsText;
var tablero = [];
var piezas = [];
var selected = null;
var sonidos; // diccionario
var sprSeleccion;
var movimientos = [];
var turno = false; //false = mueven blancas, true = negras

var game = new Phaser.Game(config);

var sprites = ['fichaNegra', 'fichaBlanca', 'damaNegra', 'damaBlanca', 'tablero', 'blanco'];
var nombresSonidos = ['comer', 'coronar'];
var sharedSonidos = ['seleccion', 'fanfare', 'error'];

//----------------------------------------|| Phaser ||------------------------------------------//
function preload ()
{
    // Imágenes
    for(let i = 0; i < sprites.length; i++)
        this.load.image(sprites[i], 'damas/assets/' + sprites[i] + '.png');

    // Sonidos propios
    for(let i = 0; i < nombresSonidos.length; i++)
        this.load.audio(nombresSonidos[i], 'damas/assets/' + nombresSonidos[i] + '.wav'); // se pueden indicar varias fuentes alternativas

    // Sonidos compartidos
    for(let i = 0; i < sharedSonidos.length; i++)
        this.load.audio(sharedSonidos[i], '_shared/audio/' + sharedSonidos[i] + '.wav');
}

function create ()
{
    // Tablero lógico
    for(let i = 0; i < 8; i++) {
        tablero[i] = new Array(8);
        for(let j = 0; j < 8; j++) {
            tablero[i][j] = null;
        }
    }

    // - - - - Sprites - - - - //
    this.add.image(320,320, 'tablero');
    sprSeleccion = this.add.image(0,0,'blanco').setScale(TAM_CASILLA);
    sprSeleccion.visible =  false;

    // - - - - Piezas - - - - //
    // Equipo negro
    creaEquipo(tablero, true, false, this);
    // Equipo blanco
    creaEquipo(tablero, false, true, this);

    //  Medidor FPS
    fpsText = this.add.text(450, 16, 'FPS', { fontSize: '32px', fill: '#000' });
    this.time.advancedTiming = true;

    // - - - Sonidos - - - //
    sonidos = new Map();
    for(let i = 0; i < nombresSonidos.length; i++){
        let s = this.sound.add(nombresSonidos[i]);
        sonidos.set(nombresSonidos[i], s);
    }
    for(let i = 0; i < sharedSonidos.length; i++){
        let s = this.sound.add(sharedSonidos[i]);
        sonidos.set(sharedSonidos[i], s);
    }

    // - - - - Callbacks para el ratón - - - - //
    this.input.on("pointerdown", mouseDown);
    this.input.on("pointerup", mouseUp);

    // Y la tecla de retroceso
    this.input.keyboard.on('keydown-BACKSPACE', deshacer);
}

function update ()
{
    if (gameOver) {
        return;
    }

    // FPS (Nota: está función destroza el rendimiento)
    fpsText.setText('FPS: ' + game.loop.actualFps);
}

//----------------------------------------|| Creación ||------------------------------------------//

function creaFicha(tablero, fil, col, negro, image, scene)
{
    var ficha = scene.add.image(0,0, image);

    ficha.fila = fil;
    ficha.columna = col;
    ficha.negro = negro;
    ficha.tipo = 'ficha';
    tablero[fil][col] = ficha;

    // Posición de Phaser
    ficha.setPosition(ficha.columna * TAM_CASILLA + TAM_CASILLA / 2, ficha.fila * TAM_CASILLA + TAM_CASILLA / 2);
    return ficha;
}

function creaDama(tablero, fil, col, negro, image, scene)
{
    var dama = creaFicha(tablero, fil, col, negro, image, scene);
    dama.tipo = 'dama';
    return dama;
}

function creaEquipo(tablero, negro, abajo, scene)
{
    let imagen = abajo ? 'fichaBlanca' : 'fichaNegra';
    let filaIni = abajo ? 5 : 0;
    for(let i = 0; i < 8; i++){
        for(let j = 0; j < 3; j++){
            if(i % 2 === (filaIni + j) % 2)
                piezas[piezas.length] = creaFicha(tablero, filaIni + j, i, negro, imagen, scene);
        }
    }
}

//----------------------------------------|| Lógica ||----------------------------------------------------//

//------------------ Estructuras -----------------------------//
function Casilla(fil, col) {
    this.fila = fil;
    this.columna = col;
}

function Movimiento(pieza, destino) {
    this.origen = new Casilla(pieza.fila, pieza.columna);
    this.origen.pieza = pieza; // añadimos dinámicamente cosas
    this.destino = new Casilla(destino.fila, destino.columna);
    this.destino.pieza = tablero[destino.fila][destino.columna];
}

//------------------ Movimientos y caminos -------------------//

/* Devuelve true si la casilla pertenece al tablero 8x8, false e.o.c. */
function dentroLimites(fil, col){
    return (fil >= 0 && fil < 8 && col >= 0 && col < 8);
}

/* Devuelve true si el movimiento es 'reglamentario', i.e., sigue las normas del ajedrez en función del tipo de pieza */
function movimientoReglamentario(pieza, newFila, newColumna)
{
     // Fuera del mapa no es legal //
    if(!dentroLimites(newFila, newColumna)) { return false; }

    // Quedarse en la misma casilla tampoco //
    if(pieza.fila === newFila && pieza.columna === newColumna) {return false; }

    let casDestino = tablero[newFila][newColumna];

    let legal = false;
    let origen = new Casilla(pieza.fila, pieza.columna);
    let destino = new Casilla(newFila, newColumna);
    switch(pieza.tipo)
    {
        case 'ficha':
        {
            let difColumna = Math.abs(pieza.columna - newColumna);
            // Mover normal
            if(difColumna === 1 && casDestino === null)
            {
                if((pieza.negro && destino.fila - pieza.fila === 1) ||  //peón negro
                (!pieza.negro && destino.fila - pieza.fila === -1)) //peón blanco
                    legal = true;
            }
            // Comer
            else if (difColumna === 2 && casDestino === null)
            {
                if((pieza.negro && destino.fila - pieza.fila === 2) ||  //peón negro
                (!pieza.negro && destino.fila - pieza.fila === -2)) //peón blanco
                {
                    // Hay pieza en medio->la comemos
                    let piezaEnMedio = tablero[pieza.fila + (destino.fila - pieza.fila) / 2][pieza.columna + (destino.columna - pieza.columna) / 2];
                    if(piezaEnMedio !== null && turno !== piezaEnMedio.negro)
                    {
                        piezaEnMedio.visible = false;
                        tablero[newFila][newColumna] = null;
                        sonidos.get('comer').play();
                        legal = true;
                    }
                }
            }
            break;
        }
        case 'dama':
        {
            // Movimiento diagonal y que no tenga piezas en medio
            if(movimientoDiagonal(pieza.columna, pieza.fila, newColumna, destino.fila)){ // && caminoLibre(origen, destino)){
                    legal = true;
            }
            break;
        }
        case 'rey':
        {
            // Movimiento normal
            if(Math.abs(newFila - pieza.fila) <= 1 && Math.abs(newColumna - pieza.columna) <= 1)
                legal = true;
            // Enroques: se puede hacer si:
            //  a) El rey no está en jaque
            //  b) Ni el rey ni la torre se han movido aún de su posición inicial
            //  c) No hay piezas entre medias de ambas que obstruyan el paso
            else if(!jaque && Math.abs(newFila - pieza.fila) == 0 && 
                caminoLibre(origen, destino)) // TODO mejorar (camino entre rey y torre directamente)
            {
                let fila = pieza.negro ? 0 : 7;
                let colTorre = -1;
                // Enroque corto
                if (newColumna - pieza.columna === 2 ) { colTorre = 7; }
                // Enroque largo
                else if (pieza.columna - newColumna === 2) { colTorre = 0; }

                if(colTorre !== -1 && tablero[fila][colTorre] !== null && 
                    tablero[fila][colTorre].tipo === "torre" ){
                        let origenTorre = new Casilla(fila, colTorre);
                        let destinoTorre = new Casilla(fila, (colTorre === 7) ? 5 : 3);
                        legal = caminoLibre(origenTorre, destinoTorre);
                }
            }
            break;
        }
        default:
            break;   
    }

    return legal;
}

/* Devuelve true si el movimiento es reglamentario y además no come a ninguna pieza aliada */
function movimientoLegal(pieza, newFila, newColumna)
{
    if(!movimientoReglamentario(pieza, newFila, newColumna)) { return false; }

    // No permitimos el fuego amigo
    let casDestino = tablero[newFila][newColumna];
    if(casDestino !== null && casDestino.negro === pieza.negro) { return false; }

    return true;
}

/* Devuelve true si hay un camino recto entre ambas casillas, false e.o.c. */
function movimientoRecto(origen, destino) {
    return (origen.fila === destino.fila || origen.columna === destino.columna);
}

/* Devuelve true si hay un camino diagonal entre ambas casillas, false e.o.c. */
function movimientoDiagonal(x, y, newX, newY){
    return (!movimientoRecto(new Casilla(y, x), new Casilla(newY, newX))
    && ((x - y) === (newX - newY) || (x + y) === (newX + newY))); // Diagonales dcha. e izda. respectivamente
}

/* Devuelve la lista de casillas en línea recta entre una origen y una destino, inclusive ambas */
function caminoEntre(origen, destino){
    let x = origen.columna; let y = origen.fila;
    let incrX = (destino.columna - x === 0) ? 0 : (destino.columna - x) / Math.abs(destino.columna - x);
    let incrY = (destino.fila - y === 0) ? 0 : (destino.fila - y) / Math.abs(destino.fila - y);

    let numPasos = 1 + Math.max(Math.abs(destino.fila - origen.fila), Math.abs(destino.columna - origen.columna));
    let i = 0;
    var camino = [];
    while(i < numPasos)
    {
        camino.push(new Casilla(y, x));
        x += incrX; y += incrY; // avanzar
        i++;
    }
    return camino;
}

/* Devuelve true si no hay piezas en el camino entre ambas casillas, false e.o.c. */
function caminoLibre(origen, destino) {
    let camino = caminoEntre(origen, destino);

    // Recorre el camino, excluyendo ambos extremos, y comprueba que no haya piezas en él.
    let k = 1; let libre = true;
    while(libre && k < camino.length - 1){
        libre = (tablero[camino[k].fila][camino[k].columna] === null);
        k++;
    }
    return libre;
}


/* Devuelve true si el peón puede coronar al tipo de pieza dado, false e.o.c. */
function coronable(nombre){
    return (nombre === "peon" || nombre === "ficha");
}

/* 'Corona' al peon, transformándolo en una reina */
function coronaFicha(ficha){ 
    sonidos.get('coronar').play();
    let imagen = ficha.negro ? 'damaNegra' : 'damaBlanca';
    return creaDama(tablero, ficha.fila, ficha.columna, ficha.negro, imagen, game.scene.scenes[0]);
}

/* Mueve la pieza a la casilla dada, y añade el movimiento a la pila */
function moveTo(pieza, newFila, newColumna)
{
    // Ver si comemos alguna pieza
    if(tablero[newFila][newColumna] !== null) {
        tablero[newFila][newColumna].visible = false;
        sonidos.get('comer').play();
    }

    // Si es un peón, gastamos el doble avance
    if(pieza.tipo === "ficha") { 
        pieza.movDoble = false; 
        // Vemos si podemos hacernos una nueva reina
        console.log(newFila);
        if((pieza.negro && newFila === 7) || (!pieza.negro && newFila == 0)){
            let aux = pieza;
            pieza = coronaFicha(aux);
            aux.destroy();
        }
    }

    // Registrar el movimiento hecho y añadirlo a la pila
    let nuevoMov = new Movimiento(pieza, new Casilla(newFila, newColumna));
    movimientos.push(nuevoMov); 

    // Quitarla de su anterior posición y ponerla en su nueva posición lógica
    tablero[pieza.fila][pieza.columna] = null;
    tablero[newFila][newColumna] = pieza;
    pieza.fila = newFila; pieza.columna = newColumna;

    // y física
    pieza.setPosition(newColumna * TAM_CASILLA + TAM_CASILLA / 2, newFila * TAM_CASILLA + TAM_CASILLA / 2);
}

//------------------ Selección de piezas -------------------//
/* Devuelve true si la pieza en la casilla dada se puede selecccionar, false e.o.c. */
function canSelect(fil, col) {
    // Si hay pieza y es del equipo al que le toca mover, se puede seleccionar
    return (tablero[fil][col] !== null && tablero[fil][col].negro === turno);
}

/* Selecciona la pieza que se encuentra en la casilla dada */
function select(fil, col){
    sonidos.get('seleccion').play();
    selected = tablero[fil][col];
    sprSeleccion.x = col * TAM_CASILLA + TAM_CASILLA / 2;
    sprSeleccion.y = fil * TAM_CASILLA + TAM_CASILLA / 2;
    sprSeleccion.visible = true;
}

/* Quita la selección de pieza actual */
function deselect(){
    if(selected != null){
        sprSeleccion.visible = false;
        selected = null;
    }
}

//------------------ Jaques -------------------//

/* Comprueba si un rey situado en { fil, col } estaría en jaque o no */
function hayJaquePriv(fil, col, negro, actualiza){
    // TODO: mejorar la complejidad de esto
    for(let i = 0; i < 8; i++){
        for(let j = 0; j < 8; j++){
            // Si hay una pieza enemiga que puede comer al rey, está en jaque
            if(tablero[i][j] !== null && tablero[i][j].negro !== negro && 
                    movimientoReglamentario(tablero[i][j], fil, col)){ 
                if(actualiza) { piezaJaque = tablero[i][j]; }
                return true;
            }
        }
    }
    return false;
}

/* Capa de cebolla para la función anterior */
function hayJaque(rey){
    return hayJaquePriv(rey.fila, rey.columna, rey.negro, true);
}

/* Devuelve 'true' si el rey dado está en jaque mate, 'false' e.o.c. */
function jaqueMate(rey){
    // 1) Ver si el rey puede salir del jaque él solo
    let mate = true;
    let i = -1;
    while(mate && i < 2) {
        let j = -1;
        while(mate && j < 2) {
            // ¿Tiene movimientos posibles que no le supongan jaque? Entonces no es mate.
            if(movimientoLegal(rey, rey.fila + i, rey.columna + j) && 
                !hayJaquePriv(rey.fila + i, rey.columna + j, rey.negro, false)){
                    console.log("No mate. El rey anda a " + (rey.fila + i) + ", " + (rey.columna + j));
                    mate = false;
            }
            j++;
        }
        i++;
    }
    if(!mate) { return mate; }

    // 2) Si no, ver si alguien se puede sacrificar por él (ponerse en medio del camino)
    let camino = caminoEntre({fila: rey.fila, columna: rey.columna}, {fila: piezaJaque.fila, columna: piezaJaque.columna});
    let k = 0; let n = camino.length;
    while(mate && k < n){
        let i = 0;
        while(mate && i < 8){
            let j = 0;
            while(mate && j < 8){
                let salvadora = tablero[i][j];
                // Tiene que ser del mismo equipo, que no sea el propio rey, y que pueda ponerse en medio
                if(salvadora !== null && salvadora.negro === rey.negro && salvadora.tipo != "rey" &&
                    movimientoLegal(salvadora, camino[k].fila, camino[k].columna)){
                        console.log("No mate. Pieza en " + salvadora.fila + ", " + salvadora.columna + " salva");
                        mate = false;
                    }
                j++;   
            }
            i++;
        }
        k++;
    }
    return mate;
}

//--------------------Callbacks------------------//
function mouseDown(pointer){
    // Botón izquierdo
    if(pointer.leftButtonDown()){
        //console.log("Botón izquierdo pulsado");
    }
}

function mouseUp(pointer){
    if(gameOver) { return; }

    // Botón izquierdo
    if(pointer.leftButtonReleased())
    { 
        //console.log("Botón izquierdo levantado");
        const fila = Math.floor(pointer.y / TAM_CASILLA);
        const columna = Math.floor(pointer.x / TAM_CASILLA);

        // 1) Ya había pieza seleccionada
        if(selected !== null)
        {
            // a) Seleccionar otra pieza del mismo equipo
            if(canSelect(fila, columna)){
                deselect();
                select(fila, columna);
            }
            // b) Mover la pieza al sitio
            else if(movimientoLegal(selected, fila, columna))
            {
                moveTo(selected, fila, columna);

                if(false){ // TODO: comprobar que se acabe el juego (todas las fichas comidas)
                        console.log("Jaque mate. Ganan " + (turno ? "negras" : "blancas"));
                        sonidos.get('fanfare').play();
                        gameOver = true;
                }

                // En cualquier caso, como hemos podido mover, deseleccionamos y avanzamos turno
                sonidos.get('seleccion').play();
                deselect();
                turno = !turno;
            }
            // c) No se pudo mover (selección errónea)
            else{
                sonidos.get('error').play();
            }
        }

        // 2) No la había -> seleccionamos una
        else if(canSelect(fila, columna)) {
            select(fila, columna);
        }
    }
}

/* Deshace el último movimiento hecho */
function deshacer(){
    if(movimientos.length < 1) { return; }

    let ultimoMov = movimientos[movimientos.length - 1];
    let piezaMovida = ultimoMov.origen.pieza;
    let piezaComida = ultimoMov.destino.pieza;

    // Cambio de posición lógica
    piezaMovida.fila = ultimoMov.origen.fila;
    piezaMovida.columna = ultimoMov.origen.columna;
    tablero[ultimoMov.origen.fila][ultimoMov.origen.columna] = piezaMovida;
    tablero[ultimoMov.destino.fila][ultimoMov.destino.columna] = piezaComida;
    // Resucitar a la pieza comida
    if(piezaComida !== null) { piezaComida.visible = true; }
    // Otorgar de nuevo el doble avance (a peones)
    if(piezaMovida.tipo === "peon" && piezaMovida.posicionInicial())
        piezaMovida.movDoble = true;
    // Cambiar el turno y deseleccionar lo que hubiera seleccionado
    turno = !turno;
    deselect();
    // Quitar el estado de gameover si es necesario
    gameOver = false;
    // Eliminar el último movimiento. TODO: hacer que sea una pila
    movimientos.pop();
    
    // Físicamente
    piezaMovida.setPosition(piezaMovida.columna * TAM_CASILLA + TAM_CASILLA / 2, 
        piezaMovida.fila * TAM_CASILLA + TAM_CASILLA / 2);
}
