// utils/fallModel.js (Huzaifa Stable Fall Model – FINAL)

function magnitude(sample) {
  const { x = 0, y = 0, z = 0 } = sample;
  return Math.sqrt(x*x + y*y + z*z);
}

function extractFeatures(window) {
  const mags = window.map(magnitude);
  const n = mags.length || 1;

  const mean = mags.reduce((s,v)=>s+v,0)/n;

  let variance = 0;
  for (let v of mags) variance += (v-mean)**2;
  variance /= n;

  const max = Math.max(...mags);
  const min = Math.min(...mags);
  const range = max - min;

  const freeFallCount = mags.filter(m => m < 0.8).length;   // Expo freefall realistic threshold
  const impactCount = mags.filter(m => m > 1.6).length;      // Expo impact realistic threshold

  let jerk = 0;
  for (let i = 1; i < mags.length; i++) {
    jerk += Math.abs(mags[i] - mags[i-1]);
  }

  return { mean, variance, max, min, range, jerk, freeFallCount, impactCount, n };
}

export function predict(window) {
  if (!window || window.length === 0)
    return { probability:0, label:"no_fall", scores:{} };

  const f = extractFeatures(window);

  // normalized weights
  const w_freefall = f.freeFallCount / f.n;         // 0–1
  const w_impact = f.impactCount / f.n;             // 0–1
  const w_range = Math.min(1, f.range / 1.0);       // normalized for expo
  const w_jerk = Math.min(1, f.jerk / (f.n*0.5));   // faster scaling

  // raw score (Expo tuned)
  let raw = 
      1.4 * w_freefall +
      1.6 * w_impact +
      0.6 * w_range +
      0.4 * w_jerk;

  // dynamic boost for sudden spike
  if (f.max > 1.8) raw += 0.6;
  if (f.min < 0.7) raw += 0.3;

  // sigmoid for prob
  const prob = 1 / (1 + Math.exp(-(raw - 1.0)));  // easier threshold

  return {
    probability: Number(prob.toFixed(3)),
    label: prob > 0.35 ? "fall" : "no_fall",      // expo tuned threshold
    scores: {
      freefallRatio: w_freefall.toFixed(3),
      impactRatio: w_impact.toFixed(3),
      range: f.range.toFixed(3),
      jerk: w_jerk.toFixed(3),
      rawScore: raw.toFixed(3)
    }
  };
}

export default { predict };
