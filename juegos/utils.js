// Ramón Arjona Quiñones, 2025
export async function getGlobalHighscores(nombreJuego){
    // Por defecto es de tipo GET
    const req = new Request(nombreJuego + '/hiscore.json');
    const resp = await fetch(req);
    const scores = await resp.text();

    return scores;
}

export function mayorQue(a, b) {
  return b-a;
}

export function menorQue(a, b) {
  return a-b;
}

/* Manda la puntuación al servidor para que la almacene si es mejor que las ya almacenadas. 
 * Reutilizable para cualquier juego que use puntuaciones numéricas */
export async function ActualizaTop(score, topSize, gameName, comparador){
    // 1) Comprobar si la puntuación debe entrar en el top
    // Las 'topSize' mejores puntuaciones, ordenadas según 'sortOrder'
    const maximas = JSON.parse(await getGlobalHighscores(gameName));

    //console.log(comparador(score, maximas[1][topSize - 1]));
    // El jugador no es digno de estar en la tabla (hay puntuaciones mejores)
    if(maximas[0].length > (topSize - 1) && comparador(score, maximas[1][topSize - 1]) >= 0){ // damos prioridad al récord nuevo? Cambiar >= por >
        console.log("No eres digno");
        return;
    }

    // 2) Preguntarle el nombre
    let nombre = prompt(`¡Enhorabuena! Has entrado en el top ${topSize}\nIntroduce tu nombre`);
    if(nombre === ''){
        nombre = '???';  
    }
    else if (nombre === null){ return; } // botón de cancelar pulsado

    // 3) Introducir la puntuación y el nombre en sus respectivas listas, y en la posición correcta
    maximas[1].push(score);
    maximas[1].sort(comparador);
    let ind = maximas[1].indexOf(score);
    maximas[0].splice(ind, 0, nombre);

    // Quitar los que ya no sean dignos
    if(maximas[0].length > topSize){
        maximas[0].pop();
        maximas[1].pop();
    }

    // Petición 
    const data = JSON.stringify(maximas);
    const myRequest = new Request('/' + gameName, {
        method: "PUT",
        body: data
    });
    const response = await fetch(myRequest);
    console.log("Server responde: " + await response.text());

    //window.location.reload(); // para que se vea el cambio de puntuación
}

export function HolaQueTal(){
    console.log("Hola, ¿y tú?");
}

export function muteGame(){
    //console.log("Muteadisimo el " + gameName);
    game.sound.mute = !game.sound.mute;
}

export function loadFile(path){
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", path, false); // false -> síncrono
    xmlhttp.send();
    if(xmlhttp.status === 200)
        result = xmlhttp.responseText;
    return result;
}