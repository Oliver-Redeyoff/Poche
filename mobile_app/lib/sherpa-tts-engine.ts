import { createTTS, saveAudioToFile, type TtsEngine as SherpaEngine } from 'react-native-sherpa-onnx/tts'

class SherpaTtsEngine {
  private engine: SherpaEngine | null = null
  private sid = 0

  async initialize(modelDir: string): Promise<void> {
    if (this.engine) return
    this.engine = await createTTS({
      modelPath: { type: 'file', path: modelDir },
      modelType: 'kokoro',
      provider: 'coreml',  // Apple Neural Engine / GPU acceleration
      numThreads: 4,        // CPU fallback threads for ops not handled by CoreML
    })
  }

  setSid(sid: number): void {
    this.sid = sid
  }

  /**
   * Generate speech for text and write as a WAV file at wavUri (file:// URI).
   */
  async generateWav(text: string, wavUri: string): Promise<void> {
    if (!this.engine) throw new Error('SherpaTtsEngine not initialized')
    const audio = await this.engine.generateSpeech(text, { sid: this.sid, speed: 1.0 })
    // saveAudioToFile needs a raw path (no file:// scheme)
    await saveAudioToFile(audio, wavUri.replace(/^file:\/\//, ''))
  }

  dispose(): void {
    if (!this.engine) return
    try { this.engine.destroy() } catch {}
    this.engine = null
  }

  get isInitialized(): boolean {
    return this.engine !== null
  }
}

export const sherpaTtsEngine = new SherpaTtsEngine()
