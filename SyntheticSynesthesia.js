export class SyntheticSynesthesia {
  constructor(canvasElement, colorPalette, brushSizeSlider, clearButton) {
    this.audioOn = false;
    this.bpm = 84;

    this.canvas = canvasElement;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;

    this.rows = this.canvas.height / 200;
    this.cols = this.canvas.width / 200;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';

    this.colorPalette = colorPalette;
    this.brushSizeSlider = brushSizeSlider;
    this.clearButton = clearButton;
    this.painting = false;

    this.brushColor = '#FFFFFF';
    this.brushSize = parseInt(this.brushSizeSlider.value);
    //   'rgb(255, 255, 255)', // white
    //   'rgb(227, 0, 34)', // red
    //   'rgb(255, 246, 0)', // yellow
    //   'rgb(4, 55, 242)', // blue
    //   'rgb(4, 99, 71)', // green
    //   'rgb(201, 130, 42)', // sienna
    //   'rgb(99, 60, 22)', // umber
    //   'rgb(0, 0, 0)', // black
    // ];

    this.setUpEvents();

    this.initializeInstruments(this.rows, this.cols);
  }

  setUpEvents() {
    this.canvas.addEventListener('mousedown', () => {
      if (!this.audioOn) {
        this.audioOn = true;
        this.initializeAudio();
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
        this.brushColor = event.target.dataset.color;
        this.colorPalette.querySelectorAll('.color-box').forEach(b => {
          b.classList.remove('selected');
        });
        event.target.classList.add('selected');

      });
    });

    this.brushSizeSlider.addEventListener("input", (e) => {
      this.brushSize = parseInt(e.target.value);
    });

    this.clearButton.addEventListener("click", () => this.clearCanvas());
  }

  initializeAudio() {
    console.log('initializing audio');

    // Ensure the AudioContext is started
    Tone.start().then(() => {
        console.log("AudioContext started!");

        // Get the transport and set up timing
        this.transport = Tone.getTransport();
        this.transport.bpm.value = this.bpm;
        this.transport.timeSignature = [4, 4];
        this.transport.loop = true;
        this.transport.loopStart = 0;
        this.transport.loopEnd = '1m';

        this.transport.start();
    }).catch((e) => {
        console.error("Error starting AudioContext:", e);
    });
}


  startPainting() {
    this.painting = true;
  }

  paint(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  endPainting() {
    this.painting = false;
    this.ctx.beginPath();
    this.updateInstruments();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.disposeSequences();
    this.initializeInstruments(this.rows, this.cols);
    this.updateInstruments();
  }

  initializeInstruments() {
    console.log('initializing instruments')
    this.instruments = {};
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const id = this.rows * i + j;
        this.instruments[id] = new Instrument(id);
      }
    }
  }

  updateInstruments() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const id = this.rows * i + j;
        const instrument = this.instruments[id];
        const pixelData = this.ctx.getImageData(j * 200, i * 200, 200, 200).data;
        instrument.processPixelData(pixelData);
        instrument.updateSequence();
      }
    }
  }

  disposeSequences() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const id = this.rows * i + j;
        const instrument = this.instruments[id];
        if (instrument.sequence) instrument.sequence.dispose();
      }
    }
  }
}

class Instrument {
  constructor(id) {
    this.id = id;

    // instrument metrics
    this.shadedPixels = 0;

    this.colors = [
      'rgb(255, 255, 255)', // white
      'rgb(227, 0, 34)', // red
      'rgb(255, 246, 0)', // yellow
      'rgb(4, 55, 242)', // blue
      'rgb(4, 99, 71)', // green
      'rgb(201, 130, 42)', // sienna
      'rgb(99, 60, 22)', // umber
    ]

    this.sampler = new Tone.Sampler({
      urls: { B3: 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3' },
      release: 1,
    }).toDestination();

    this.sequence = null;
  }

  processPixelData(data) {
    for (let i = 0; i < 200; i++) {
      for (let j = 0; j < 200; j++) {
        const idx = (i * 200 + j) * 4;
        const color = `rgb(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]})`;
        if (this.colors.includes(color)) {
          this.shadedPixels++;
        }
      }
    }
  }

  updateSequence() {
    if (this.sequence !== null) {
      console.log('disposing');
      this.sequence.dispose();
    }
    if (this.shadedPixels) {
      console.log('adding sequence');
      console.log('shaded pixels', this.shadedPixels)
      const measure = this.generateMeasure();
      this.sequence = new Tone.Sequence((time, note) => {
        this.sampler.triggerAttackRelease(note, '4n', time);
      }, measure, '4n').start(0);
    }
  }

  generateMeasure() {
    let measure;
    if (this.shadedPixels % 2 === 0) {
      measure = ['A4', 'B4', [], []];
    } else {
      measure = [[], [], 'G4', 'G4'];
    }
    console.log(this.id, measure);
    return measure;

  }
}
