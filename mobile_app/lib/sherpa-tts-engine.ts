import TTSManager from 'react-native-sherpa-onnx-offline-tts'

interface ModelPaths {
  modelPath: string
  tokensPath: string
  dataDir: string
}

class SherpaTtsEngine {
  private initialized = false

  async initialize(paths: ModelPaths): Promise<void> {
    if (this.initialized) return
    const modelId = JSON.stringify({
      modelPath: paths.modelPath,
      tokensPath: paths.tokensPath,
      dataDirPath: paths.dataDir,
    })
    await TTSManager.initialize(modelId)
    this.initialized = true
  }

  /**
   * Generate speech for text and save as a WAV file at outPath.
   * outPath must be a raw filesystem path (no file:// scheme).
   */
  async generateWav(text: string, outPath: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('SherpaTtsEngine not initialized')
    }
    await TTSManager.generateAndSave(text, outPath, 'wav')
  }

  dispose(): void {
    if (!this.initialized) return
    try { TTSManager.deinitialize() } catch {}
    this.initialized = false
  }

  get isInitialized(): boolean {
    return this.initialized
  }
}

export const sherpaTtsEngine = new SherpaTtsEngine()
