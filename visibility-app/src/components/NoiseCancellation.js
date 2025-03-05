let audioContext;

class NoiseCancellation {
  constructor() {
    // if (!audioContext) {
    //   const audioContext = new AudioContext();
    // }
    audioContext = new AudioContext();
    this.audioContext = audioContext;
  }

  async createProcessedStream(stream) {
    // Create source and destination
    this.source = this.audioContext.createMediaStreamSource(stream); // existing stream
    this.destination = this.audioContext.createMediaStreamDestination(); //this creates the new stream

    // Apply processing here
    this.filterNode = audioContext.createGain();
    this.filterNode.gain.value = 0.01; //adjust volume down (reduces all volume indiscriminately)

    // Connect source to filter and filter to destination
    this.source.connect(this.filterNode);
    this.filterNode.connect(this.destination);

    // Return the resulting stream
    return this.destination.stream;
  }

  async destroyProcessedStream(stream) {
    // Cleanup
    if (this.source) {
      this.source.disconnect();
    }
    if (this.destination) {
      this.destination.disconnect();
    }
  }
}

export default NoiseCancellation;
