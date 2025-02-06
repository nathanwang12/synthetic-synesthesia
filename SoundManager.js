// import * as Tone from 'https://unpkg.com/tone@latest/build/Tone.js';

export class SoundManager {
  constructor() {
    this.bpm = 84;
    this.synths = {};
    this.initializeSamplers();

    this.activeInstruments = new Set();


    this.transport = null;

  }

  turnOnAudioContext() {
    Tone.start()
    this.transport = Tone.getTransport();
    this.transport.bpm.value = this.bpm;
    this.transport.timeSignature = [4, 4];
    this.transport.loop = true;
    this.transport.loopStart = 0;
    this.transport.loopEnd = '1m';
    this.transport.start();
  }

  initializeSamplers() {
    for (let i = 0; i < 24; i++) {
      const sampler = new Tone.Sampler({
        urls: { B3: 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3' },
        release: 1,
      }).toDestination();
      this.synths[i] = {
        sampler: sampler,
        id: i,
        scheduleId: null,
        sequence: null,
      };
    }
  }

  setActiveInstruments(instruments) {
    this.activeInstruments.clear();

    instruments.flat().forEach(instrument => {
      if (instrument.shadedPixels > 0 && instrument.uniqueColors > 0) {
        this.activeInstruments.add(instrument.id);
      }
    });
    console.log(this.activeInstruments);
    if (this.activeInstruments.size) this.scheduleNotes();
    else this.transport.cancel();
  }

  scheduleNotes() {
    this.activeInstruments.forEach(id => {
      const synth = this.synths[id];
      if (synth.sequence !== null) {
        synth.sequence.dispose();
      }
      synth.sequence = new Tone.Sequence((time, note) => {
        synth.sampler.triggerAttackRelease(note, 0.1, time);
      }, ["A4", [], "C4", "D4"], "4n").start(0);
    });

    // this.transport.start();
  }


  // scheduleNotes() {
  //   // this.ss.cancel()
  //   this.activeInstruments.forEach(id => {
  //     console.log("active synth", id);
  //     const synth = this.synths[id];
  //     if (synth.scheduleId !== null) {
  //       this.transport.clear(synth.scheduleId);
  //       console.log("cleared", synth.scheduleId, synth.id)
  //     }
  //     // console.log(synth.sampler);
  //     synth.scheduleId = this.transport.scheduleRepeat((time) => {
  //       synth.sampler.triggerAttackRelease('B3', '4n', time);
  //     }, '16n');
  //     // this.ss.scheduleRepeat((time) => {
  //     //   synth.sampler.triggerAttackRelease('A5', '4n', time);
  //     // }, '8n', this.ss.nextSubdivision("4n"));
  //     // this.ss.start();
  //     console.log("scheduled", synth.scheduleId, synth.id)

  //     // this.ss.clear(synth.scheduleId);
  //   });
  //   // this.transport.start();
  //   // this.ss.start();
  // }
}


