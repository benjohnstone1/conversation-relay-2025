let audioContext;

class NoiseGate {
  constructor() {
    // if (!audioContext) {
    //   const audioContext = new AudioContext();
    // }
    audioContext = new AudioContext();
    this.audioContext = audioContext;
  }

  getVolumeLevel(analyser) {
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);

    // Calculate the average of the frequency data
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i];
    }
    return sum / buffer.length;
  }

  // Logic for the noise gate, mute below threshold
  applyNoiseGate(gainNode, analyserNode) {
    const volumeLevel = this.getVolumeLevel(analyserNode);

    let threshold = 10;
    if (volumeLevel < threshold) {
      gainNode.gain.value = 0; // Mute the audio if below threshold
    } else {
      gainNode.gain.value = 1; // Full volume
    }
  }

  async createProcessedStream(stream) {
    // Create source and destination
    this.source = this.audioContext.createMediaStreamSource(stream); // existing stream
    this.destination = this.audioContext.createMediaStreamDestination(); //this creates the new stream

    // Apply processing here
    // Create an analyser node to get frequency data
    this.analyser = this.audioContext.createAnalyser(); // measure the data
    this.source.connect(this.analyser);

    // Create a GainNode to simulate a noise gate
    this.gainNode = this.audioContext.createGain();
    this.analyser.connect(this.gainNode);

    // Use setInterval to apply noise gate logic every 50ms (or adjust as needed)
    const intervalId = setInterval(() => {
      this.applyNoiseGate(this.gainNode, this.analyser);
    }, 50); // This will call the function every 50 milliseconds

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
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.destination) {
      this.destination.disconnect();
    }
  }
}

export default NoiseGate;
