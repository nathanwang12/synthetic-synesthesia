class CanvasManager {
    constructor(canvasElement, colorPalatte, resetButton) {
      this.canvas = canvasElement;
      this.ctx = this.canvas.getContext('2d');
      this.colorPalatte = colorPalatte;
      this.resetButton = resetButton;

      this.painting = false;
      this.onPixelChange = null;

      this.lastImageData = null;

      this.setupEvents();
      this.storeInitialImageData();
    }

    setupEvents() {
      this.canvas.addEventListener('mousedown', () => (this.painting = true));
      this.canvas.addEventListener('mouseup', () => {
        this.painting = false;
        this.ctx.beginPath();
        this.checkPixelChanges();
      });
      this.canvas.addEventListener('mousemove', (e) => this.draw(e));
      this.resetButton.addEventListener('click', () => this.clearCanvas());
    }

    draw(event) {
      if (!this.painting) return;

      this.ctx.lineWidth = 5;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = this.colorPalatte.value;

      this.ctx.lineTo(event.offsetX, event.offsetY);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(event.offsetX, event.offsetY);
    }

    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.storeInitialImageData();
    }

    getPixelData() {
      return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }

    getColorAtPixel(x, y) {
      const imageData = this.ctx.getImageData(x, y, 1, 1).data;
      return `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${imageData[3] / 255})`;
    }

    storeInitialImageData() {
      this.lastImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }

    checkPixelChanges() {
      const currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

      // Compare with the last stored image data
      for (let i = 0; i < currentImageData.length; i += 4) {
        const lastPixel = this.lastImageData.slice(i, i + 4);
        const currentPixel = currentImageData.slice(i, i + 4);

        if (!this.pixelsEqual(lastPixel, currentPixel)) {
          const x = (i / 4) % this.canvas.width;
          const y = Math.floor(i / 4 / this.canvas.width);

          if (this.onPixelChange) {
            const color = `rgba(${currentPixel[0]}, ${currentPixel[1]}, ${currentPixel[2]}, ${currentPixel[3] / 255})`;
            this.onPixelChange(x, y, color);
          }
        }
      }

      // Update the last image data
      this.lastImageData = currentImageData.slice();
    }

    pixelsEqual(pixelA, pixelB) {
      return (
        pixelA[0] === pixelB[0] &&
        pixelA[1] === pixelB[1] &&
        pixelA[2] === pixelB[2] &&
        pixelA[3] === pixelB[3]
      );
    }
  }
