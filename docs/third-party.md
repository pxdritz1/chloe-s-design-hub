# third-party

## u²-net (u2netp)

- used by the background remover, stored at `public/models/u2netp.onnx` and loaded locally in a web worker
- authors: xuebin qin et al., [u²-net](https://github.com/xuebinqin/U-2-Net), apache-2.0
- weights as published in the [rembg releases](https://github.com/danielgatis/rembg/releases/tag/v0.0.0) (md5 `8e83ca70e441ab06c318d82300c84806`)

## onnx runtime web

- runs the model in the browser through webassembly, mit license, [onnxruntime](https://github.com/microsoft/onnxruntime)
- the `.wasm` file is bundled from the npm package at build time

## fonts

- inter variable, self-hosted through `@fontsource-variable/inter` (sil open font license) as a fallback
- sf pro is never bundled: it is only used when it is already installed on the visitor's system

## sidebar content

- random article summaries and thumbnails come from the localized Wikipedia REST API
- article titles link to their original pages; reused Wikipedia content remains subject to the applicable attribution and share-alike terms
- daily quotes use public endpoints by interface language: ferramentasdaweb for portuguese, FraseDelDia for spanish, and Dumb APIs for english
- quote providers are external services; localized fallback text is shown when a provider is unavailable

## wallpaper studio references

- the wallpaper generator's shape, pattern and palette workflow takes inspiration from the public Dux Labs wallpaper generator
- the implementation in this project is original and does not reuse Dux Labs source code
