import { AudioProcessor } from "@twilio/voice-sdk";
// import KrispSDK from "/noisecancellation/krisp/latest.js.version/dist/krispsdk.mjs";

let audioContext;

class BackgroundAudioProcessor implements AudioProcessor {
  private audioContext: AudioContext;
  private background: MediaElementAudioSourceNode;
  private destination: MediaStreamAudioDestinationNode;

  constructor() {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    this.audioContext = audioContext;
  }

  async createProcessedStream(stream: MediaStream): Promise<MediaStream> {
    // Create the source node
    const audioEl = new Audio("/background.mp3");
    audioEl.addEventListener("canplaythrough", () => audioEl.play());
    this.background = this.audioContext.createMediaElementSource(audioEl);

    // Create the destination node and connect the source node
    this.destination = this.audioContext.createMediaStreamDestination();
    this.background.connect(this.destination);

    // Return the resulting MediaStream
    return this.destination.stream;
  }

  async destroyProcessedStream(stream: MediaStream): Promise<void> {
    // Cleanup
    this.background.disconnect();
    this.destination.disconnect();
  }
}

export default BackgroundAudioProcessor;

// class NoiseCancellationAudioProcessor implements AudioProcessor
/*
class NoiseCancellationAudioProcessor extends AudioProcessor {
  constructor() {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
  }

  async init() {
    // Initialize the Krisp SDK
    this.krispSDK = new KrispSDK({
      params: {
        models: {
          modelBVC:
            "/noisecancellation/krisp/latest.js.version/dist/models/model_bvc.kw",
          model8:
            "/noisecancellation/krisp/latest.js.version/dist/models/model_8.kw",
          model16:
            "/noisecancellation/krisp/latest.js.version/dist/models/model_16.kw",
          model32:
            "/noisecancellation/krisp/latest.js.version/dist/models/model_32.kw",
        },
      },
    });
    await this.krispSDK.init();
  }

  async createProcessedStream(stream) {
    if (!this.krispSDK) {
      await this.init();
    }
    // Create Audio Filter
    // This will create an audioworklet processor, and return AudioWorkletNode
    this.filterNode = await this.krispSDK.createNoiseFilter(
      { audioContext, stream },
      () => {
        // Ready callback
        // Enable it once ready
        this.filterNode.enable();
      }
    );

    // Create source and destination
    this.source = audioContext.createMediaStreamSource(stream);
    this.destination = audioContext.createMediaStreamDestination();

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
    if (this.filterNode) {
      this.filterNode.disconnect();
      await this.filterNode.dispose();
    }
  }
}

export default NoiseCancellationAudioProcessor;
*/
