'use strict'

import { Par } from './SoundSource.js';
import { HUD, TEXT_SIZE, DEFAULT_HIGHSCORE, MARGEN } from './HUD.js';

var DELAY_TIME = 1500; //1 segundo y medio

export var Carga = 
{
    temporizador:null,
    hud:null,
    background:null,
    _2player: false,
    _scene: null,

    create: function()
    {
        this.introSound = this.sound.add('intro').setVolume(0.5);
        this.introSound.play();

        var level, score, highscore;
        //Venimos del menú
        if(this._scene == null)
        {
            level = 1;
            score = 0;
            highscore = DEFAULT_HIGHSCORE;

        }
        //Venimos de un nivel
        else
        {
            level = this._scene.getLevel();
            score = this._scene.getScore(0);
            highscore = this._scene.getScore(1);
        }

        this.temporizador = 0;
        this.background = this.add.sprite(0,0,'black');
        //new Phaser.Sprite(this.game, 0, 0, 'black'); //Creamos
        //this.game.world.addChild(this.background);

        let roundText = this.add.bitmapText(this.game.config.width / 2, this.game.config.height / 2, 'whiteFont','ROUND ' + level, TEXT_SIZE);
        roundText.x -= roundText.width / 2;

        let scoreText = this.add.bitmapText(this.game.config.width / 4, MARGEN, 'redFont','SCORE', TEXT_SIZE);
        this.add.bitmapText(this.game.config.width / 4, MARGEN + (scoreText.height + MARGEN), 'whiteFont', '  ' + score , TEXT_SIZE);
        let highScoreText = this.add.bitmapText(this.game.config.width / 2, MARGEN, 'redFont','HIGH SCORE', TEXT_SIZE);
        this.add.bitmapText(this.game.config.width / 2, MARGEN + (highScoreText.height + MARGEN), 'whiteFont', '  ' + highscore , TEXT_SIZE);
    },

    update:function(time, delta)
    {
        this.temporizador += delta;
        if(this.temporizador > DELAY_TIME)
        {
            if(!this._2player){
                console.log("Fin espera");
                this.scene.start('1player');
                //this.scene.remove('carga');
            }
            else{
                this.scene.start('2player');
            }
        }
    },
};