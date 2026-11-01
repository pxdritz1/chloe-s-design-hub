import { expose, transfer } from "comlink";
import * as ort from "onnxruntime-web/wasm";
import wasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";
import { modelSize, normalizeMask, toModelInput } from "./mask";

let session: ort.InferenceSession | null = null;

const api = {
  async init(modelUrl: string) {
    if (session) return;
    ort.env.wasm.wasmPaths = { wasm: wasmUrl };
    ort.env.wasm.numThreads = 1;

    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error(`could not load the model (${response.status})`);
    session = await ort.InferenceSession.create(new Uint8Array(await response.arrayBuffer()), { executionProviders: ["wasm"] });
  },

  async predict(image: { data: Uint8ClampedArray; width: number; height: number }) {
    const current = session;
    const inputName = current?.inputNames[0];
    const outputName = current?.outputNames[0];
    if (!current || !inputName || !outputName) throw new Error("the model is not loaded");

    const input = new ort.Tensor("float32", toModelInput(image.data, image.width, image.height), [1, 3, modelSize, modelSize]);
    const outputs = await current.run({ [inputName]: input });
    const output = outputs[outputName];
    if (!output || !(output.data instanceof Float32Array)) throw new Error("unexpected model output");

    const mask = normalizeMask(output.data);
    return transfer(mask, [mask.buffer]);
  }
};

export type BackgroundApi = typeof api;

expose(api);
