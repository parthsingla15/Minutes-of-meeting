// Captures system audio (via getDisplayMedia + loopback, handled in main.js)
// mixed with mic input, records it with MediaRecorder, then uploads the
// resulting file to the FastAPI backend's /meetings/process endpoint.
//
// NOTE on platform support:
// - Windows: works out of the box via Chromium's desktopCapturer loopback.
// - macOS: Chromium's desktopCapturer does NOT capture system audio.
//   You need a virtual audio device (BlackHole) selected as an input,
//   or wire up native ScreenCaptureKit capture separately. This scaffold
//   assumes Windows-first, per Phase 2 of the project plan.

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const backendUrlInput = document.getElementById('backendUrl');

let mediaRecorder;
let recordedChunks = [];
let systemStream;
let micStream;
let mixedStream;

function setStatus(text) {
  statusEl.textContent = text;
}

async function startRecording() {
  try {
    setStatus('Requesting system audio...');

    // System audio (speaker output) via loopback — handled by the
    // setDisplayMediaRequestHandler in main.js.
    systemStream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // required by the API even though we discard it
      audio: true,
    });

    setStatus('Requesting microphone...');
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Mix system audio + mic into one stream using the Web Audio API.
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const systemSource = audioContext.createMediaStreamSource(
      new MediaStream(systemStream.getAudioTracks())
    );
    systemSource.connect(destination);

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    mixedStream = destination.stream;

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mixedStream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = handleRecordingStop;

    mediaRecorder.start();
    setStatus('Recording...');
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  // Stop all tracks so the OS-level capture indicator goes away.
  systemStream?.getTracks().forEach((t) => t.stop());
  micStream?.getTracks().forEach((t) => t.stop());
  stopBtn.style.display = 'none';
  startBtn.style.display = 'block';
}

async function handleRecordingStop() {
  setStatus('Saving recording...');
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const arrayBuffer = await blob.arrayBuffer();

  const filePath = await window.electronAPI.getRecordingPath();
  await window.electronAPI.saveRecording(filePath, arrayBuffer);

  setStatus('Uploading to backend for processing...');
  await uploadRecording(blob);
}

async function uploadRecording(blob) {
  const backendUrl = backendUrlInput.value.trim().replace(/\/$/, '');
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');

  try {
    const res = await fetch(`${backendUrl}/meetings/process`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('Meeting minutes:', data);
    setStatus(`Done — "${data.minutes.title}". See console/dashboard for full minutes.`);
  } catch (err) {
    console.error(err);
    setStatus(`Upload failed: ${err.message}`);
  }
}

startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
