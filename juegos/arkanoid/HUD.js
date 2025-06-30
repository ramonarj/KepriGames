'use strict'

import { SoundSource } from './SoundSource.js';

//Para los sprites de las vidas
var MAX_SPRITES = 6;
var NUM_ROWS = 2;
var NUM_COLS = 3;

//Más constantes
export var GATES_POSY = 20;
export var TEXT_SIZE = 20;
export var MARGEN = 10; //Margen con la pantalla
export var DEFAULT_HIGHSCORE = 50000;
var ROUND_POSY = 500;
var NUMBERS_OFFSET = 15;

var BACKGROUND_X = 123;
var DIFFERENT_BACKGROUNDS = 4;

//2.1.CLASE HUD (Hud)
export function HUD(game, position, sprite, sound, livesNo, level)
{
  SoundSource.apply(this, [game, position, sprite, sound]);
  this._initialPos = position;

   //1.Fondo(s)
   this._background = game.add.image(BACKGROUND_X, GATES_POSY, 'fondos').setOrigin(0,0);
   var backgroundImageNo = (DIFFERENT_BACKGROUNDS + level - 1) % DIFFERENT_BACKGROUNDS;
   this._background.setFrame(backgroundImageNo);
   //this.game.world.addChild(this._background);xxx

   this._blackBackground = game.add.image(0, 0, 'black');
   this._blackBackground.visible = false;
   //this.game.world.addChild(this._blackBackground);
  
  //2.Textos
  //2.1.Letras
  this._scoreText = game.add.bitmapText(position._x + NUMBERS_OFFSET, position._y - 165, 'redFont','1UP', TEXT_SIZE);
  this._highScoreText = game.add.bitmapText(position._x + NUMBERS_OFFSET, position._y - 250, 'redFont','HIGH\n SCORE', TEXT_SIZE);
  this._roundText = game.add.bitmapText(position._x + NUMBERS_OFFSET, ROUND_POSY, 'redFont','ROUND', TEXT_SIZE);

  //2.2.Números   
  this._scoreNoText = game.add.bitmapText(this._scoreText.x + NUMBERS_OFFSET, this._scoreText.y + this._scoreText.height * 1.5, 'whiteFont',0, TEXT_SIZE); 
  this._highScoreNoText = game.add.bitmapText(this._scoreText.x + NUMBERS_OFFSET, this._highScoreText.y + this._highScoreText.height * 1.5, 'whiteFont', DEFAULT_HIGHSCORE, TEXT_SIZE); 
  this._roundNoText = game.add.bitmapText(this._roundText.x + NUMBERS_OFFSET, this._roundText.y + this._roundText.height * 1.5, 'whiteFont',0, TEXT_SIZE); 

  //3.Vidas
  this._actualLives = livesNo;
  this._livesSprites = [];
  var cont=0;
  for(var i=0; i<NUM_ROWS; i++)
  {
    for(var j=0; j<MAX_SPRITES/NUM_ROWS; j++)
    {
      this._livesSprites[cont] = game.add.image(position._x + j * this.width+10, position._y + i * 20, "vidas").setOrigin(0);
      if(cont >= this._actualLives)
         this._livesSprites[cont].visible = false;
      cont++;
    }
  }
}

HUD.prototype = Object.create(SoundSource.prototype);
HUD.prototype.constructor = HUD;


HUD.prototype.addLife = function() 
{
   if(this._actualLives < MAX_SPRITES)
      this._livesSprites[this._actualLives].visible = true; // TODO
   this._actualLives++;
}

HUD.prototype.takeLife = function() 
{
   if(this._actualLives > 0)
      this._livesSprites[this._actualLives - 1].visible = false;
   this._actualLives--;

   this._blackBackground.visible = true;
}

HUD.prototype.renderScore = function(score, highscore)
{
  this._scoreNoText.text = score;
  if(score > highscore)
      this._highScoreNoText.text = score;
  else
      this._highScoreNoText.text = highscore;
}

HUD.prototype.renderRound = function(round)
{
  this._roundNoText.text = round;
}