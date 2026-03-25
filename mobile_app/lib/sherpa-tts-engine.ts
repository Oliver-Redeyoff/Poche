import { createStreamingTTS, saveAudioToFile } from 'react-native-sherpa-onnx/tts'
import type { StreamingTtsEngine, TtsStreamController } from 'react-native-sherpa-onnx/tts'

class SherpaTtsEngine {
  private engine: StreamingTtsEngine | null = null
  private sid = 0
  private activeController: TtsStreamController | null = null

  async initialize(modelDir: string): Promise<void> {
    if (this.engine) return
    this.engine = await createStreamingTTS({
      modelPath: { type: 'file', path: modelDir },
      modelType: 'vits',
      numThreads: 4,
    })
  }

  setSid(sid: number): void {
    this.sid = sid
  }

  /**
   * Generate speech via streaming, accumulate all PCM chunks, save as WAV, then call onWavReady.
   */
  async generateStream(
    text: string,
    speed: number,
    wavUri: string,
    onWavReady: () => void,
    onCancelled: () => void,
    onError: (msg: string) => void,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (!this.engine) { onError('SherpaTtsEngine not initialized'); return }

    const chunks: number[][] = []
    let totalSamples = 0
    let sampleRate = 0

    try {
      const controller = await this.engine.generateSpeechStream(
        text,
        { sid: this.sid, speed },
        {
          onChunk: (chunk) => {
            if (chunk.samples.length > 0) {
              if (sampleRate === 0) sampleRate = chunk.sampleRate
              chunks.push(chunk.samples)
              totalSamples += chunk.samples.length
              onProgress?.(chunk.progress)
            }
          },
          onEnd: async (event) => {
            this.activeController = null
            if (event.cancelled) { onCancelled(); return }
            if (totalSamples === 0) { onError('no audio generated'); return }
            // Flatten chunk arrays without using spread/apply (avoids stack overflow)
            const allSamples: number[] = new Array(totalSamples)
            let offset = 0
            for (const c of chunks) {
              for (let i = 0; i < c.length; i++) allSamples[offset++] = c[i]
            }
            try {
              await saveAudioToFile(
                { samples: allSamples, sampleRate },
                wavUri.replace(/^file:\/\//, '')
              )
              onWavReady()
            } catch (e: any) {
              onError(e?.message ?? 'Failed to save audio')
            }
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
