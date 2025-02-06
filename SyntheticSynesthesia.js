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

    this.idToSample = {
      0: 'kick',
      1: 'piano',
      2: 'snare',
      3: 'atmosphere',
    }

    this.setUpEvents();
    this.initializeInstruments(this.rows, this.cols);
    this.updateCursorStyle();
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
      this.updateCursor(e);
      if (this.painting) this.paint(e);
    });

    this.canvas.addEventListener("mouseup", () => this.endPainting());

    this.canvas.addEventListener("mouseout", () => {
      this.hideCursor();
      if (this.painting) this.endPainting();
    });

    this.colorPalette.querySelectorAll('.color-box').forEach((box) => {
      box.addEventListener('click', (event) => {
        this.brushColor = event.target.dataset.color;
        this.colorPalette.querySelectorAll('.color-box').forEach(b => {
          b.classList.remove('selected');
        });
        event.target.classList.add('selected');
        this.updateCursorStyle();

      });
    });

    this.brushSizeSlider.addEventListener("input", (e) => {
      this.brushSize = parseInt(e.target.value);
      this.updateCursorStyle();
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

  updateCursor(event) {
    const cursor = document.getElementById('customCursor');
    cursor.style.left = `${event.pageX}px`;
    cursor.style.top = `${event.pageY}px`;
    cursor.style.display = "block";
    console.log("UPDATING!")
  }

  updateCursorStyle() {
    const cursor = document.getElementById('customCursor');
    cursor.style.width = `${this.brushSize}px`;
    cursor.style.height = `${this.brushSize}px`;
    cursor.style.backgroundColor = this.brushColor;
  }

  hideCursor() {
    document.getElementById('customCursor').style.display = "none";
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
        const id = this.cols * i + j;
        const sampleId = this.idToSample[id % 4];
        this.instruments[id] = new Instrument(id, sampleId);
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
  constructor(id, sampleId) {
    this.id = id;
    this.sampleId = sampleId;

    this.shadedPixels = 0;
    this.colors = {
      'rgb(255, 255, 255)': 0,
      'rgb(227, 0, 34)': 0,
      'rgb(255, 246, 0)': 0,
      'rgb(4, 55, 242)': 0,
      'rgb(4, 99, 71)': 0,
      'rgb(201, 130, 42)': 0,
      'rgb(99, 60, 22)': 0,
    };
    this.dominantColor = null;

    this.sampleSubdivisions = {
      'kick': '4n',
      'snare': '2n',
      'piano': '2n',
      'atmosphere': '2m',
    }

    this.initializeSampler();
    this.initializeBeats();
    this.sequence = null;
  }

  initializeBeats() {
    this.beats = {};
    for (let i = 0; i < 4; i++) this.beats[i] = new Beat(i, this.sampleId);
  }

  initializeSampler() {
    if (this.sampleId === 'kick') {
      this.sampler = new Tone.Sampler({
        urls: {D0: 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3'},
        release: 1,
        volume: -12,
      }).toDestination();
    } else if (this.sampleId === 'piano') {
      this.sampler = new Tone.Sampler({
        baseUrl: './piano/',
        urls: {
          'A3': 'A3.mp3',
          'A4': 'A4.mp3',
          'A5': 'A5.mp3',
          'B3': 'B3.mp3',
          'B4': 'B4.mp3',
          'B5': 'B5.mp3',
          'C3': 'C3.mp3',
          'C4': 'C4.mp3',
          'C5': 'C5.mp3',
          'D3': 'D3.mp3',
          'D4': 'D4.mp3',
          'D5': 'D5.mp3',
          'E3': 'E3.mp3',
          'E4': 'E4.mp3',
          'E5': 'E5.mp3',
          'F3': 'F3.mp3',
          'F4': 'F4.mp3',
          'F5': 'F5.mp3',
          'G3': 'G3.mp3',
          'G4': 'G4.mp3',
          'G5': 'G5.mp3',
        },
        release: 1,
        volume: -4,
      }).toDestination();
    } else if (this.sampleId === 'snare') {
      this.sampler = new Tone.Sampler({
        urls: {D0: 'https://tonejs.github.io/audio/drum-samples/Techno/snare.mp3'},
        release: 1,
        volume: -12,
      }).toDestination();
    } else if (this.sampleId === 'atmosphere') {
      this.sampler = new Tone.Sampler({
        baseUrl: './atmosphere/',
        urls: {
          'A3': 'A3.mp3',
          'A1': 'A1.mp3',
          'A2': 'A2.mp3',
          'B3': 'B3.mp3',
          'B1': 'B1.mp3',
          'B2': 'B2.mp3',
          'C3': 'C3.mp3',
          'C1': 'C1.mp3',
          'C2': 'C2.mp3',
          'D3': 'D3.mp3',
          'D1': 'D1.mp3',
          'D2': 'D2.mp3',
          'E3': 'E3.mp3',
          'E1': 'E1.mp3',
          'E2': 'E2.mp3',
          'F3': 'F3.mp3',
          'F1': 'F1.mp3',
          'F2': 'F2.mp3',
          'G3': 'G3.mp3',
          'G1': 'G1.mp3',
          'G2': 'G2.mp3',
        },
        release: 1,
      }).toDestination();
    }
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
    }
  }

  updateSequence() {
    const measure = this.generateMeasure();
    if (!this.sequence) {
      this.sequence = new Tone.Sequence((time, note) => {
        this.sampler.triggerAttackRelease(note, this.sampleSubdivisions[this.sampleId], time);
      }, measure, this.sampleSubdivisions[this.sampleId]).start(0);
    } else {
      this.sequence.events = measure;
    }
  }

  generateMeasure() {
    return Array.from({ length: 4 }, (_, i) => this.beats[i].generateNotes());
  }

  getDominantColor(colors) {
    return Object.entries(colors).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];
  }
}

class Beat {
  constructor(beatId, sampleId) {
    this.beatId = beatId;
    this.sampleId = sampleId;
    this.sampleRules = {
      'kick': {
        octaves: 1,
        octaveShift: 0,
        allowedSubdivisions: 3,
      },
      'piano': {
        octaves: 4,
        octaveShift: 2,
        allowedSubdivisions: 2,
      },
      'snare': {
        octaves: 1,
        octaveShift: 0,
        allowedSubdivisions: 3,
      },
      'atmosphere': {
        octaves: 3,
        octaveShift: 0,
        allowedSubdivisions: 1,
      }
    };
    this.shadedPixels = 0;
    this.colors = {
      'rgb(255, 255, 255)': 0,
      'rgb(227, 0, 34)': 0,
      'rgb(255, 246, 0)': 0,
      'rgb(4, 55, 242)': 0,
      'rgb(4, 99, 71)': 0,
      'rgb(201, 130, 42)': 0,
      'rgb(99, 60, 22)': 0,
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
    const rules = this.sampleRules[this.sampleId];
    const octave = this.shadedPixels % rules.octaves + rules.octaveShift;
    const note = `${letter}${octave}`
    const subdivisions = (this.shadedPixels % rules.allowedSubdivisions) + 1;
    return Array(subdivisions).fill(note);
  }
}
