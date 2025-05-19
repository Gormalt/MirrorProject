//The Block class, remembers position and color
class Block {
    constructor(NColor, position) {
        this.color = NColor;
        this.x = position.x;
        this.y = position.y;
        this.id = Math.random();
    }
    
    draw(x=0, y=0, context=0) {
        //draw the block here
        const width = canvas[0].width;
        const height = canvas[context].height;

        const drawx = (this.x)*(width/config.game.blocksPerRow) + x;
        const drawy = height - (this.y+1)*(width/config.game.blocksPerRow) + y;
        const sideLen = (width/config.game.blocksPerRow);
        
        ctx[context].drawImage(Img[this.color], drawx, drawy, sideLen, sideLen);
    }
}

//Preparing a list of all blocks to keep track of.
Block.list = {};

//The p2 Indicator
Block.indicator = new Block(
    config.game.p2Indicator.color, 
    {
        x: config.game.p2Indicator.startX, 
        y: config.game.p2Indicator.startY
    }
);
