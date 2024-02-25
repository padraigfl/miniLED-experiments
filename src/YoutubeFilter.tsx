import { Accessor, createMemo, createSignal, onMount } from "solid-js"
import controlStyles from './Controls.module.css';
import { NumberControls } from "./filterControls";

interface NumberControl {
  name: string;
  value: number;
  setValue: (p: number) => void;
  minValue: number;
  maxValue: number;
  step?: number
}


const MAX_BRIGHTNESS = 1;
const MIN_BRIGHTNESS = 0.05;
const MAX_CONTRAST = 10;
const MIN_CONTRAST = 1;
const MIN_SATURATION = 0.1;
const MAX_SATURATION = 10;
export const Youtube = () => {
  const [brightness, setBrightness] = createSignal(0.35);
  const [contrast, setContrast] = createSignal(3.2);
  const [saturation, setSaturation] = createSignal(3.1);
  const [blur, setBlur] = createSignal(1);
  const [isEnabled, setEnabled] = createSignal(true);
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
  const [src, setSrc] = createSignal('xXPSe57pOss')

  const parsedSource = createMemo(() => {
    const source = src()
    const isYoutube = [`youtube.`, `youtu.be`].some(youtubePattern => src().includes(youtubePattern))
      || source.trim().match(/^[A-Za-z0-9]{9,13}$/)
    if (isYoutube) {
      const youtubeId = src().match(/[A-Za-z0-9]{9,13}/)?.[0]
      if (youtubeId) {
        return `https://www.youtube.com/embed/${youtubeId}`
      }
    }
    if (!source.match(/^https?/)) {
      return `https://${source}`
    }
    return src()
  })

  onMount(() => {
    const focus = () => {
      console.log('mount')
      const optionsEl = document.querySelector('#options')
      setTimeout(() => {
        const focusableOption = optionsEl?.querySelector('input[type=checkbox]') as HTMLElement
        focusableOption?.focus?.()
      }, 50)
    }
    focus()
  })
  return (
    <>
      <div id="options" class={controlStyles.hoverVisible} style={{ padding: '4px', 'background-color': 'black', color: 'white', border: '2px solid white', position: 'absolute', "z-index": '10', width: '100%', 'max-width': '320px' }}>
        <p>This is a set of basic filters to let youtube videos played with a strong push towards black on screen. Allowing for low light video play in a dark room.</p>
        <p>Brightness is initially applied, so you can darken the image as much as required beyond brightness control limits. Then contrast is applied to kill off lingering slightly lit areas (this can remove a lot of screen bright patches on MiniLED). Finally saturation is applied to bring back some colour removed earlier.</p>
        <NumberControls controls={numericControls()} />
        <ul style={{ padding: '0px', 'list-style-type': 'none' }}>
          <li>URL/Youtube ID: <input type="text" value={src()} onChange={e => setSrc(e.target.value)} /></li>
          <li>Is Active: <input type="checkbox" checked={isEnabled()} onClick={e => setEnabled(!isEnabled())} /></li>
        </ul>
      </div>
      <iframe
        style={{
          filter: isEnabled()
            ? `brightness(${brightness()}) contrast(${contrast()}) saturate(${saturation()}) blur(${blur()}px)`
            : '',
          height: 'calc(100vh - 4px)',
          width: '100vw',
          border: 'none',
        }}
        allow="camera;microphone"
        src={parsedSource()}
      />
      <div style={{ width: '25px', height: '25px', position: 'absolute', bottom: '0px', left: '0px', cursor: 'none' }} />
    </>
  )
}