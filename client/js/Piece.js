//The Piece class, holds a list of all blocks.
class Piece {
    constructor(data) {
        this.blocks = data.blockList;
        this.color = data.color;
    }

    draw(x=0, y=0, cont=0) {
        for(var i in this.blocks) {
            this.blocks[i].draw(x, y, cont);
        }
    }
    
    move(dir) {
        for(var i in this.blocks) {
            const block = this.blocks[i];
           
            if(dir == 'left') {
                block.x--;
            }
            else if(dir == 'right') {
                block.x++;
            }
            else if(dir == 'down') {
                block.y--;
            }
            else if(dir == 'up') {
                block.y++;
            }
        }
    }
}

//Preparing a 'piece' object to hold all the piece data.
Piece.active = new Piece({blockList:{}});
