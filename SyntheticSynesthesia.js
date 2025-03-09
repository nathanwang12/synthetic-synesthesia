const BPM = 84;
const TIME_SIGNATURE = [4, 4];
const LOOP_DURATION = '2m';

const B_MINOR_SCALE = ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'];
const DIATONIC_TRIADS = {
  'B': [0, 2, 5],
  'C#': [1, 3, 6],
  'D': [2, 4, 0],
  'E': [4, 6, 1],
  'F#': [5, 0, 2],
  'G': [6, 1, 3],
  'A': [7, 2, 4],
};

const IDX_TO_SAMPLE = {
  0: 'kick',
  1: 'snare',
  2: 'hihat',
  3: 'atmosphere',
  4: 'piano',
}

const SAMPLE_SUBDIVISIONS = {
  'kick': '2n',
  'snare': '2n',
  'hihat': '4n',
  'piano': '4n',
  'atmosphere': '2m',
}
const DRUM_SAMPLES = {
  'kick': 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3',
  'snare': 'https://tonejs.github.io/audio/drum-samples/Techno/snare.mp3',
  'hihat': 'https://tonejs.github.io/audio/drum-samples/Techno/hihat.mp3',
}

const ATMOSPHERE_INFO = {
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
}
const PIANO_INFO = {
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
}

const COLOR_TO_NOTE = {
  'rgb(255, 255, 255)': 'B',
  'rgb(227, 0, 34)': 'C#',
  'rgb(255, 246, 0)': 'D',
  'rgb(4, 55, 242)': 'E',
  'rgb(4, 99, 71)': 'F#',
  'rgb(201, 130, 42)': 'G',
  'rgb(99, 60, 22)': 'A',
}
const COLOR_COUNT = {
  'rgb(255, 255, 255)': 0,
  'rgb(227, 0, 34)': 0,
  'rgb(255, 246, 0)': 0,
  'rgb(4, 55, 242)': 0,
  'rgb(4, 99, 71)': 0,
  'rgb(201, 130, 42)': 0,
  'rgb(99, 60, 22)': 0,
};

export class SyntheticSynesthesia {
  constructor(canvasElement, colorPalette, brushSizeSlider, clearButton) {
    this.audioOn = false;

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

    this.idxToSample = IDX_TO_SAMPLE;
    this.players = {};

    this.setUpEvents();
    this.initializePlayers(this.rows, this.cols);
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
        this.transport.bpm.value = BPM;
        this.transport.timeSignature = TIME_SIGNATURE;
        this.transport.loop = true;
        this.transport.loopStart = 0;
        this.transport.loopEnd = LOOP_DURATION;
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
    this.updatePlayers();
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.disposeSequences();
    this.initializePlayers();
    this.updatePlayers();
  }

  initializePlayers() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const idx = this.rows * i + j;
        const sampleId = this.idxToSample[idx % 5];
        this.players[idx] = new Player(idx, sampleId);
      }
    }
  }

  updatePlayers() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const pixelData = this.ctx.getImageData(j * 200, i * 200, 200, 200).data;
        const player = this.players[this.rows * i + j];
        player.processPixelData(pixelData);
        if (player.shadedPixels) player.updateSequence();
      }
    }
  }

  disposeSequences() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const player = this.players[this.rows * i + j];
        if (player.sequence) player.sequence.dispose();
      }
    }
  }
}

class Player {
  constructor(idx, sampleId) {
    this.idx = idx;
    this.sampleId = sampleId;

    this.shadedPixels = 0;
    this.colors = {...COLOR_COUNT};
    this.dominantColor = null;

    this.instrument = null;
    this.sequence = null;
    this.initializeInstrument();
  }

  initializeInstrument() {
    if (this.sampleId === 'piano') this.instrument = new Piano();
    else if (this.sampleId === 'atmosphere') this.instrument = new Atmosphere();
    else this.instrument = new Drum(this.sampleId);
  }

  processPixelData(data) {
    for (let i = 0; i < 200; i++) {
      for (let j = 0; j < 200; j++) {
        const k = (i * 200 + j) * 4;
        const color = `rgb(${data[k]}, ${data[k + 1]}, ${data[k + 2]})`;
        if (Object.keys(COLOR_COUNT).includes(color)) {
          this.shadedPixels++;
          this.colors[color] = this.colors[color] + 1;

          if (Object.keys(DRUM_SAMPLES).includes(this.sampleId)) {
            const beatIdx = (i >= 100) * 1 + (j >= 100) * 2;
            const drumBeat = this.instrument.beats[beatIdx];
            drumBeat.shadedPixels++;
            drumBeat.colors[color] = drumBeat.colors[color] + 1;
          }
        }
      }
    }
    if (this.shadedPixels) {
      this.dominantColor = Object.entries(this.colors).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];
      if (Object.keys(DRUM_SAMPLES).includes(this.sampleId)) {
        for (let i = 0; i < 4; i++) {
          const drumBeat = this.instrument.beats[i];
          drumBeat.dominantColor = Object.entries(this.colors).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];
        }
      }
    }
  }

  updateSequence() {
    if (!this.shadedPixels) return;
    const sampleId = this.sampleId;

    let pattern;
    if (Object.keys(DRUM_SAMPLES).includes(sampleId)) pattern = this.generateDrumLine();
    else if (sampleId === 'atmosphere') pattern = [COLOR_TO_NOTE[this.dominantColor]];
    else if (sampleId === 'piano') pattern = this.generateArpeggio();

    if (sampleId === 'piano') console.log(pattern);
    if (!this.sequence) {
      if (Object.keys(DRUM_SAMPLES).includes(sampleId)) this.initDrumSequence(pattern);
      else if (sampleId === 'atmosphere') this.initAtmosphereSequence(pattern);
      else if (sampleId === 'piano') this.initPianoSequence(pattern);
    } else {
      this.sequence.events = pattern;
    }
  }
  generateDrumLine() {
    const drums = this.instrument;
    return Array.from({ length: 4 }, (_, i) => drums.beats[i].generateRhythm());
  }

  generateChord(note) {
    const triad = DIATONIC_TRIADS[note];
    const octave = (this.shadedPixels % 3) + 1;
    const chord = triad.map(i => `${B_MINOR_SCALE[i]}${octave}`);
    return chord;
  }

  generateArpeggio() {
    const triad = DIATONIC_TRIADS[COLOR_TO_NOTE[this.dominantColor]];
    const octave = (this.shadedPixels % 3) + 3;
    const notes = triad.map(i => `${B_MINOR_SCALE[i]}${octave}`);
    const arpeggio = [
      this.shuffleNote(notes[0]),
      this.shuffleNote(notes[1]),
      this.shuffleNote(notes[2]),
      this.shuffleNote(notes[0]),
      this.shuffleNote(notes[1]),
      this.shuffleNote(notes[2]),
      this.shuffleNote(notes[0]),
      this.shuffleNote(notes[1]),
    ];
    return arpeggio;
  }

  shuffleNote(note) {
    const outcome = Math.floor(Math.random() * 3);

    if (outcome === 0) return null;
    else if (outcome === 1) {
      const numNotes= this.shadedPixels % 3 + 1;
      return Array(numNotes).fill(note);
    }
    else return note;
}

  initDrumSequence(drumLine) {
    const subdivision = SAMPLE_SUBDIVISIONS[this.sampleId];
    this.sequence = new Tone.Sequence((time, note) => {
      this.instrument.sampler.triggerAttackRelease(note, subdivision, time);
    }, drumLine, subdivision).start(0);
  }

  initAtmosphereSequence(note) {
    const subdivision = SAMPLE_SUBDIVISIONS[this.sampleId];
    this.sequence = new Tone.Sequence((time, note) => {
      this.instrument.sampler.triggerAttackRelease(this.generateChord(note), subdivision, time);
    }, note, subdivision).start(0);
  }

  initPianoSequence(arpeggio) {
    const subdivision = SAMPLE_SUBDIVISIONS[this.sampleId];
    this.sequence = new Tone.Sequence((time, note) => {
      this.instrument.sampler.triggerAttackRelease(note, subdivision, time);
    }, arpeggio, subdivision).start(0);
  }
}

class Drum {
  constructor(drumId) {
    this.drumId = drumId;

    this.sampler = null;
    this.initializeDrumSample();

    this.beats = {};
    this.initializeBeats();
  }

  initializeDrumSample() {
    const sampleUrl = DRUM_SAMPLES[this.drumId];
    const reverb = new Tone.Reverb({
      decay: 1,
      wet: 0.4,
    }).toDestination();
    this.sampler = new Tone.Sampler({
      urls: {D2: sampleUrl},
        release: 1,
        volume: -12,
    });
    this.sampler.connect(reverb);
  }

  initializeBeats() {
    for (let i = 0; i < 4; i++) this.beats[i] = new DrumBeat(i);
  }
}

class DrumBeat {
  constructor(beatIdx) {
    this.beatIdx = beatIdx;
    this.shadedPixels = 0;
    this.colors = {...COLOR_COUNT};
    this.dominantColor = null;
  }

  generateRhythm() {
    if (!this.shadedPixels) return null;
    const numNotes = (this.shadedPixels % 3) + 1;
    const note = `${COLOR_TO_NOTE[this.dominantColor]}2`;
    return Array(numNotes).fill(note);
  }
}

class Piano {
  constructor() {
    this.sampler = null;
    this.initializePianoSample();
  }

  initializePianoSample() {
    const reverb = new Tone.Reverb({
      wet: 0.4,
      decay: 1,
    }).toDestination();
    this.sampler = new Tone.Sampler(PIANO_INFO).connect(reverb);
  }
}

class Atmosphere {
  constructor() {
    this.sampler = null;
    this.initializeAtmosphereSample();
  }

  initializeAtmosphereSample() {
    const reverb = new Tone.Reverb({
      wet: 0.5,
      decay: 6,
    }).toDestination();
    this.sampler = new Tone.Sampler(ATMOSPHERE_INFO).connect(reverb);
  }
}
