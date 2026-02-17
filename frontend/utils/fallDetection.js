// utils/fallDetection.js (Working Stable Version – Huzaifa Fix)

import fallModel from "./fallModel";

export default function createWindowedFallDetector({
  windowSize = 20,      // faster window
  step = 4,             // run model more frequently
  threshold = 0.30,     // realistic threshold for your model
  minImpactFreefallSequence = true,
  onFall = () => {},
  cooldownMs = 4000,    // faster recovery
} = {}) {

  let buffer = [];
  let samplesSincePredict = 0;
  let lastFallAt = 0;

  function addSample(sample) {
    // push new data
    buffer.push(sample);

    // maintain window size
    if (buffer.length > windowSize) {
      buffer.shift();
    }

    // prediction frequency
    samplesSincePredict++;
    if (samplesSincePredict >= step) {
      samplesSincePredict = 0;
      runPredict();
    }
  }

  function runPredict() {
    // need at least 40% window filled
    if (buffer.length < Math.floor(windowSize * 0.4)) return;

    const result = fallModel.predict(buffer);
    const prob = result?.probability ?? 0;

    const freefall = result.scores?.freefallRatio ?? 0;
    const impact = result.scores?.impactRatio ?? 0;

    const now = Date.now();
    if (now - lastFallAt < cooldownMs) return;

    // realistic constraints for your current model
    const sequencePass = !minImpactFreefallSequence ||
      (freefall > 0.02 && impact > 0.02);

    if (prob >= threshold && sequencePass) {
      lastFallAt = now;

      try {
        onFall(result);
      } catch (e) {
        console.warn("onFall error:", e);
      }

      // IMPORTANT: do NOT clear buffer fully
      buffer = buffer.slice(-10);  // keep last samples to avoid missing repeated events
    }
  }

  function reset() {
    buffer = [];
    samplesSincePredict = 0;
    lastFallAt = 0;
  }

  function dispose() {
    reset();
  }

  return { addSample, reset, dispose };
}
