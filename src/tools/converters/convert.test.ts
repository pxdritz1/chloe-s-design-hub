import { describe, expect, it } from "vitest";
import { changeLabel, fitWidth, formatBytes, frameTimes, outputName, scaledSize } from "./convert";

describe("converter helpers", () => {
  it("renames files for the new format", () => {
    expect(outputName("photo.final.PNG", "jpeg")).toBe("photo.final.jpg");
    expect(outputName("noext", "webp")).toBe("noext.webp");
    expect(outputName(".png", "png")).toBe("image.png");
  });

  it("formats sizes in lowercase units", () => {
    expect(formatBytes(512)).toBe("512 b");
    expect(formatBytes(2048)).toBe("2.0 kb");
    expect(formatBytes(204800)).toBe("200 kb");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 mb");
  });

  it("describes size changes", () => {
    expect(changeLabel(1000, 250)).toBe("−75%");
    expect(changeLabel(1000, 1500)).toBe("+50%");
    expect(changeLabel(1000, 1000)).toBe("0%");
    expect(changeLabel(0, 10)).toBe("");
  });

  it("spaces gif frames evenly", () => {
    expect(frameTimes(2, 1, 4)).toEqual([2, 2.25, 2.5, 2.75]);
    expect(frameTimes(0, 0, 10)).toHaveLength(1);
  });

  it("fits and scales sizes without distorting", () => {
    expect(fitWidth(1920, 1080, 480)).toEqual({ width: 480, height: 270 });
    expect(fitWidth(300, 200, 480)).toEqual({ width: 300, height: 200 });
    expect(scaledSize(101, 51, 0.5)).toEqual({ width: 51, height: 26 });
  });
});
