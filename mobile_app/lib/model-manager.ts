import * as FileSystem from 'expo-file-system/legacy'
import { Asset } from 'expo-asset'
import { unzip } from 'react-native-zip-archive'

// file:// URI — used for expo-file-system operations (makeDirectory, getInfo, delete)
const MODEL_URI = FileSystem.documentDirectory + 'sherpa-tts/vits/'

// Raw path — strips file:// scheme for native C++ code (fopen, sherpa-onnx)
function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, '')
}
const MODEL_PATH = toNativePath(MODEL_URI)

// The zip extracts into a subdirectory matching the zip name
const MODEL_SUBDIR = 'vits-piper-en_US-hfc_female-medium-int8/'
const MODEL_ONNX = MODEL_SUBDIR + 'en_US-hfc_female-medium.onnx'

export async function isModelInstalled(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_URI + MODEL_ONNX)
    return info.exists
  } catch {
    return false
  }
}

export async function installModel(): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_URI, { intermediates: true })

  // expo-asset copies bundled zip to a local file:// URI
  const [asset] = await Asset.loadAsync(require('../assets/vits-piper-en_US-hfc_female-medium-int8.zip'))
  const zipUri = asset.localUri
  if (!zipUri) throw new Error('Could not resolve bundled model asset')

  // SSZipArchive needs raw paths (no file:// scheme) for both source and destination
  try {
    await unzip(toNativePath(zipUri), MODEL_PATH)
  } catch (e) {
    throw new Error(`Failed to extract TTS model: ${e}`)
  }

  console.log(await FileSystem.getInfoAsync(MODEL_URI))
  const modelExists = await FileSystem.getInfoAsync(MODEL_URI + MODEL_ONNX)
  if (!modelExists.exists) {
    throw new Error(`${MODEL_ONNX} not found after extraction`)
  }
}

/**
 * Returns the raw directory path (no file:// scheme) where the model is extracted.
 * Used by react-native-sherpa-onnx's createTTS({ modelPath: { type: 'file', path } }).
 */
export function getModelDir(): string {
  return MODEL_PATH + MODEL_SUBDIR
}

export async function deleteModel(): Promise<void> {
  await FileSystem.deleteAsync(MODEL_URI, { idempotent: true })
}
