document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
  
    let mediaRecorder;
    let chunks = [];
  
    // Start recording when the start button is clicked
    startBtn.addEventListener('click', () => {
      startBtn.disabled = true;
      stopBtn.disabled = false;
  
      chunks = [];
  
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream);
  
          mediaRecorder.addEventListener('dataavailable', event => {
            chunks.push(event.data);
          });
  
          mediaRecorder.start();
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
        });
    });
  
    // Stop recording when the stop button is clicked
    stopBtn.addEventListener('click', () => {
      startBtn.disabled = false;
      stopBtn.disabled = true;
  
      mediaRecorder.stop();
  
      // Convert the recorded audio from WebM to MP3 format
      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
  
        reader.onload = () => {
          const audioBuffer = reader.result;
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const webmAudio = new Audio(audioBuffer);

          const source = audioContext.createMediaElementSource(webmAudio);
          const destination = audioContext.createMediaStreamDestination();
          const encoder = audioContext.createScriptProcessor(2048, 1, 1);
  
          source.connect(encoder);
          encoder.connect(destination);
  
          encoder.onaudioprocess = event => {
            const buffer = event.inputBuffer.getChannelData(0);
            const convertedBuffer = convertFloat32ToInt16(buffer);
            const audioData = interleavedToWav(convertedBuffer, audioContext.sampleRate);
  
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
  
            // Do something with the converted MP3 audio URL
            console.log('Converted MP3 audio URL:', audioUrl);
          };
  
          webmAudio.play();

        };
  
        reader.readAsArrayBuffer(blob);
      });
    });
  
    // Helper function to convert Float32Array to Int16Array
    function convertFloat32ToInt16(buffer) {
      const len = buffer.length;
      const intBuffer = new Int16Array(len);
  
      for (let i = 0; i < len; i++) {
        intBuffer[i] = buffer[i] * 0x7fff;
      }
  
      return intBuffer;
    }
  
    // Helper function to convert interleaved Int16Array to WAV audio data
    function interleavedToWav(input, sampleRate) {
      const dataLength = input.length * 2;
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);
  
      // WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // Mono channel
      view.setUint32(24, sampleRate, true); // Sample rate
      view.setUint32(28, sampleRate * 2, true); // Byte rate (Sample rate * Byte per sample * Channel)
      view.setUint16(32, 2, true); // Byte per sample * Channel
      view.setUint16(34, 16, true); // Bits per sample
      writeString(view, 36, 'data');
      view.setUint32(40, dataLength, true);

      
      // PCM audio data
      const offset = 44;
      for (let i = 0; i < input.length; i++, offset += 2) {
        view.setInt16(offset, input[i], true);
      }
  
      return view;
    }
  
    // Helper function to write string to DataView
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
  });
  
