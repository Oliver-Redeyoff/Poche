import * as FileSystem from 'expo-file-system/legacy'
import { Asset } from 'expo-asset'
import { unzip } from 'react-native-zip-archive'

// file:// URI — used for expo-file-system operations (makeDirectory, getInfo, delete)
const MODEL_URI = FileSystem.documentDirectory + 'sherpa-tts/model/'

// Raw path — strips file:// scheme for native C++ code (fopen, sherpa-onnx)
function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, '')
}
const MODEL_PATH = toNativePath(MODEL_URI)

export async function isModelInstalled(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_URI + 'en_US-ryan-medium.onnx')
    return info.exists
  } catch {
    return false
  }
}

export async function installModel(): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_URI, { intermediates: true })

  // expo-asset copies bundled zip to a local file:// URI
  const [asset] = await Asset.loadAsync(require('../assets/sherpa-model.zip'))
  const zipUri = asset.localUri
  if (!zipUri) throw new Error('Could not resolve bundled model asset')

  // SSZipArchive needs raw paths (no file:// scheme) for both source and destination
  try {
    await unzip(toNativePath(zipUri), MODEL_PATH)
  } catch (e) {
    throw new Error(`Failed to extract TTS model: ${e}`)
  }

  const modelExists = await FileSystem.getInfoAsync(MODEL_URI + 'en_US-ryan-medium.onnx')
  if (!modelExists.exists) {
    throw new Error('en_US-ryan-medium.onnx not found after extraction')
  }
}

export function getModelPaths(): {
  modelPath: string
  tokensPath: string
  dataDir: string
} {
  // All paths are raw (no file:// scheme) for the sherpa-onnx C++ library
  return {
    modelPath: MODEL_PATH + 'en_US-ryan-medium.onnx',
    tokensPath: MODEL_PATH + 'tokens.txt',
    dataDir: MODEL_PATH + 'espeak-ng-data',
  }
}

export async function deleteModel(): Promise<void> {
  await FileSystem.deleteAsync(MODEL_URI, { idempotent: true })
}
