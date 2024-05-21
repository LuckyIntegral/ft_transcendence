class Loading {
    constructor () {
        this.canvas = document.getElementById ('canvas-ui')
        if (this.canvas === null) {
            console.error('Content is null')
            return
        }
        this.ctx = this.canvas.getContext('2d');
        this.bgImage = new Image();
        this.bgImage.src = 'static/images/tabletenis.jpg';
        this.loadBarWidth = GameConstants3D.LOADBAR_WIDTH;
        this.loadBarHeight = GameConstants3D.LOADBAR_HEIGHT;
        this.bgImage.onload = function() {
            console.log('Image loaded');
            this.drawLoadingScreen(0);
        }.bind(this);
    }

    drawLoadingScreen(loadProgress) {
        // Draw background image
        this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, 
            this.canvas.height);

        // Draw loading bar background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(
            (this.canvas.width - this.loadingBarWidth) / 2,
            (this.canvas.height - this.loadingBarHeight) / 2,
            this.loadingBarWidth,
            this.loadingBarHeight
        );
        // Draw loading bar progress
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(
            (this.canvas.width - this.loadingBarWidth) / 2,
            (this.canvas.height - this.loadingBarHeight) / 2,
            (this.loadingBarWidth * loadProgress) / 100,
            this.loadingBarHeight
        );
        // Draw loading text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            `Loading... ${loadProgress}%`,
            this.canvas.width / 2,
            this.canvas.height / 2 + this.loadingBarHeight + 20
        );
    }
}