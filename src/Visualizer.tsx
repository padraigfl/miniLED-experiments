import { Component, createEffect, createRenderEffect, createSignal } from 'solid-js';

import logo from './logo.svg';
import styles from './Visualizer.module.css';

let i = 0;
let timeoutHandle: number;
let resizeTimeoutHandle: number;
let pixels = 2040
const cells = new Array(pixels).fill(null)
let audioReady = false;

const PIXEL_SIZE = 60
const getPixelTotal = () => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const pixelCols = Math.floor(window.innerWidth / PIXEL_SIZE);
  const pixelRows = Math.floor(window.innerHeight / PIXEL_SIZE);
  const pixels = pixelCols * pixelRows;
  return pixels;
}

const getStreamObject = () => {
  if (navigator.mediaDevices) {
    console.log("getUserMedia supported.");
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        return stream;
      })
  }
}

const audioAnalyserSetup = (stream: MediaStream) => {
  const ac = new AudioContext()
  console.log('ac')
  const source = ac.createMediaStreamSource(stream);
  const analyser = ac.createAnalyser();
  const gainNode = ac.createGain()
  gainNode.gain.value = 1 // 10 %
  source.connect(gainNode)
  source.connect(analyser);
  analyser.connect(gainNode)
  analyser.fftSize = 1024;
  // analyser.minDecibels = -90;
  analyser.maxDecibels = -50;
  analyser.minDecibels = -70
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  let j = 0
  function draw() {
    if (j % 10 === 0)
      console.log(`---${j}----`)
    // const drawVisual = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    const cells = [...document.querySelectorAll('[id^=cell-]')]

    console.log(cells.length)
    for (let i = 0; i < bufferLength; i++) {
      if (
        dataArray[i] < 113
        || dataArray[i] > 138
      ) {
        console.log([...dataArray].reduce((a,b) => a+b) / dataArray.length)
        const fade = Math.abs(dataArray[i] - 128)
        let pixelIdx = Math.floor(pixels * (i / bufferLength))
        if (cells[pixelIdx]) {
          styleCell(cells[pixelIdx], fade*5, dataArray[i])
          setTimeout(() => clearCell(cells[pixelIdx]), 100)
        }
      }
    }
    j++;

    if (j < 10000) {
      setTimeout(draw, 50)
    }
  }
  draw()
  return ac;
}
let setup = false

const fullSetup = () => {
  if (!audioReady) {
    audioReady = true;
  } else {
    return;
  }
  console.log('test')
  if (!!setup) {
    console.log('setup')
    return
  }
  getStreamObject?.()
    ?.then(s => {
      return audioAnalyserSetup(s)
    })
    ?.then(a => {
      setup = !!a;
    })
}

const Cells = (props: { cellCount: number }) => {
  if (!audioReady) {
    fullSetup()
  }
  return (
    <div class={styles.App} style={`--size: var(${PIXEL_SIZE}px)`}>
      {new Array(props.cellCount).fill(1).map((c, i) =>
        <div
          class={styles.Cell}
          id={`cell-${i}`}
          style={{
            width: `${PIXEL_SIZE}px`,
            height: `${PIXEL_SIZE}px`,
          }}
        >
          <div
            class={styles.InnerCell}
            style={{
              // width: `${PIXEL_SIZE}px`,
              // height: `${PIXEL_SIZE}px`,
              // ['border-radius']: `${PIXEL_SIZE/2}px`,
            }}
          />
        </div>
      )}
    </div>
  )
}

const clearCell = (cell: Element, decay?: number) => {
  cell.style.transitionDuration = `${decay ? decay * 3 : 500}ms`
  cell.childNodes[0].style.transitionDuration = `${decay || 500}ms`
  cell.style.backgroundColor = 'hsla(0,0%,0%,0)'
  cell.childNodes[0].style.backgroundColor = 'rgba(0,0,0,1)'
  cell.childNodes[0].style.transform = `scale(1.4)`
}

const styleCell = (cell: Element, fade?: number, color?: number) => {
  cell.style.transitionDuration = `${5}ms`
  cell.childNodes[0].style.transitionDuration = `${5}ms`
  if (!color) {
    cell.style.backgroundColor = 'rgba(0,0,255,0.5)'
    cell.childNodes[0].style.backgroundColor = 'rgba(255,0,0,1)'
  } else {
    cell.childNodes[0].style.transform = `scale(0.1)`
    cell.childNodes[0].style.backgroundColor = 'rgba(0,0,0,0.4)'
    cell.childNodes[0].style.transitionDuration = `${(fade || 100)}ms`
    cell.childNodes[0].style.transform = `scale(1)`
    cell.style.backgroundColor = `hsla(${(color - 120) % 360}, 50%, 50%, 1)`
  }

}

export const Visualizer: Component = () => {
  const [resolution, setResolution] = createSignal(getPixelTotal())
  createRenderEffect(() => {
    if (Date.now() > 10) {
      return;
    }
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
    const func = () => {
      const cells = [...document.querySelectorAll('[id^=cell-]')]
      clearCell(cells[i % resolution()])
      styleCell(cells[++i % resolution()])
      setTimeout(func, 50)
    }
    timeoutHandle = setTimeout(func, 250)
  })
  createRenderEffect(() => {
    const ro = new ResizeObserver(() => {
      if (resizeTimeoutHandle) {
        clearTimeout(resizeTimeoutHandle)
      }
      resizeTimeoutHandle = setTimeout(() => {
        console.log('resize')
        setResolution(getPixelTotal())
      }, 50)
    })
    ro.observe(document.body)
  })
  pixels = resolution()
  return (
    <Cells cellCount={resolution()} />
  );
};
