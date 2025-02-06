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
    Tone.start().then(() => {
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

    this.shadedPixels = 0;
    this.colors = {
      'rgb(255, 255, 255)': 0, // white
      'rgb(227, 0, 34)': 0, // red
      'rgb(255, 246, 0)': 0, // yellow
      'rgb(4, 55, 242)': 0, // blue
      'rgb(4, 99, 71)': 0, // green
      'rgb(201, 130, 42)': 0, // sienna
      'rgb(99, 60, 22)': 0, // umber
    };
    this.dominantColor = null;
    this.initializeBeats();

    this.initializeSampler();
    this.sequence = null;
  }

  initializeBeats() {
    this.beats = {};
    for (let i = 0; i < 4; i++) this.beats[i] = new Beat(i);
  }

  initializeSampler() {
    this.sampler = new Tone.Sampler({
      urls: { B3: 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3' },
      release: 1,
    }).toDestination();
    this.effects = new Effects();
    this.sampler.chain(
      this.effects.vibrato,
      // this.effects.decayDelay,
      this.effects.jetsons,
      this.effects.bitCrusher,
      this.effects.chorusRattler,
      this.effects.tremolo,
      this.effects.chorusThirds,
      Tone.Destination,
    )
  }

  processPixelData(data) {
    for (let i = 0; i < 200; i++) {
      for (let j = 0; j < 200; j++) {
        const idx = (i * 200 + j) * 4;
        const color = `rgb(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]})`;
        if (Object.keys(this.colors).includes(color)) {
          this.shadedPixels++;
          this.colors[color] = this.colors[color] + 1;

          const beatId = (i >= 100) * 1 + (j >= 100) * 2;
          const beat = this.beats[beatId];
          beat.shadedPixels++;
          beat.colors[color] = beat.colors[color] + 1;
        }
      }
    }
    if (this.shadedPixels) {
      this.dominantColor = this.getDominantColor(this.colors);

      for (let i = 0; i < 4; i++) {
        const beat = this.beats[i];
        beat.dominantColor = this.getDominantColor(beat.colors);
      }

      Object.entries(this.colors).forEach(([color, numPixels]) => {
        const wet = Math.min(1, numPixels / 80000);
        this.effects.colorToEffect[color].set({ wet: wet });
        console.log("changing wet", wet)
      });
    }
  }

  updateSequence() {
    if (this.sequence !== null) {
      this.sequence.dispose();
    }
    if (this.shadedPixels) {
      const measure = this.generateMeasure();
      console.log(measure);
      this.sequence = new Tone.Sequence((time, note) => {
        this.sampler.triggerAttackRelease(note, '4n', time);
      }, measure, '4n').start(0);
    }
  }

  generateMeasure() {
    return Array.from({ length: 4 }, (_, i) => this.beats[i].generateNotes());
  }

  getDominantColor(colors) {
    return Object.entries(colors).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];
  }
}

class Effects {
  constructor() {
    this.chorusThirds = new Tone.Chorus().start();
    this.chorusThirds.set({
      frequency: 4,
      delayTime: 16,
      type: 'triangle',
      depth: 1,
      feedback: 0.1,
      spread: 80,
      wet: 0,
    });

    this.chorusRattler = new Tone.Chorus().start();
    this.chorusRattler.set({
      frequency: '16n',
      delayTime: 15,
      type: 'square',
      depth: 0.2,
      feedback: 0.3,
      spread: 80,
      wet: 0,
    });

    this.vibrato = new Tone.Vibrato();
    this.vibrato.set({
      frequency: '32n',
      depth: 0.2,
      type: 'sine',
      wet: 0,
    });

    this.tremolo = new Tone.Tremolo();
    this.tremolo.set({
      frequency: '16n',
      type: 'triangle',
      depth: 0.6,
      spread: 0,
      wet: 0,
    });

    this.bitCrusher = new Tone.BitCrusher();
    this.bitCrusher.set({
      bits: 1,
      wet: 0,
    });

    this.decayDelay = new Tone.FeedbackDelay();
    this.decayDelay.set({
      delayTime: '6n',
      feedback: 0.4,
      wet: 0,
    });

    this.jetsons = new Tone.Phaser();
    this.jetsons.set({
      frequency: '4n',
      octaves: 3.3,
      Q: 8,
      baseFrequency: 250,
      wet: 0,
    });

    this.colorToEffect = {
      'rgb(255, 255, 255)': this.chorusThirds,
      'rgb(227, 0, 34)': this.chorusRattler,
      'rgb(255, 246, 0)': this.bitCrusher,
      'rgb(4, 55, 242)': this.decayDelay,
      'rgb(4, 99, 71)': this.jetsons,
      'rgb(201, 130, 42)': this.tremolo,
      'rgb(99, 60, 22)': this.vibrato,
    };
  }
}

class Beat {
  constructor(beatId) {
    this.beatId = beatId;
    this.shadedPixels = 0;
    this.colors = {
      'rgb(255, 255, 255)': 0, // white
      'rgb(227, 0, 34)': 0, // red
      'rgb(255, 246, 0)': 0, // yellow
      'rgb(4, 55, 242)': 0, // blue
      'rgb(4, 99, 71)': 0, // green
      'rgb(201, 130, 42)': 0, // sienna
      'rgb(99, 60, 22)': 0, // umber
    }
    this.dominantColor = null;

    this.colorToNote = {
      'rgb(255, 255, 255)': 'B',
      'rgb(227, 0, 34)': 'C#',
      'rgb(255, 246, 0)': 'D',
      'rgb(4, 55, 242)': 'E',
      'rgb(4, 99, 71)': 'F#',
      'rgb(201, 130, 42)': 'G',
      'rgb(99, 60, 22)': 'A'
    };
  }

  generateNotes() {
    if (!this.shadedPixels) return null;

    const letter = this.colorToNote[this.dominantColor];
    const octave = (this.shadedPixels % 7) + 1;
    const note = `${letter}${octave}`

    const subdivisions = (this.shadedPixels % 3) + 1;
    return Array(subdivisions).fill(note);
  }
}
