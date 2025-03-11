let audioContext;

class NoiseCancellation {
  constructor() {
    // if (!audioContext) {
    //   const audioContext = new AudioContext();
    // }
    audioContext = new AudioContext();
    this.audioContext = audioContext;
  }

  processAudio() {
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate the average volume level from the frequency data
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    const averageVolume = sum / this.bufferLength;
    console.log(this.dataArray);
    console.log("average volume is ", averageVolume); // currently 0 as dataArray is array of 0s

    // If the average volume is below a certain threshold, mute the audio (noise gate effect)
    // if (averageVolume < 30) {
    //   // Threshold can be adjusted
    //   this.gainNode.gain.value = 0; // Mute audio if it's below the threshold
    // } else {
    //   this.gainNode.gain.value = 1.0; // Pass through audio if it's above the threshold
    // }
  }

  async createProcessedStream(stream) {
    // Create source and destination
    this.source = this.audioContext.createMediaStreamSource(stream); // existing stream
    this.destination = this.audioContext.createMediaStreamDestination(); //this creates the new stream

    // Apply processing here
    // Create an analyser node to get frequency data
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048; // Set the FFT size for better frequency resolution
    this.source.connect(this.analyser);

    // Basic noise gate - adjust gain based on volume
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    // Create a GainNode to simulate a noise gate
    this.gainNode = this.audioContext.createGain();

    // this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate the average volume level from the frequency data
    // let sum = 0;
    // for (let i = 0; i < this.bufferLength; i++) {
    //   sum += this.dataArray[i];
    // }
    // const averageVolume = sum / this.bufferLength;
    // console.log("average volume is ", averageVolume); // currently 0 as dataArray is array of 0s
    const threshHold = 0.3;
    if (this.gainNode.gain.value < threshHold) {
      this.gainNode.gain.value = 0; // mute
    } else {
      this.gainNode.gain.value = 1.0; // Default gain
    }

    // Apply a Lowpass Filter (to filter out high-frequency noise)
    // const filterNode = this.audioContext.createBiquadFilter();
    // filterNode.type = "lowpass"; // A lowpass filter to remove high frequencies, can have highpass, bandpass
    // filterNode.frequency.setValueAtTime(3000, audioContext.currentTime); // Filter out frequencies above 3kHz

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.destination);

    // Return the resulting stream
    return this.destination.stream;
  }

  async destroyProcessedStream(stream) {
    // Cleanup
    if (this.source) {
      this.source.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
    }
    if (this.destination) {
      this.destination.disconnect();
    }
  }
}

export default NoiseCancellation;
