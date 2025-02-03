class CanvasManager {
  constructor(canvasElement, colorPalette, brushSizeSlider, clearButton) {
    this.canvas = canvasElement;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
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

    this.instruments = this.initializeInstruments();

    this.updateCursor();
    this.setupEvents();
  }

  initializeInstruments() {
    const instruments = [];
    for (let row = 0; row < 4; row++) {
      instruments[row] = [];
      for (let col = 0; col < 6; col++) {
        instruments[row][col] = {
          shadedPixels: 0,
          colorCounts: {
            '#FFFFFF': 0,
            '#E30022': 0,
            '#FFF600': 0,
            '#0437F2': 0,
            '#046347': 0,
            '#C9822A': 0,
            '#633C16': 0,
          },
          pixels: Array.from({ length: 200 }, () =>
            Array.from({ length: 200 }, () => ({
              color: '',
              timeShaded: null,
            }))
          ),
        };
      }
    }
    return instruments;
  }

  createCursor() {
    const cursorCanvas = document.createElement('canvas');
    const size = this.brush.size + 4;
    cursorCanvas.width = size;
    cursorCanvas.height = size;
    const ctx = cursorCanvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(size/2, size/2, this.brush.size/2, 0, Math.PI * 2);
    ctx.fillStyle = this.brush.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(size/2, size/2, this.brush.size/2, 0, Math.PI * 2);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.stroke();

    return cursorCanvas.toDataURL();
  }

  updateCursor() {
    const cursorUrl = this.createCursor();
    this.canvas.style.cursor = `url('${cursorUrl}') ${this.brush.size / 2 + 2} ${this.brush.size / 2 + 2}, auto`;
    console.log(this.canvas.style.cursor)
  }

  setupEvents() {
    this.canvas.addEventListener("mousedown", () => this.startPainting());

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.painting) this.paint(e);
    });

    this.canvas.addEventListener("mouseup", () => this.endPainting());

    this.canvas.addEventListener("mouseout", () => {
      if (this.painting) this.endPainting();
    });

    this.colorPalette.querySelectorAll('.color-box').forEach((box) => {
      box.addEventListener('click', (event) => {
        this.brush.color = event.target.dataset.color;
        this.colorPalette.querySelectorAll('.color-box').forEach(b => {
          b.classList.remove('selected');
        });
        event.target.classList.add('selected');
        this.updateCursor();
      });
    });

    this.brushSizeSlider.addEventListener("input", (e) => {
      this.brush.size = parseInt(e.target.value);
      this.updateCursor();
    });

    this.clearButton.addEventListener("click", () => this.clearCanvas());
  }

  startPainting() {
    this.painting = true;
  }

  paint(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    this.ctx.strokeStyle = this.brush.color;
    this.ctx.lineWidth = this.brush.size;

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  endPainting() {
    this.painting = false;
    this.ctx.beginPath();
    this.updateInstrumentData();
  }

  updateInstrumentData() {

    const pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        let shadedPixels = 0;
        const instrument = this.instruments[row][col];
        for (let i = 0; i < 200; i++) {
          for (let j = 0; j < 200; j++) {
            const x = col * 200 + j;
            const y = row * 200 + i;
            const index = (y * this.canvas.width + x) * 4;
            const color = `rgb(${pixelData[index]}, ${pixelData[index+1]}, ${pixelData[index+2]})`;
            instrument.pixels[i, j].color = color;


            if (color != 'rgb(0, 0, 0)') shadedPixels++;
          }
        }
        instrument.shadedPixels = shadedPixels;
        console.log(`Instrument (${row},${col}): ${instrument.shadedPixels} pixels shaded`);
      }
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.instruments = this.initializeInstruments();
  }
}