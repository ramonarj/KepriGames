'use strict'

import { Movable } from './Movable.js';
import { Destroyable } from './Destroyable.js';
import { Ball } from './Ball.js';

export var EXTRA_BALLS = 2;
export var POWERUP_POINTS = 1000;
export var POWERUP_COLORS = ['red', 'grey', 'blue', 'green', 'orange', 'lightblue', 'pink'];

//2.2.1.2.CLASE POWER-UP
export function PowerUp(game, position, sprite, sound, lives, velocity, effect, drop, powerUpNo)
{
    Movable.apply(this, [game, position, sprite, sound, lives, velocity, POWERUP_POINTS]);

   // Determina si el Power-Up es un efecto activo o no (pasando 'true' o 'false')
    this._effect = effect;

    // Determina si el drop de otros Power-Ups está activo mientras éste está aún cayendo
    this._dropEnabled = drop;
   console.log("dropeo");

   // Empezar a reproucir la animación
    this.anims.play('rotate-' + POWERUP_COLORS[powerUpNo]);
}

PowerUp.prototype = Object.create(Movable.prototype);
PowerUp.prototype.constructor = PowerUp;

PowerUp.prototype.update = function(delta)
{
    this.y += (this._velocity._y * delta / 1000);
    Movable.prototype.update.call(this);
}

//
PowerUp.prototype.takeDamage = function(playscene)
{
    this._dropEnabled = true;
    Destroyable.prototype.takeDamage.call(this, playscene);
    this.destroy();
}

// Devuelve si el Power-Up actual es un efecto activo o no
PowerUp.prototype.isEffect = function()
{
    return this._effect;
}

// 
PowerUp.prototype.dropEnabled = function()
{
    return this._dropEnabled;
}


// POWER-UPS

// 1) Power-Up rojo -> disparo
export function RedPowerUp(game, position, sprite, sound, lives, velocity, effect, drop, player)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 0]);

    this._player = player;
}

RedPowerUp.prototype = Object.create(PowerUp.prototype);
RedPowerUp.prototype.constructor = RedPowerUp;

RedPowerUp.prototype.enable = function(player)
{
    player.enableShot();
}

RedPowerUp.prototype.disable = function(player)
{
   player.disableEffects();
}

// 2) Power-Up gris -> ganar una vida
export function GreyPowerUp(game, position, sprite, sound, lives, velocity, effect, drop,  player)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 1]);

    this._player = player;
}

GreyPowerUp.prototype = Object.create(PowerUp.prototype);
GreyPowerUp.prototype.constructor = GreyPowerUp;

GreyPowerUp.prototype.enable = function(player)
{
    player.addLife();
}

// 3) Power-Up azul -> ensanchar la pala
export function BluePowerUp(game, position, sprite, sound, lives, velocity, effect, drop, player)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 2]);

    player = player;
}

BluePowerUp.prototype = Object.create(PowerUp.prototype);
BluePowerUp.prototype.constructor = BluePowerUp;

BluePowerUp.prototype.enable = function(player)
{
    player.getWider();
}

BluePowerUp.prototype.disable = function(player)
{
    player.disableEffects();
}

// 4) Power-Up verde -> atrapar la pelota
export function GreenPowerUp(game, position, sprite, sound, lives, velocity, effect, drop,  ballsGroup)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 3]);

    this._balls = ballsGroup;
}

GreenPowerUp.prototype = Object.create(PowerUp.prototype);
GreenPowerUp.prototype.constructor = GreenPowerUp;

GreenPowerUp.prototype.enable = function()
{
    // TODO hacer una función común
    this._balls.children.each(function(elem){
        console.log("Green: enable attach");
        elem.enableAttach();
    }, this);
}

GreenPowerUp.prototype.disable = function()
{
    this._balls.children.each(function(elem){
        elem.disableEffects();
    }, this);
}

// 5) Power-Up naranja -> decelerar la pelota
export function OrangePowerUp(game, position, sprite, sound, lives, velocity, effect, drop, ballsGroup)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 4]);

    this._balls = ballsGroup;
}

OrangePowerUp.prototype = Object.create(PowerUp.prototype);
OrangePowerUp.prototype.constructor = OrangePowerUp;

OrangePowerUp.prototype.enable = function()
{
    this._balls.children.each(function(elem){
        console.log("Orange: slow down");
        elem.slowDown();
    }, this);
    //this._balls.callAll('slowDown');
}
// *Caso excepcional* -> No desactiva nada como tal, pero sí sobreescribe otros efectos activos (como en el juego original)
OrangePowerUp.prototype.disable = function()
{
}

// 6) Power-Up azul claro -> triplicar la pelota
export function LightBluePowerUp(game, position, sprite, sound, lives, velocity, effect, drop, ballsGroup)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 5]);

    this._balls = ballsGroup;
    this._mainBall = this._balls.getFirstAlive();
}

LightBluePowerUp.prototype = Object.create(PowerUp.prototype);
LightBluePowerUp.prototype.constructor = LightBluePowerUp;

LightBluePowerUp.prototype.enable = function()
{
    var extraBall;
    var ballVel = this._mainBall.getVel();
    var dir = 1;
  
  //  var ballVel = new Par(BASE_VELOCITY * Math.cos(BASE_ANGLE), -BASE_VELOCITY *  Math.sin(BASE_ANGLE));
    this._balls.children.each(function(extraBall, mainBall)
    {
        if(!extraBall.active){
            extraBall.visible = true;
            extraBall.active = true;
            extraBall.setPosX (mainBall.getPosX());
            extraBall.setPosY (mainBall.getPosY());
            var ballAngle = this._mainBall.getAngle() + (Math.floor(Math.random() * (50 - 15))/100);
            ballAngle * dir;
            extraBall.body.velocity.setTo(ballVel*Math.cos(ballAngle), ballVel*Math.sin(ballAngle)); //Físicas de la pelota

            extraBall.body.bounce.setTo(1, 1); //ESTO SIRVE PARA HACER QUE ACELERE

            dir = -dir;
        }
    },this, this._mainBall)
}

LightBluePowerUp.prototype.disable = function()
{
     this._dropEnabled = true;
}

LightBluePowerUp.prototype.takeDamage = function(playscene)
{
    // Diferenciamos así cuando se destruye con la Deadzone o cuando se ha recogido por el jugador (y, por tanto, se ha activado)
    if(this._balls.children.size <= 1)
       this._dropEnabled = true;
     Destroyable.prototype.takeDamage.call(this, playscene);
     this.destroy();
}

// 7) Power-Up rosa ->abre la puerta al siguiente nivel
export function PinkPowerUp(game, position, sprite, sound, lives, velocity, effect, drop,  playScene)
{
    PowerUp.apply(this, [game, position, sprite, sound, lives, velocity, effect, drop, 6]);

    this._playScene = playScene;
}

PinkPowerUp.prototype = Object.create(PowerUp.prototype);
PinkPowerUp.prototype.constructor = PinkPowerUp;

PinkPowerUp.prototype.enable = function()
{
    this._playScene.openDoor();
}


//--------------Utilidades------------//