import { useCallback, useEffect, useRef } from "react";
import { transfer, wrap, type Remote } from "comlink";
import type { BackgroundApi } from "./background.worker";

const modelUrl = `${import.meta.env.BASE_URL}models/u2netp.onnx`;

export function useBackgroundWorker() {
  const api = useRef<Remote<BackgroundApi> | null>(null);
  const ready = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./background.worker.ts", import.meta.url), { type: "module" });
    api.current = wrap<BackgroundApi>(worker);

    return () => {
      api.current = null;
      ready.current = null;
      worker.terminate();
    };
  }, []);

  const loadModel = useCallback(() => {
    const remote = api.current;
    if (!remote) return Promise.reject(new Error("worker is not ready"));
    ready.current ??= remote.init(modelUrl).catch((error: unknown) => {
      ready.current = null;
      throw error;
    });
    return ready.current;
  }, []);

  const predict = useCallback(async (data: Uint8ClampedArray, width: number, height: number) => {
    const remote = api.current;
    if (!remote) throw new Error("worker is not ready");
    const copy = new Uint8ClampedArray(data);
    return remote.predict(transfer({ data: copy, width, height }, [copy.buffer]));
  }, []);

  return { loadModel, predict };
}
