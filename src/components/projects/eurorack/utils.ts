export interface LogSliderMap {
  toHz: (value: number) => number;
  fromHz: (hz: number) => number;
  steps: number;
}

export function makeLogSliderMap(minHz: number, maxHz: number, steps: number): LogSliderMap {
  const logRatio = Math.log(maxHz / minHz);
  return {
    steps,
    toHz: (value) => minHz * Math.pow(maxHz / minHz, value / steps),
    fromHz: (hz) => Math.round((Math.log(hz / minHz) / logRatio) * steps),
  };
}
