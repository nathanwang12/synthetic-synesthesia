class CanvasManager {
  constructor(canvasElement, colorPalette, brushSizeSlider, clearButton) {
      this.canvas = canvasElement;
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;

      this.ctx = this.canvas.getContext('2d');
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';

      this.colorPalette = colorPalette;
      this.brushSizeSlider = brushSizeSlider;
      this.clearButton = clearButton;
      this.painting = false;

      this.brush = {
          color: '#FFFFFF',
          size: parseInt(this.brushSizeSlider.value)
      }

      this.setupEvents();
  }

  setupEvents() {
      this.canvas.addEventListener("mousedown", (e) => {
          this.startPainting(e);
      });

      this.canvas.addEventListener("mousemove", (e) => {
          if (!this.painting) return;
          this.paint(e);
      });

      this.canvas.addEventListener("mouseup", () => {
          this.endPainting();
      });

      this.canvas.addEventListener("mouseout", () => {
          this.endPainting();
      });

      this.colorPalette.querySelectorAll('.color-box').forEach((box) => {
          box.addEventListener('click', (event) => {
              this.brush.color = event.target.dataset.color;
              this.colorPalette.querySelectorAll('.color-box').forEach(b => {
                  b.classList.remove('selected');
              });
              event.target.classList.add('selected');
          });
      });

      this.brushSizeSlider.addEventListener("input", (e) => {
          this.brush.size = parseInt(e.target.value);
      });

      this.clearButton.addEventListener("click", () => {
          this.clearCanvas();
      });
  }

  startPainting(e) {
      this.painting = true;
      this.ctx.beginPath();
      this.ctx.moveTo(e.offsetX, e.offsetY);
      this.ctx.strokeStyle = this.brush.color;
      this.ctx.lineWidth = this.brush.size;
  }

  paint(e) {
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(e.offsetX, e.offsetY);
  }

  endPainting() {
      this.painting = false;
      this.ctx.beginPath();
  }

  clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}