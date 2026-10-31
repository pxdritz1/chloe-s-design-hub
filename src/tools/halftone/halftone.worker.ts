import { expose, transfer } from "comlink";
import { buildDots, buildIntegral, drawDots, type HalftoneParams } from "./halftone";

interface Source {
  width: number;
  height: number;
  integral: Float64Array;
}

let source: Source | null = null;

const api = {
  setImage(image: { width: number; height: number; luma: Float32Array }) {
    source = { width: image.width, height: image.height, integral: buildIntegral(image.luma, image.width, image.height) };
  },

  render(params: HalftoneParams): ImageBitmap {
    if (!source) throw new Error("no image loaded");
    const canvas = new OffscreenCanvas(source.width, source.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d canvas is not available");

    drawDots(ctx, buildDots(source.integral, source.width, source.height, params), source.width, source.height, params);
    const bitmap = canvas.transferToImageBitmap();
    return transfer(bitmap, [bitmap]);
  }
};

export type HalftoneApi = typeof api;

expose(api);
