declare module 'soundtouchjs' {
    export class SoundTouch {
      constructor(sampleRate?: number)
      pitch: number
      tempo: number
      rate: number
    }
  
    export class SimpleFilter {
      constructor(source: any, pipe: any)
      extract(target: Float32Array, numFrames: number): number
    }
  
    export function getWebAudioNode(
      context: AudioContext,
      filter: SimpleFilter,
      bufferSize?: number
    ): ScriptProcessorNode
  }