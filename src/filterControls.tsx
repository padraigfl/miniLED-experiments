import { Accessor, createMemo, createSignal } from "solid-js";

const MAX_BRIGHTNESS = 1;
const MIN_BRIGHTNESS = 0.05;
const MAX_CONTRAST = 10;
const MIN_CONTRAST = 1;
const MIN_SATURATION = 0.1;
const MAX_SATURATION = 10;


interface NumberControl {
  name: string;
  value: number;
  setValue: (p: number) => void;
  minValue: number;
  maxValue: number;
  step?: number
}

export const createFilterSettings = () => {
  const [brightness, setBrightness] = createSignal(0.5);
  const [contrast, setContrast] = createSignal(3.2);
  const [saturation, setSaturation] = createSignal(3.1);
  const [blur, setBlur] = createSignal(1);
  const [isEnabled, setEnabled] = createSignal(false);
  const numericControls: Accessor<NumberControl[]> = createMemo(() => [
    {
      name: 'brightness',
      value: brightness(),
      setValue: setBrightness,
      minValue: MIN_BRIGHTNESS,
      maxValue: MAX_BRIGHTNESS,
      step: 0.01
    },
    {
      name: 'contrast',
      value: contrast(),
      setValue: setContrast,
      minValue: MIN_CONTRAST,
      maxValue: MAX_CONTRAST,
    },
    {
      name: 'saturate',
      value: saturation(),
      setValue: setSaturation,
      minValue: MIN_SATURATION,
      maxValue: MAX_SATURATION,
      step: 0.1
    },
    {
      name: 'blur',
      value: blur(),
      setValue: setBlur,
      minValue: 1,
      maxValue: 10,
    }
  ])
  return {
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation,
    blur,
    setBlur,
    isEnabled,
    setEnabled,
    numericControls,
    filterCssObject: isEnabled()
      ? `brightness(${brightness()}) contrast(${contrast()}) saturate(${saturation()}) blur(${blur()}px)`
      : ''
  }
}

export const NumberControls = (props: { controls: NumberControl[] }) => {
  return (
    <ul style={{ padding: '0px', 'list-style-type': 'none' }}>
      {props.controls.map(c => (
        <li style={{ display: 'flex' }}>
          { c.name }
          <input
            style={{ 'margin-left': 'auto' }}
            type="range"
            min={c.minValue}
            max={c.maxValue}
            value={c.value}
            onChange={e => c.setValue(+e.target.value)}
            step={c.step || 1}
          />
          <input
            style={{ width: '60px'}}
            type="number"
            min={c.minValue}
            max={c.maxValue}
            value={c.value}
            onChange={e => c.setValue(+e.target.value)}
            step={c.step || 1}
          />
        </li>
      ))}
    </ul>
  )
}