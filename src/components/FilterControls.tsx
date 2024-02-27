import { Accessor, createEffect, createMemo, createSignal } from "solid-js";

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

export const FilterControls = (props: { setFilterStyle: (str: string) => void }) => {
  const [filterState, setFilterState] = createSignal({
    brightness: 0.5,
    contrast: 3.2,
    saturation: 3.1,
    blur: 1,
    isEnabled: false,
    // TODO: enable means for gradual dimming
    fadeToBlack: false,
    fadeToBlackTime: 0,
  });
  const setBrightness = (n: number) => setFilterState(f => ({ ...f, brightness: n }))
  const setContrast = (n: number) => setFilterState(f => ({ ...f, contrast: n }));
  const setSaturation = (n: number) => setFilterState(f => ({ ...f, saturation: n }));
  const setBlur = (n: number) => setFilterState(f => ({ ...f, blur: n }));;
  const setEnabled = (n: boolean) => setFilterState(f => ({ ...f, isEnabled: n }));
  const numericControls: Accessor<NumberControl[]> = createMemo(() => [
    {
      name: 'brightness',
      value: filterState().brightness,
      setValue: setBrightness,
      minValue: MIN_BRIGHTNESS,
      maxValue: MAX_BRIGHTNESS,
      step: 0.01
    },
    {
      name: 'contrast',
      value: filterState().contrast,
      setValue: setContrast,
      minValue: MIN_CONTRAST,
      maxValue: MAX_CONTRAST,
    },
    {
      name: 'saturate',
      value: filterState().saturation,
      setValue: setSaturation,
      minValue: MIN_SATURATION,
      maxValue: MAX_SATURATION,
      step: 0.1
    },
    {
      name: 'blur',
      value: filterState().blur,
      setValue: setBlur,
      minValue: 1,
      maxValue: 10,
    }
  ])

  createEffect(() => {
    if (filterState().isEnabled) {
      props.setFilterStyle(`brightness(${filterState().brightness}) contrast(${filterState().contrast}) saturate(${filterState().saturation}) blur(${filterState().blur}px)`);
    } else {
      props.setFilterStyle('');
    }
  })
  return (
    <ul style={{ padding: '0px', 'list-style-type': 'none' }}>
      {numericControls().map(c => (
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
      <li>
        <p style={{ background: 'black', outline: '1px solid white' }}>Filters active: <input type="checkbox" checked={filterState().isEnabled} onChange={() => setEnabled(!filterState().isEnabled)} /></p>
        {filterState().isEnabled
          ? `brightness(${filterState().brightness}) contrast(${filterState().contrast}) saturate(${filterState().saturation}) blur(${filterState().blur}px)`
          : ''
        }
      </li>
    </ul>
  )
}