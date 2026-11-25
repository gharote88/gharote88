# Whisper Model Asset

`whisper.rn` runs OpenAI Whisper fully on-device with native Marathi (`mr`) support.
Place the model binary here before building.

## Why Whisper instead of Vosk?

Vosk has no Marathi model. Whisper was trained on 96 languages including Marathi
and is the only free, on-device option with verified Marathi support.

## Download

```bash
cd packages/app/assets/whisper

# Tiny model — ~75 MB, good accuracy, fast on modern phones
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin" \
     -o ggml-tiny.bin
```

Alternative — `base` model (~142 MB, better accuracy):
```bash
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin" \
     -o ggml-base.bin
# Then update WHISPER_MODEL_PATH in SpeakingPractice.tsx to ggml-base.bin
```

## Expected result

```
assets/whisper/
  ggml-tiny.bin   (~75 MB)
  README.md
```

## Bundling

`assetBundlePatterns: ["**/*"]` in `app.json` ensures the `.bin` file is
included in the native build automatically. No extra config needed.

## Usage in code

`SpeakingPractice.tsx` calls `initWhisper({ filePath: require(...) })` on mount
and `ctx.transcribe(audioUri, { language: 'mr' })` as the offline fallback
when the HF Whisper / Google STT server is unreachable.
