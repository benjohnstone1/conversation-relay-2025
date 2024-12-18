import { useState, useEffect, useRef } from "react";
import axios from "axios";
import AudioPlayer from "./AudioPlayer";

import {
  VisualPickerRadioGroup,
  VisualPickerRadio,
  Button,
  Box,
  MediaFigure,
  Text,
  StatusBadge,
  MediaObject,
  MediaBody,
  Stack,
  Heading,
} from "@twilio-paste/core";
import { useToaster, Toaster } from "@twilio-paste/core/dist/toast";

import { CallIcon } from "@twilio-paste/icons/esm/CallIcon";
import { CallFailedIcon } from "@twilio-paste/icons/esm/CallFailedIcon";
import { MicrophoneOffIcon } from "@twilio-paste/icons/esm/MicrophoneOffIcon";
import { MicrophoneOnIcon } from "@twilio-paste/icons/esm/MicrophoneOnIcon";

import UseCaseModal from "./UseCaseModal";
import Visualizer from "./Visualizer";
import audiovisualizer from "../templates/audiovisualizer";
import { initialConfiguration } from "../templates/initialConfiguration";

const UseCasePicker = (props) => {
  const visualizerRef = useRef();

  const useCaseURL = process.env.REACT_APP_GET_USE_CASE_URL;
  // const updateURL = process.env.REACT_APP_UPDATE_USE_CASE_URL;
  const recordingURL = process.env.REACT_APP_RECORDING_URL;

  const [template, setTemplate] = useState("0");
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(initialConfiguration);
  const [isMuted, setMuted] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [call, setCall] = useState(null);

  let activeCall;
  let websocketId;

  const device = props.device;
  const loading = props.loading;

  const toaster = useToaster();

  const handleToast = (message, variant, dismissAfter, id) => {
    toaster.push({
      message: message,
      variant: variant,
      dismissAfter: dismissAfter,
      id: id,
    });
  };

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleConfigure = (e) => {
    setIsOpen(true);
  };
  const handleConfigUpdate = (updatedConfig) => setConfig(updatedConfig);

  const updateWebsocketId = (newId) => {
    console.log("updating websocket ID to: " + newId);
    websocketId = newId;
    callTo();
  };

  const getRecordingURL = async (callSid) => {
    const res = await axios.get(recordingURL + "?callSid=" + callSid);
    const recUrl =
      "https://api.twilio.com/2010-04-01/Accounts/" +
      res.data.accSid +
      "/Recordings/" +
      res.data.recordingSid +
      ".mp3";

    if (res.data.recordingSid) {
      console.log("Recording url is", recUrl);
      setRecordingUrl(recUrl);
    } else {
      console.log("No recording generated");
      setRecordingUrl("");
    }
  };

  const setupCallEventHandlers = (call) => {
    if (!call) {
      console.error("undefined call object");
      return;
    }

    call.on("ringing", function (hasEarlyMedia) {
      console.log("Call ringing now");
      if (hasEarlyMedia) {
        console.log("Has early media");
      }
    });

    call.on("mute", (isMute, call) => {
      console.log("Muted stated is", isMute);
    });

    call.on("cancel", function (conn) {
      console.log("Call cancel");
      setCall(null);
    });

    call.on("reject", function (conn) {
      console.log("Call reject");
      setCall(null);
    });

    call.on("accept", function (conn) {
      // Happens in both incoming and outgoing calls
      console.log("Call direction:", conn.direction);
      if (conn.direction === "INCOMING") {
        console.log("Call accepted");
      } else {
        let to = conn.parameters.To || "test:conversationRelay";
        console.log(
          "Call accepted: " + to + ", Call SID: " + conn.parameters.CallSid + ""
        );
      }
    });

    call.on("disconnect", function (conn) {
      console.log("Call disconnected\n");
      getRecordingURL(conn.parameters.CallSid);
      setCall(null);
    });

    call.on("transportClose", function (conn) {
      console.log("Call transportClose.\n");
      setCall(null);
    });

    call.on("error", function (error) {
      console.log("Call error: " + error.message + " (" + error.code + ")\n");
      setCall(null);
    });

    call.on("warning", function (name) {
      console.log("Network warning: " + name + "\n");
    });

    call.on("warning-cleared", function (name) {
      console.log("Network warning cleared: " + name + "\n");
    });
  };

  const callTo = async () => {
    if (call) {
      console.log("Active call already placed");
      return;
    } else {
      // We also need to check if websocket connection exists
      if (visualizerRef.current && !websocketId) {
        console.log("Initializing websocket connection");
        visualizerRef.current.invokeSetupWebsockToController();
      } else {
        if (!device) {
          handleToast(
            "Please refresh the page, voice device not created",
            "error",
            3000,
            "deviceErrorToast"
          );
          console.log("voice device not created yet");
          return;
        }
        console.log("websocketId is: " + websocketId);
        // Place call
        var params = {
          To: "test:conversationRelay",
          Title: config[template].title,
          uiwebsocketId: websocketId,
        };

        activeCall = await device.connect({ params });
        setupCallEventHandlers(activeCall);
        audiovisualizer.analyze(activeCall);
        // add call to state - needed to persist between renders e.g. when muting/unmuting call
        setCall(activeCall);
      }
    }
  };

  const handleMutePress = async () => {
    if (!call) {
      console.log("No active call");
      return;
    } else {
      isMuted ? setMuted(false) : setMuted(true);
      let mute = call.isMuted();
      console.log("Muting call: ", !mute);
      if (mute) {
        call.mute(false);
      } else {
        call.mute(true);
      }
    }
  };

  const hangupCall = async () => {
    if (!call) {
      console.log("Call object not created yet");
      return;
    } else {
      // Disconnect call
      call.disconnect();
      // Close websocket connection
      websocketId = null;
      if (visualizerRef.current) {
        visualizerRef.current.invokeCloseWebsockToController();
      }
    }
  };

  // const handleUpdate = async (data) => {
  //   try {
  //     const res = await axios.post(updateURL, data);
  //     console.log(res);
  //   } catch (e) {
  //     console.log("Error", e);
  //   }
  // };

  // const resetDemo = async () => {
  //   handleToast(
  //     "Resetting initial use case configuration",
  //     "neutral",
  //     3000,
  //     "resetDemo"
  //   );
  //   setConfig(initialConfiguration);
  //   initialConfiguration.forEach((item) => {
  //     handleUpdate(item);
  //   });
  //   try {
  //     toaster.pop("resetDemo");
  //     handleToast("Refreshed data!", "success", 3000, "resetDemoSuccess");
  //   } catch (e) {
  //     console.log(e);
  //     toaster.pop("resetDemo");
  //     handleToast(
  //       "There was an error refreshing data",
  //       "error",
  //       3000,
  //       "resetDemoError"
  //     );
  //   }
  // };

  useEffect(() => {
    const getConfig = async () => {
      try {
        const config = await axios.get(useCaseURL);
        setConfig(config.data);
      } catch (e) {
        console.log(e);
      }
    };
    getConfig();
  }, [useCaseURL]);

  return (
    <div>
      <Toaster {...toaster} />
      <Stack orientation="horizontal" spacing="space60">
        {/* <Button onClick={resetDemo} variant="secondary" loading={loading}>
          Reset Demo
        </Button> */}
        <Button onClick={callTo} variant="primary" loading={loading}>
          Call <CallIcon decorative={false} title="make call" />
        </Button>
        <Button onClick={hangupCall} variant="destructive" loading={loading}>
          Disconnect
          <CallFailedIcon decorative={false} title="Disconnect" />
        </Button>
        <Button onClick={handleMutePress} variant="secondary">
          {isMuted ? "Muted" : "Mute"}
          {isMuted ? (
            <MicrophoneOffIcon decorative={false} title="Mute" />
          ) : (
            <MicrophoneOnIcon decorative={false} title="UnMute" />
          )}
        </Button>
      </Stack>
      <UseCaseModal
        config={config}
        template={template}
        isOpen={isOpen}
        handleOpen={handleOpen}
        handleClose={handleClose}
        handleConfigUpdate={handleConfigUpdate}
      />
      <VisualPickerRadioGroup
        legend="Select Use Case"
        name="visual-picker"
        value={template}
        onChange={(newTemplate) => {
          setTemplate(newTemplate);
        }}
      >
        {config.map((item, index) => (
          <VisualPickerRadio key={index} value={index.toString()}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <MediaObject verticalAlign="center">
                <MediaFigure spacing="space50"></MediaFigure>
                <MediaBody>
                  <Text as="div" fontWeight="fontWeightSemibold">
                    {item.title}
                  </Text>
                  <Text as="div" color="colorTextWeak">
                    TTS Provider: {item.conversationRelayParams.ttsProvider}{" "}
                    Voice: {item.conversationRelayParams.voice}
                  </Text>
                </MediaBody>
              </MediaObject>
              <Box>
                <MediaObject verticalAlign="center">
                  <MediaFigure spacing="space50"></MediaFigure>
                  <MediaBody>
                    <Text as="div" fontWeight="fontWeightSemibold">
                      Welcome:
                    </Text>
                    <Text as="div" color="colorTextWeak">
                      {item.conversationRelayParams.welcomeGreeting}
                    </Text>
                  </MediaBody>
                </MediaObject>
              </Box>
              <Box display="flex" columnGap="space50">
                {template === index.toString() ? (
                  <StatusBadge as="span" variant="ConnectivityAvailable">
                    Enabled
                  </StatusBadge>
                ) : (
                  <StatusBadge as="span" variant="ConnectivityOffline">
                    Disabled
                  </StatusBadge>
                )}
                <Button onClick={handleConfigure} variant="secondary">
                  Configure
                </Button>
              </Box>
            </Box>
          </VisualPickerRadio>
        ))}
      </VisualPickerRadioGroup>
      <Visualizer
        updateWebsocketId={updateWebsocketId}
        ref={visualizerRef}
        welcomeGreeting={
          config[template].conversationRelayParams.welcomeGreeting
        }
      />

      <Heading as="h2">Twilio Call Recording</Heading>
      <AudioPlayer audioUrl={recordingUrl} />
    </div>
  );
};

export default UseCasePicker;
