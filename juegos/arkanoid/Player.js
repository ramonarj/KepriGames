'use strict'

import { Movable } from './Movable.js';

var PLAYER_VEL = 300;

export function Player(scene, position, sprite, sound, lives, velocity, cursors, playerWeapon, leftLimit, rightLimit, ballsGroup, sceneSobra, player2)
{
    Movable.apply(this, [scene, position, sprite, sound, lives, velocity]);

    // Constantes
    this._originalSize = this.width;

    this.setOrigin(0.5, 0); //Ancla del jugador

    this._vel = velocity._x;
    this._cursors = cursors;
    scene.input.keyboard.on('keydown-SPACE', this.fire, this);
    this._playerWeapon = playerWeapon;
    //this._playerWeapon.trackSprite(this, 0, 0); TODO
    this._leftLimit = leftLimit;
    this._rightLimit = rightLimit;

    this._balls = ballsGroup;
    this._currentBall;
    this._scene = scene;

    // Variables de control
    this._shotEnabled = false;
    this._isWide = false;
    this._player2 = player2;
}

Player.prototype = Object.create(Movable.prototype);
Player.prototype.constructor = Player;

//Funciones de jugador
Player.prototype.readInput = function(deltaTime) 
{
    if(!this._player2){
        this._currentBall = this._balls.getFirstAlive();
    }
    var delta = this.x;
    //Comprobación de cursores de Phaser
    if (this._cursors.left.isDown && this.x >  this._leftLimit + (this.displayWidth / 2)){ // + this.offsetX){
        this.x -= this._vel * PLAYER_VEL * (deltaTime / 1000);
    }
    
    else if (this._cursors.right.isDown && this.x < this._rightLimit - (this.displayWidth / 2)){// - this.offsetX)
        this.x += this._vel * PLAYER_VEL * (deltaTime / 1000);
    }

    /*
    if(this._fireButton.isDown)
    {
        // fire();
    }
    */

    //La pelota es hija por programación
    delta -= this.x;
    if(this._currentBall != null && this._currentBall.isAttached())
        this._currentBall.x -= delta;
}

Player.prototype.update = function(delta) //Update
{
   this.readInput(delta);
}

Player.prototype.getAnchor = function (i)
{
    if(i === 0)
       return this.anchor.x;
    else
       return this.anchor.y;   
}

// Desactiva el efecto activo en función de cúal sea éste en el momento
Player.prototype.disableEffects = function () 
{  
    if(this._isWide)
    {
      this._isWide = false;
      this.getNarrow();
    }
    else if(this._shotEnabled)
    {
        this._shotEnabled = false;
        this.setFrame(0);
    } 
}

// FUNCIONES AUXILIARES

// Activa el disparo del jugador
Player.prototype.enableShot = function ()
{   
   this._shotEnabled = true;
   this.setFrame(1);
}

// Ensancha la pala del jugador (solo si no lo estuviera ya)
Player.prototype.getWider = function ()
{   
    if(!this._isWide)
    {
      this._isWide = true;
      this.displayWidth *= 1.5;

      this._sound[1].play();
    }
}

// Estrecha la pala del jugador
Player.prototype.getNarrow = function ()
{   
    this.displayWidth /= 1.5;
}

Player.prototype.addLife = function()
{
    this._scene.addLife();
    this._sound[2].play();
}

Player.prototype.fire = function()
{
    if(this._shotEnabled)
    {
        this._playerWeapon.fire();
        this._playerWeapon.onFire.add(function() {this._sound[0].play()}, this);
    }
    else if(this._currentBall != null && this._currentBall.isAttached()){
        this._currentBall.throw();
    }
}