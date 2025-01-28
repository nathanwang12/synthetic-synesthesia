class CanvasManager {
  constructor(canvasElement, brushColor, clearButton) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.brushColor = brushColor;
    this.clearButton = clearButton;

    this.painting = false;
    this.onPixelChange = null;
    this.lastImageData = null;

    this.setupEvents();
    this.storeInitialImageData();
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', () => {
      this.painting = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.painting = false;
      this.ctx.beginPath(); // Reset the path
      this.checkPixelChanges();
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (this.painting) {
        this.draw(event.offsetX, event.offsetY);
      }
    });

    this.clearButton.addEventListener('click', () => this.clearCanvas());
  }

  draw(x, y) {
    this.ctx.lineWidth = 20;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.brushColor || '#000000'; // Default to black if no color selected

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.storeInitialImageData();
  }

  getPixelData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
  }

  storeInitialImageData() {
    this.lastImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
  }

  checkPixelChanges() {
    const currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

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
