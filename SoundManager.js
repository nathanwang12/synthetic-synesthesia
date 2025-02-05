// import * as Tone from 'https://unpkg.com/tone@latest/build/Tone.js';

export class SoundManager {
  constructor() {
    this.bpm = 84;
    this.synths = {};
    this.initializeSamplers();

    this.activeInstruments = new Set();

    this.ss = Tone.getTransport();
    this.ss.bpm.value = this.bpm;
    this.ss.timeSignature = [4, 4];
    this.ss.loop = true;
    this.ss.loopStart = '0m';
    this.ss.loopEnd = '1m';

    document.addEventListener("click", async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
        this.ss.start();
      }
    }, { once: true });

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
    else this.ss.cancel();
  }

  scheduleNotes() {
    this.activeInstruments.forEach(id => {
      const synth = this.synths[id];
      const seq = new Tone.Sequence((time, note) => {
        synth.sampler.triggerAttackRelease(note, 0.1, time);
      }, ["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]])
        .start(this.ss.nextSubdivision('4n'));
    });

    this.ss.start();
  }


  // scheduleNotes() {
  //   // this.ss.cancel()
  //   this.activeInstruments.forEach(id => {
  //     console.log("active synth", id);
  //     const synth = this.synths[id];
  //     if (synth.scheduleId !== null) {
  //       this.ss.clear(synth.scheduleId);
  //       console.log("cleared", synth.scheduleId, synth.id)
  //     }
  //     // console.log(synth.sampler);
  //     synth.scheduleId = this.ss.scheduleRepeat((time) => {
  //       synth.sampler.triggerAttackRelease('B3', '4n', time);
  //     }, '4n', this.ss.nextSubdivision('4n'));
  //     // this.ss.scheduleRepeat((time) => {
  //     //   synth.sampler.triggerAttackRelease('A5', '4n', time);
  //     // }, '8n', this.ss.nextSubdivision("4n"));
  //     // this.ss.start();
  //     console.log("scheduled", synth.scheduleId, synth.id)

  //     // this.ss.clear(synth.scheduleId);
  //   });
  //   // this.ss.start();
  // }
}


