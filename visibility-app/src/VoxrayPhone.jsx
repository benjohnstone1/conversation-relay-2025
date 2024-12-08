import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Device } from "@twilio/voice-sdk";
import "./styles/VoxrayPhone.css";
import audiovisualizer from "./templates/audiovisualizer";
// import AudioDevices from "./components/AudioDevices";
// import ReactAudioVisualizer from "./components/ReactAudioVisualizer";
import LatencyVisualizer from "./components/LatencyVisualizer";

// Twilio Paste
import { Theme } from "@twilio-paste/core/dist/theme";
import { Box, Heading, Label } from "@twilio-paste/core";

import UseCasePicker from "./components/UseCasePicker";

export const VoxrayPhone = () => {
  const [device, setDevice] = useState();
  const [loading, setLoading] = useState(true);

  let voiceToken = useRef("");

  const registerTwilioDeviceHandlers = (device) => {
    device.on("incoming", function (conn) {
      console.log(
        "Call incoming: " +
          conn.parameters.From +
          ", Call SID: " +
          conn.parameters.CallSid +
          ""
      );
    });

    device.on("registered", (dev) => {
      console.log("Device ready to receive incoming calls\n");
    });

    device.on("unregistered", (dev) => {
      console.log("Device unregistered\n");
      setDevice(undefined);
    });

    device.on("tokenWillExpire", (dev) => {
      console.log("Device token is expiring\n");
    });

    device.on("error", (dev) => {
      console.log("Device encountered error\n");
      setDevice(undefined);
    });

    device.on("destroyed", (dev) => {
      console.log("Device destroyed\n");
      setDevice(undefined);
    });
  };

  useEffect(() => {
    const registerVoiceClient = async () => {
      if (!voiceToken.current) {
        try {
          const registerVoiceClientURL =
            process.env.REACT_APP_REGISTER_VOICE_CLIENT_URL;
          const res = await axios.get(registerVoiceClientURL);
          voiceToken.current = res.data;
          createVoiceDevice();
        } catch (e) {
          console.log(e);
        }
      }
    };
    const createVoiceDevice = async () => {
      const myDevice = await new Device(voiceToken.current, {
        logLevel: 5,
        codecPreferences: ["opus", "pcmu"],
      });
      setDevice(myDevice);
      setLoading(false);
      myDevice.register();
      registerTwilioDeviceHandlers(myDevice);
    };
    registerVoiceClient();
    audiovisualizer.setupAudioVisualizerCanvas();
  }, []);

  return (
    <Theme.Provider theme="Twilio">
      <Box paddingX="space100">
        <Theme.Provider theme="Twilio">
          <Box display="flex" flexDirection="column">
            <Box padding="space50">
              <Heading as="h2" variant="heading20">
                ConversationRelay Test Client
                {/* <AudioDevices /> */}
              </Heading>
              {/* <DBProfile /> */}
              <UseCasePicker device={device} loading={loading} />
              <Label htmlFor="audio-visualizer">Audio Visualizer</Label>
              <canvas id="audio-visualizer"></canvas>
              {/* <ReactAudioVisualizer /> */}
              <LatencyVisualizer />
            </Box>
          </Box>
        </Theme.Provider>
      </Box>
    </Theme.Provider>
  );
};

export default VoxrayPhone;
