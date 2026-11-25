declare module 'whisper.rn' {
  export interface WhisperTranscribeOptions {
    language?: string;
    maxLen?: number;
    tokenTimestamps?: boolean;
  }

  export interface WhisperTranscribeResult {
    result: string;
  }

  export interface WhisperContext {
    transcribe(
      audioPath: string,
      options?: WhisperTranscribeOptions
    ): Promise<WhisperTranscribeResult>;
    release(): Promise<void>;
  }

  export interface WhisperInitOptions {
    filePath: string | number;
  }

  export function initWhisper(options: WhisperInitOptions): Promise<WhisperContext>;
}
