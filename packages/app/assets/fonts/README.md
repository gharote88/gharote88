# Font Assets

Place the following `.ttf` files in this directory before building:

| File | Source |
|------|--------|
| `Poppins-Bold.ttf` | https://fonts.google.com/specimen/Poppins — download "Bold 700" |
| `Poppins-Regular.ttf` | https://fonts.google.com/specimen/Poppins — download "Regular 400" |
| `OpenSans-Regular.ttf` | https://fonts.google.com/specimen/Open+Sans — download "Regular 400" |
| `NotoSansDevanagari-Regular.ttf` | https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari — download "Regular 400" |

## Quick download (macOS/Linux)

```bash
cd packages/app/assets/fonts

# Poppins
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf" -o Poppins-Bold.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf" -o Poppins-Regular.ttf

# Open Sans
curl -L "https://github.com/google/fonts/raw/main/apache/opensans/static/OpenSans-Regular.ttf" -o OpenSans-Regular.ttf

# Noto Sans Devanagari
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf" -o NotoSansDevanagari-Regular.ttf
```

These files are loaded in `_layout.tsx` via `expo-font`'s `useFonts` hook.
Font names registered: `Poppins-Bold`, `Poppins-Regular`, `OpenSans-Regular`, `NotoSansDevanagari-Regular`.
