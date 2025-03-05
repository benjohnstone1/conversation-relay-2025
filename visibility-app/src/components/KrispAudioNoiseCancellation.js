// import { AudioProcessor } from "@twilio/voice-sdk";

import KrispSDK from "../dist/krispsdk";

// import models
import model8 from "../dist/models/model_8.kef";
import model_nc_mq from "../dist/models/model_nc_mq.kef";

let audioContext;

class KrispAudioNoiseCancellation {
  constructor() {
    // if (!audioContext) {
    //   const audioContext = new AudioContext();
    // }
    audioContext = new AudioContext();
    this.audioContext = audioContext;
  }

  async init() {
    // Initialize the Krisp SDK
    this.krispSDK = new KrispSDK({
      params: {
        models: {
          model8: model8,
          modelNC: model_nc_mq,
        },
        debugLogs: false,
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
        this.filterNode.enable();
        console.log("Audioprocessor is ready");
        // we should update the component to show when this is ready
      }
    );

    // Create source and destination
    this.source = this.audioContext.createMediaStreamSource(stream); // existing stream
    this.destination = this.audioContext.createMediaStreamDestination(); //this creates the new stream

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

export default KrispAudioNoiseCancellation;
