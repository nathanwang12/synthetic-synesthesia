class CanvasManager {
  constructor(canvasElement, colorPalette, brushSizeSlider, brushOpacitySlider, resetButton) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.colorPalette = colorPalette;
    this.brushSizeSlider = brushSizeSlider;
    this.brushOpacitySlider = brushOpacitySlider;
    this.resetButton = resetButton;

    this.painting = false;

    this.brushColor = '#FFFFFF'
    this.brushSize = parseInt(this.brushSizeSlider.value);
    this.brushOpacity = parseInt(this.brushOpacitySlider);
    this.setupEvents();
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', () => {
      this.painting = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.painting = false;
      this.ctx.beginPath();
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (this.painting) {
        this.draw(event.offsetX, event.offsetY);
      }
    });

    this.colorPalette.querySelectorAll('.color-box').forEach((box) => {
      box.addEventListener('click', (event) => {
        this.brushColor = event.target.dataset.color;
        this.updateCursor();
      });
    });

    this.brushSizeSlider.addEventListener('input', (event) => {
      this.brushSize = parseInt(event.target.value);
    });

    this.brushOpacitySlider.addEventListener('input', (event) => {
      this.brushOpacity = parseInt(event.target.value);
    })

    this.resetButton.addEventListener('click', () => this.clearCanvas());
  }

  draw(x, y) {
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.brushColor || '#FFFFFF'; // Default to black if no color selected

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
