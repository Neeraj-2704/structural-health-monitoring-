import mqtt from "mqtt";

const client = mqtt.connect(
  "wss://65fdc184d5de48429b8af5e456cbba27.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "esp32",
    password: "Pandu@143",
    protocol: "wss",
    reconnectPeriod: 2000,
  }
);

export default client;