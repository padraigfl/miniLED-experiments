import { Accessor, createMemo, createRenderEffect, createSignal, onMount } from "solid-js"
import controlStyles from './Controls.module.css';

interface NumberControl {
  name: string;
  value: number;
  setValue: (p: number) => void;
  minValue: number;
  maxValue: number;
  step?: number
}

const NumberControls = (props: { controls: NumberControl[] }) => {
  return (
    <ul>
      {props.controls.map(c => (
        <li>
          { c.name }
          <input
            type="range"
            min={c.minValue}
            max={c.maxValue}
            value={c.value}
            onChange={e => c.setValue(+e.target.value)}
            step={c.step || 1}
          />
          <input
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

const MAX_BRIGHTNESS = 1;
const MIN_BRIGHTNESS = 0.05;
const MAX_CONTRAST = 10;
const MIN_CONTRAST = 1;
const MIN_SATURATION = 0.1;
const MAX_SATURATION = 9;
export const Youtube = () => {
  const [brightness, setBrightness] = createSignal(0.35);
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
    },
    {
      name: 'blur',
      value: blur(),
      setValue: setBlur,
      minValue: 1,
      maxValue: 10,
    }
  ])
  const [src, setSrc] = createSignal('xXPSe57pOss')

  onMount(() => {
    const focus = () => {
      console.log('mount')
      const optionsEl = document.querySelector('#options')
      setTimeout(() => {
        const focusableOption = optionsEl?.querySelector('input[type=checkbox]')
        focusableOption.focus()
      }, 50)
    }
    focus()
  })
  return (
    <div>
      <div id="options" class={controlStyles.hoverVisible} style={{ padding: '4px', 'background-color': 'black', color: 'white', border: '2px solid white', position: 'absolute', width: '20vw', height: '25vw', "z-index": '10' }}>
        <p>This is a set of basic filters to let youtube videos played with a strong push towards black on screen. Allowing for low light video play in a dark room.</p>
        <p>Brightness is initially applied, so you can darken the image as much as required beyond brightness control limits. Then contrast is applied to kill off lingering slightly lit areas (this can remove a lot of screen bright patches on MiniLED). Finally saturation is applied to bring back some colour removed earlier.</p>
        <NumberControls controls={numericControls()} />
        <ul>
          <li>Youtube ID: <input type="text" value={src()} onChange={e => setSrc(e.target.value)} /></li>
          <li>Is Active: <input type="checkbox" checked={isEnabled()} onClick={e => setEnabled(!isEnabled())} /></li>
        </ul>
      </div>
      <iframe
        style={{
          filter: isEnabled()
            ? `brightness(${brightness()}) contrast(${contrast()}) saturate(${saturation()}) blur(${blur()}px)`
            : '',
          height: '100vh',
          width: '100vw' 
        }}
        src={`https://www.youtube.com/embed/${src()}`}
      />
    </div>
  )
}