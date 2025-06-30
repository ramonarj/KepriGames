'use strict';

//1.CLASE EMISOR DE SONIDOS (Ladrillos dorados) -> pueden emitir sonido
export function SoundSource(scene, position, sprite, sound)
{
    Phaser.GameObjects.Sprite.apply(this, [scene,position._x, position._y, sprite]);
    this._sound = sound;
}

SoundSource.prototype = Object.create(Phaser.GameObjects.Sprite.prototype);
SoundSource.prototype.constructor = SoundSource;

//Funciones de destruible
SoundSource.prototype.playSound = function () 
{
    //Suena el sonido
}

//Funciones de destruible
SoundSource.prototype.playAnimation = function () 
{
    this.animations.play('shine', 15, false);
}

//Estructura auxiliares : PAR
export function Par(x, y)
{
    this._x=x;
    this._y=y;
}