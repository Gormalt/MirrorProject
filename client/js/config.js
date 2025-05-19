const config = {
    colors:{
        activeButtonColor: '#AAAAAA',
        inactiveButtonColor: '#333333'
    },

    canvas:{
        width:1080,
        height:1920,
        baseColor: 'black'
    },

    game:{
        blocksPerRow:12,
        p2Indicator:{
            color: 7,
            startX: 4,
            startY: 20
        },
        nextPieceDraw:{
            x:25,
            y:-25
        },
        blockStartingY:32,

        reloadInterval:500000
    },

    context:{
        score:{
            lineWidth:5,
            strokeStyle:'white',
            font:"56px Courier New",
            fillStyle: 'white',
            textWidth: 15,
            textHeight: 40,
            containerWidth: 200,
            containerHeight:100,
            textRight: 90,
            charWidth: 15,
            textTop: 85
        },
        next:{
            lineWidth:5,
            strokeStyle:'white',
            font:"70px Courier New",
            fillStyle: 'white',     
            textLeft: 115,
            textTop: 50
        },
        hold:{
            lineWidth:5,
            strokeStyle:'white',
            font:"70px Courier New",
            fillStyle: 'white',     
            textLeft: 115,
            textTop: 50,
            clearStyle: 'black',
            boxWidth:400,
            boxHeight:400,
        },
        canvas:{
            fillStyle:'white',
            font:"160px Courier New",
            gameOverText:"Game Over",
            gameOverTextX: 110,
        }
    },

    // Block colors and image paths
    blocks: {
        images: [
            '/client/img/Redblock.png',    // 0
            '/client/img/Orangeblock.png', // 1
            '/client/img/Purpleblock.png', // 2
            '/client/img/Brownblock.png',  // 3
            '/client/img/Cyanblock.png',   // 4
            '/client/img/Greenblock.png',  // 5
            '/client/img/Blueblock.png',   // 6
            '/client/img/Selector.png'     // 7
        ]
    }
};
