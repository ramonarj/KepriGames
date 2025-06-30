'use strict'

import { MARGEN, TEXT_SIZE } from './HUD.js';
var CREDITS_SIZE = TEXT_SIZE;
var NUM_CHOICES = 3;
var CHOICES_SEPARATION = 50;
var CREDITS_NAMES = "Raul Guardia Fernandez\n\n\n\n\n\n\n\n\nRamon Arjona Quiniones\n\n\n\n\n\n\n\n\nBoth"
var CREDITS_TEXT = "\n\n  - Player logic\n  - PowerUps logic\n  - 2 Player Mode\n  - File reading  \n  - Game sounds \n\n\n\n\n  - Ball logic\n  - Enemies logic\n  - HUD & Menu  \n  - Level dynamics\n  - Menu music \n\n\n\n\n  - Animations\n  - Level building\n  - Collisions\n  - Heritage architecture\n  - And many more spaghetti code!"
var CONTROLS_TEXT = "          Move - - \n\nThrow - -            Select - -"
var CONTROLS1 = "                   ARROW KEYS [P1]\n\n          SPACE                  ENTER"
var CONTROLS2 = "                   A / D [P2]\n\n          SPACE                  ENTER"
export var Menu = 
{
    create: function()
    {
        console.log("Create Menu");
        this.contador = 0;

        // Input; debería haber una mejor forma de hacer esto
        this.input.keyboard.on('keydown', onKeyDown, this);

        //Música
        this.music = this.sound.add('remix');
        this.music.loop = true;
        this.music.play();
        this.music.volume = 0.8;


        //Fondo y selector
        this.eleccion=1;
        this.credits = false;
        this.fondoMenu = this.add.image(0, 0, 'menu').setOrigin(0,0);
        //this.game.world.addChild(this.fondoMenu);
        this.selector = this.add.image(275, 320 , 'cursor').setOrigin(0,0);
        //this.game.world.addChild(this.selector);
        this.selectSound = this.sound.add('seleccion').setVolume(0.25);

        var highscore = 50000;//PlayScene.getScore(1);
        this.highScoreText = this.add.bitmapText(this.game.config.width / 2, MARGEN, 'redFont','HIGH SCORE', TEXT_SIZE);
        this.highScoreNoText = this.add.bitmapText(this.game.config.width / 2, MARGEN + (this.highScoreText.height + MARGEN), 'whiteFont', '  ' + highscore , TEXT_SIZE);
        this.backText = this.add.bitmapText(MARGEN, this.game.config.height - MARGEN*3, 'whiteFont','Press Esc to go back to menu', CREDITS_SIZE);
        this.creditsText = this.add.bitmapText(MARGEN * 2, MARGEN * 2, 'whiteFont',CREDITS_TEXT, CREDITS_SIZE);
        this.creditsNames = this.add.bitmapText(MARGEN * 2, MARGEN * 2, 'redFont',CREDITS_NAMES, CREDITS_SIZE);
        this.controlsText = this.add.bitmapText(MARGEN * 2, this.game.config.height - MARGEN*7, 'whiteFont',CONTROLS_TEXT, TEXT_SIZE);
        this.controlsTextRed = this.add.bitmapText(this.controlsText.x, this.controlsText.y, 'redFont',CONTROLS1, TEXT_SIZE);
        this.backText.visible = this.creditsText.visible = this.creditsNames.visible = false;
    },

    update:function(time, delta)
    {
        this.contador+= delta;
        if(this.contador > 1500)
        {
            if(this.controlsTextRed.text == CONTROLS1) this.controlsTextRed.text = CONTROLS2;
            else this.controlsTextRed.text = CONTROLS1;
            this.contador = 0;
        }
    },
  
    //-----------------------------Callbacks------------------------//

    moveUp:function()
    {
        if(this.eleccion > 1 && !this.credits)
        {
            this.selector.y-=CHOICES_SEPARATION;
            this.eleccion--;
            this.selectSound.play();
        }
    },
      moveDown:function()
    {
        if(this.eleccion < NUM_CHOICES && !this.credits)
        {
            this.selector.y+=CHOICES_SEPARATION;
            this.eleccion++;
            this.selectSound.play();
        }
    },
    processEnterKey:function()
    {
        if(!Menu.credits)
        {
            //console.log(this.game.scene.getScene('menu'));
            let sceneMan = this.game.scene;
            this.selectSound.play();
            //Modo 1 jugador
            if(this.eleccion == 1)
            {
                console.log("Cambio escena");
                this.music.stop();
                sceneMan.getScene('carga')._2player = false;
                sceneMan.start('carga');//, true, false);
                sceneMan.stop('menu');
            }
        
            //Modo 2 jugadores
            else if(this.eleccion == 2) 
            {
                console.log("Cambio escena");
                this.music.stop();
                sceneMan.getScene('carga')._2player = true;
                sceneMan.start('carga');//, true, false);
            }

            //Créditos
            else if(this.eleccion == 3) 
            {
                this.credits = true;
                this.fondoMenu.visible =  this.highScoreText.visible = this.highScoreNoText.visible = false;
                this.selector.visible = this.controlsText.visible = this.controlsTextRed.visible = false;
                this.backText.visible = this.creditsText.visible = this.creditsNames.visible = true;
                
            }
        }  
    },

    processScapeKey:function()
    {
        if(this.credits)
        {
            this.selectSound.play();
            this.fondoMenu.visible =  this.highScoreText.visible = this.highScoreNoText.visible = true;
            this.selector.visible = this.controlsText.visible = this.controlsTextRed.visible = true;
            this.backText.visible = this.creditsText.visible = this.creditsNames.visible = false;
            this.credits = false;
        }  
    }
};


function onKeyDown(event){
    let dir = '';
    if(event.key === "Enter"){
        Menu.processEnterKey.apply(this);
    }
    else if(event.key === "ArrowUp"){
        Menu.moveUp.apply(this);
    }
    else if(event.key === "ArrowDown"){
        Menu.moveDown.apply(this);
    }
    else if(event.key === "Escape"){
        Menu.processScapeKey.apply(this);
    }
}