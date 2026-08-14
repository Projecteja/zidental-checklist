/* ============================================================
   FIREBASE SYNC LAYER
   Keeps task templates, daily records, staff accounts, and
   activity logs in sync across every device via Firestore.

   Design: each data type (templates / records / staff / logs) is
   stored as ONE Firestore document containing the whole object,
   mirroring the shape already used in localStorage. This keeps the
   rest of script.js almost untouched — it still reads/writes
   localStorage instantly (so the UI never waits on the network),
   while this module quietly pushes every change to Firestore and
   listens for changes made by OTHER devices, patching localStorage
   + triggering a re-render when they arrive.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAWkE6OYGf1rwmP50PA-ApSQ1HVBzxGUG4",
  authDomain: "zidental-clinic.firebaseapp.com",
  projectId: "zidental-clinic",
  storageBucket: "zidental-clinic.firebasestorage.app",
  messagingSenderId: "83247865046",
  appId: "1:83247865046:web:68c09f0167946564427d77",
};

// All clinic data lives under a single top-level clinic doc. If you ever
// run multiple separate clinics off one Firebase project, change this to
// something unique per clinic (e.g. read from the URL or a setup screen).
const CLINIC_ID = "default";

// Maps the same keys script.js already uses locally to Firestore doc paths.
const DOC_PATHS = {
  templates: `clinics/${CLINIC_ID}/data/task_templates`,
  records: `clinics/${CLINIC_ID}/data/daily_records`,
  staff: `clinics/${CLINIC_ID}/data/clinic_users`,
  logs: `clinics/${CLINIC_ID}/data/activity_logs`,
  settings: `clinics/${CLINIC_ID}/data/clinic_settings`,
};

let app, db;
let ready = false;
const readyCallbacks = [];
// Tracks the last payload WE pushed for each key, so that when our own
// write echoes back through onSnapshot we can skip re-processing it
// (avoids a redundant render and possible flicker).
const lastPushedJSON = {};
// Guards against firing a listener callback for the very first snapshot
// (which is just "here's what's already in the cloud" on page load) when
// we actually want that initial load to flow into localStorage normally —
// so this is intentionally NOT used to block the first snapshot.

function markReady() {
  ready = true;
  readyCallbacks.forEach((cb) => cb());
  readyCallbacks.length = 0;
}

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase init failed — app will run in local-only mode.", err);
  db = null;
} finally {
  markReady();
}

/* Push local data for `key` up to Firestore. Safe to call often; Firestore
   setDoc with the same content is cheap and idempotent. Silently no-ops if
   Firebase failed to initialize (keeps the app fully usable offline). */
function push(key, value) {
  if (!db || !DOC_PATHS[key]) return Promise.resolve();
  const json = JSON.stringify(value);
  lastPushedJSON[key] = json;
  return setDoc(doc(db, DOC_PATHS[key]), {
    payload: json,
    updatedAt: serverTimestamp(),
  }).catch((err) => {
    console.warn(`CloudSync: failed to push "${key}"`, err);
  });
}

/* Subscribe to realtime changes for `key`. `onChange(value, isInitialLoad)`
   fires once immediately with whatever's currently in the cloud (or is
   skipped if there's nothing there yet), and again every time ANY device
   changes that data. Echoes of our own pushes are skipped automatically. */
function subscribe(key, onChange) {
  if (!db || !DOC_PATHS[key]) return () => {};
  let first = true;
  return onSnapshot(doc(db, DOC_PATHS[key]), (snap) => {
    if (!snap.exists()) {
      first = false;
      return;
    }
    const data = snap.data();
    const json = data.payload;
    if (json === lastPushedJSON[key]) {
      // This is just our own write echoing back — ignore it.
      first = false;
      return;
    }
    try {
      const value = JSON.parse(json);
      onChange(value, first);
    } catch (err) {
      console.warn(`CloudSync: bad payload for "${key}"`, err);
    }
    first = false;
  }, (err) => {
    console.warn(`CloudSync: subscription error for "${key}"`, err);
  });
}

function onReady(cb) {
  if (ready) cb();
  else readyCallbacks.push(cb);
}

window.CloudSync = {
  push,
  subscribe,
  onReady,
  get isAvailable() { return !!db; },
};

// Let the rest of the app know sync is wired up (script.js waits for this
// event before doing its first cloud pull, so ordering is never a race).
window.dispatchEvent(new CustomEvent("cloudsync-ready", { detail: { available: !!db } }));
