var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var gameOver = false;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('fondo', 'pacman/assets/pacman-thumb.png');
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'fondo');
}

function update ()
{
    if (gameOver) {
        return;
    }
}