import { createMemo, createSignal, onMount } from "solid-js"
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

export const Youtube = () => {
  const [src, setSrc] = createSignal('xXPSe57pOss')
  const [filterStyle, setFilterStyle] = createSignal('');

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
        <NumberControls setFilterStyle={setFilterStyle} />
        <ul style={{ padding: '0px', 'list-style-type': 'none' }}>
          <li>URL/Youtube ID: <input type="text" value={src()} onChange={e => setSrc(e.target.value)} /></li>
        </ul>
      </div>
      <iframe
        style={{
          filter: filterStyle(),
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