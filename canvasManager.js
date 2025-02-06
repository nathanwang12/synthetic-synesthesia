import { SoundManager } from "./SoundManager.js";

export class CanvasManager {
  constructor(canvasElement, colorPalette, brushSizeSlider, clearButton) {
    this.SM = new SoundManager();
    this.audioContextOn = false;

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

    this.colors = [
      'rgb(255, 255, 255)', // white
      'rgb(227, 0, 34)', // red
      'rgb(255, 246, 0)', // yellow
      'rgb(4, 55, 242)', // blue
      'rgb(4, 99, 71)', // green
      'rgb(201, 130, 42)', // sienna
      'rgb(99, 60, 22)', // umber
      'rgb(0, 0, 0)', // black
    ];


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
          colorCounts: Object.fromEntries(this.colors.map(c => [c, 0])),
          uniqueColors: 0,
          dominantColor: '',
          pixels: Array.from({ length: 200 }, () =>
            Array.from({ length: 200 }, () => ({
              color: '',
              timeShaded: null,
            }))
          ),
          quadrants: Array.from({ length: 4 }, () => ({
            shadedPixels: 0,
            colorCounts: Object.fromEntries(this.colors.map(c => [c, 0])),
            uniqueColors: 0,
            dominantColor: '',
          })),
          id: (6 * row) + col,
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
  }

  setupEvents() {

    this.canvas.addEventListener("mousedown", () => {
      if (!this.audioContextOn) {
        this.audioContextOn = true;
        this.SM.turnOnAudioContext();
      }
      this.startPainting();
    });

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

        const instrument = this.instruments[row][col];
        instrument.colorCounts = Object.fromEntries(this.colors.map(c => [c, 0]));

        for (let q = 0; q < 4; q++) {
          const quadrant = instrument.quadrants[q];
          quadrant.shadedPixels = 0;
          quadrant.colorCounts = Object.fromEntries(this.colors.map(c => [c, 0]));
          quadrant.uniqueColors = 0;
        }

        for (let i = 0; i < 200; i++) {
          for (let j = 0; j < 200; j++) {

            const x = col * 200 + j;
            const y = row * 200 + i;
            const index = (y * this.canvas.width + x) * 4;
            const color = `rgb(${pixelData[index]}, ${pixelData[index+1]}, ${pixelData[index+2]})`;
            if (this.colors.includes(color)) {
              instrument.pixels[i][j].color = color;

              const quadIdx = (i >= 100) * 1 + (j >= 100) * 2;
              const quadrant = instrument.quadrants[quadIdx];

              if (color !== 'rgb(0, 0, 0)') {
                instrument.shadedPixels++;
                instrument.colorCounts[color] = (instrument.colorCounts[color] || 0) + 1;

                quadrant.shadedPixels++;
                quadrant.colorCounts[color] = (quadrant.colorCounts[color] || 0) + 1;
              }
            }
          }
        }

        instrument.uniqueColors = Object.values(instrument.colorCounts).filter(c => c).length;
        instrument.dominantColor = Object.entries(instrument.colorCounts).reduce(
          (a, b) => (b[1] > a[1] ? b : a),
          ['', 0]
        )[0];

        for (let q = 0; q < 4; q++) {
          const quadrant = instrument.quadrants[q];
          quadrant.uniqueColors = Object.values(quadrant.colorCounts).filter(c => c).length;
          quadrant.dominantColor = Object.entries(quadrant.colorCounts).reduce(
            (a, b) => (b[1] > a[1] ? b : a),
            ['', 0]
          )[0];
        }
      }
    }
    this.SM.setActiveInstruments(this.instruments);
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.instruments = this.initializeInstruments();
    this.updateInstrumentData();
  }
}
