import { useCallback, useEffect, useRef } from "react";
import { transfer, wrap, type Remote } from "comlink";
import type { HalftoneApi } from "./halftone.worker";
import type { HalftoneParams } from "./halftone";

interface Job {
  params: HalftoneParams;
  resolve: (bitmap: ImageBitmap | null) => void;
  reject: (error: unknown) => void;
}

export function useHalftoneWorker() {
  const api = useRef<Remote<HalftoneApi> | null>(null);
  const queued = useRef<Job | null>(null);
  const busy = useRef(false);

  const pump = useCallback(async () => {
    const remote = api.current;
    const job = queued.current;
    if (busy.current || !remote || !job) return;

    queued.current = null;
    busy.current = true;
    try {
      job.resolve(await remote.render(job.params));
    } catch (error) {
      job.reject(error);
    } finally {
      busy.current = false;
      void pump();
    }
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("./halftone.worker.ts", import.meta.url), { type: "module" });
    api.current = wrap<HalftoneApi>(worker);

    return () => {
      queued.current?.resolve(null);
      queued.current = null;
      api.current = null;
      worker.terminate();
    };
  }, []);

  const setImage = useCallback(async (width: number, height: number, luma: Float32Array) => {
    if (!api.current) throw new Error("worker is not ready");
    await api.current.setImage(transfer({ width, height, luma }, [luma.buffer]));
  }, []);

  const render = useCallback(
    (params: HalftoneParams) =>
      new Promise<ImageBitmap | null>((resolve, reject) => {
        queued.current?.resolve(null);
        queued.current = { params, resolve, reject };
        void pump();
      }),
    [pump]
  );

  return { setImage, render };
}
