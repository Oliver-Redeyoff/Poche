import { createStreamingTTS } from 'react-native-sherpa-onnx/tts'
import { getCoreMlSupport } from 'react-native-sherpa-onnx'
import type { StreamingTtsEngine, TtsStreamController } from 'react-native-sherpa-onnx/tts'

class SherpaTtsEngine {
  private engine: StreamingTtsEngine | null = null
  private sid = 0
  private activeController: TtsStreamController | null = null

  async initialize(modelDir: string): Promise<void> {
    if (this.engine) return

    this.engine = await createStreamingTTS({
      modelPath: { type: 'file', path: modelDir },
      modelType: 'kokoro',
      numThreads: 4,
    })
  }

  setSid(sid: number): void {
    this.sid = sid
  }

  /**
   * Generate speech using streaming, accumulate PCM samples from chunks,
   * then write to a WAV file and call onWavReady when the file is ready to play.
   */
  async generateStream(
    text: string,
    speed: number,
    onError: (msg: string) => void
  ): Promise<void> {
    if (!this.engine) {
      onError('SherpaTtsEngine not initialized');
      return;
    }

    console.log(await getCoreMlSupport());

    const sampleRate = await this.engine.getSampleRate();
    await this.engine.startPcmPlayer(sampleRate, 1);

    try {
      const controller = await this.engine.generateSpeechStream(
        text,
        { sid: this.sid, speed },
        {
          onChunk: (chunk) => {
            if (chunk.samples.length > 0) {
              console.log("Generated chunk")
              this.engine?.writePcmChunk(chunk.samples)
            }
          },
          onEnd: async (event) => {
            console.log("FINISheEd Generated chunk")
          },
          onError: (event) => {
            this.activeController = null
            onError(event.message)
          },
        }
      )
      this.activeController = controller
    } catch (e: any) {
      onError(e?.message ?? 'Unknown error')
    }
  }

  stopStream(): void {
    const ctrl = this.activeController
    this.activeController = null
    if (ctrl) {
      try { ctrl.cancel() } catch {}
    }
  }

  dispose(): void {
    this.stopStream()
    if (!this.engine) return
    try { this.engine.destroy() } catch {}
    this.engine = null
  }

  get isInitialized(): boolean {
    return this.engine !== null
  }
}

export const sherpaTtsEngine = new SherpaTtsEngine()
