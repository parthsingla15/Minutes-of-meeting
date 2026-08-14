// Captures system audio (via getDisplayMedia + loopback, handled in main.js)
// mixed with mic input, records it with MediaRecorder, uploads to the
// backend (which responds immediately), then polls for completion since
// the actual transcribe/diarize/summarize pipeline runs in the background.

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
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
    systemStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

    setStatus('Requesting microphone...');
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const systemSource = audioContext.createMediaStreamSource(new MediaStream(systemStream.getAudioTracks()));
    systemSource.connect(destination);

    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    mixedStream = destination.stream;

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(mixedStream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = handleRecordingStop;

    mediaRecorder.start();
    setStatus('Recording...');
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
    stopBtn.style.display = 'block';
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  systemStream?.getTracks().forEach((t) => t.stop());
  micStream?.getTracks().forEach((t) => t.stop());
  pauseBtn.style.display = 'none';
  stopBtn.style.display = 'none';
  startBtn.style.display = 'block';
}

async function handleRecordingStop() {
  setStatus('Saving recording...');
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const arrayBuffer = await blob.arrayBuffer();

  const filePath = await window.electronAPI.getRecordingPath();
  await window.electronAPI.saveRecording(filePath, arrayBuffer);

  setStatus('Uploading to backend...');
  await uploadRecording(blob);
}

async function uploadRecording(blob) {
  const backendUrl = backendUrlInput.value.trim().replace(/\/$/, '');
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');

  try {
    const res = await fetch(`${backendUrl}/meetings/process`, { method: 'POST', body: formData });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Backend error ${res.status}: ${errText}`);
    }

    const { id } = await res.json();
    setStatus('Uploaded. Processing in background (this can take a few minutes)...');
    pollForResult(backendUrl, id);
  } catch (err) {
    console.error(err);
    setStatus(`Upload failed: ${err.message}`);
  }
}

async function pollForResult(backendUrl, id, attempt = 0) {
  const maxAttempts = 60; // ~10 min at 10s intervals
  if (attempt >= maxAttempts) {
    setStatus('Timed out waiting for processing. Check the dashboard later.');
    return;
  }

  try {
    const res = await fetch(`${backendUrl}/meetings/${id}`);
    const data = await res.json();

    if (data.status === 'done') {
      setStatus(`Done — "${data.title}". See the dashboard for full minutes.`);
      return;
    }
    if (data.status === 'failed') {
      setStatus(`Processing failed: ${data.error_message || 'unknown error'}`);
      return;
    }

    setStatus(`Still processing... (${attempt + 1}/${maxAttempts})`);
    setTimeout(() => pollForResult(backendUrl, id, attempt + 1), 10000);
  } catch (err) {
    setStatus(`Error checking status: ${err.message}`);
  }
}

function togglePause() {
  if (!mediaRecorder) return;

  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    setStatus('Paused');
    pauseBtn.textContent = 'Resume';
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    setStatus('Recording...');
    pauseBtn.textContent = 'Pause';
  }
}

startBtn.addEventListener('click', startRecording);
pauseBtn.addEventListener('click', togglePause);
stopBtn.addEventListener('click', stopRecording);