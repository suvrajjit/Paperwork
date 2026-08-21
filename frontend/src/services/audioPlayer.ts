/**
 * Audio playback service for EasyPaper Conversational Voice Agent.
 * Supports Gemini 24kHz PCM and MP3 base64 audio streams,
 * with bulletproof fallback to browser SpeechSynthesis.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const totalDataLen = pcmData.length;
  const totalFileLen = totalDataLen + 36;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalFileLen, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, totalDataLen, true);

  return new Blob([header, pcmData.buffer as ArrayBuffer], { type: 'audio/wav' });
}

class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Play base64 audio (either MP3 or PCM)
   */
  async playBase64Audio(base64Data: string, format: string = 'mp3'): Promise<void> {
    this.stop();

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBlob: Blob;
      if (format === 'pcm_24khz') {
        audioBlob = pcmToWavBlob(bytes, 24000, 1);
      } else {
        audioBlob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/mp3' });
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(e);
        };

        audio.play().catch(reject);
      });
    } catch (e) {
      console.warn('Error playing base64 audio:', e);
      throw e;
    }
  }

  /**
   * Universal speech player: tries base64 audio, falls back instantly to browser voice synthesis
   */
  async playAudioOrSpeak(options: {
    base64Audio?: string | null;
    format?: string;
    text: string;
    lang?: 'hi' | 'en';
  }): Promise<void> {
    const { base64Audio, format = 'mp3', text, lang = 'hi' } = options;

    if (base64Audio) {
      try {
        await this.playBase64Audio(base64Audio, format);
        return;
      } catch (err) {
        console.warn('Base64 playback failed, using browser speech synthesis fallback:', err);
      }
    }

    if (text) {
      await this.speakText(text, lang);
    }
  }

  /**
   * Browser SpeechSynthesis in Hindi or English
   */
  speakText(text: string, lang: 'hi' | 'en' = 'hi'): Promise<void> {
    this.stop();

    if (!('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const targetLang = lang === 'hi' ? 'hi' : 'en';
      const preferredVoice = voices.find((v) => v.lang.toLowerCase().includes(targetLang));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export const audioPlayer = new AudioPlayerService();
