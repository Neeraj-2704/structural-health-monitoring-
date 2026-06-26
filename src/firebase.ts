import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAbd-G3EVnvOr8AKCr9JnReI7t4-RJh6nM",
  authDomain: "building-health-monitoring.firebaseapp.com",
  databaseURL: "https://building-health-monitoring-default-rtdb.firebaseio.com",
  projectId: "building-health-monitoring",
  storageBucket: "building-health-monitoring.firebasestorage.app",
  messagingSenderId: "951910488145",
  appId: "1:951910488145:web:68e758c86771e667188070",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
