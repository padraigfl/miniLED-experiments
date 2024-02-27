import { Component, createEffect, createRenderEffect, createSignal } from 'solid-js';

import logo from './logo.svg';
import styles from './Visualizer.module.css';

let i = 0;
let timeoutHandle: number;
let resizeTimeoutHandle: number;
let analyser: AnalyserNode;
let pixels = 1020
let audioReady = false;
let loopTimer: number;

const PIXEL_SIZE = 80
const getPixelTotal = () => {
  const pixelCols = Math.floor(window.innerWidth / PIXEL_SIZE);
  const pixelRows = Math.floor(window.innerHeight / PIXEL_SIZE);
  const pixels = pixelCols * pixelRows;
  return pixels;
}

const getStreamObject = () => {
  if (navigator.mediaDevices) {
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        return stream;
      })
  }
}

const getFft = () => {
  for (let i = 15; i > 4; i--) {
    if (pixels < (2**i / 2)) {
      return 2**(i-4);
    }
  }
  return 2 ** 7;
}

const audioAnalyserSetup = (stream: MediaStream) => {
  const ac = new AudioContext()
  const source = ac.createMediaStreamSource(stream);
  const analyser = ac.createAnalyser();
  const gainNode = ac.createGain()
  gainNode.gain.value = 200// 10 %
  source.connect(gainNode)
  source.connect(analyser);
  analyser.connect(gainNode)
  analyser.fftSize = getFft();
  const pixelRatio = analyser.fftSize / pixels;
  // analyser.minDecibels = -90;
  // analyser.maxDecibels = -40;
  // analyser.minDecibels = -60
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  let j = 0
  let then = 0;
  const last10largest = [0,0,0,0,0,0,0,0,0,0]
  function draw() {
    // const drawVisual = requestAnimationFrame(draw);
    const now = Date.now();
    if ((now - then) < 50) {
      requestAnimationFrame(draw);
      return;
    }
    analyser.getByteTimeDomainData(dataArray);
    console.log('fft: ', analyser.fftSize, ';pixels: ', pixels)

    const cells = [...document.querySelectorAll('[id^=cell-]')] as HTMLElement[]
    const largestDeviation = dataArray.reduce((a,b) => {
      const diffA = Math.abs(128 - a)
      const diffB = Math.abs(128 - b)
      return diffA > diffB ? diffA : diffB;
    });
    console.log('largest: ', largestDeviation, '; bufferLength: ', bufferLength)
    last10largest.shift()
    last10largest.push(largestDeviation);
    const diffToUse = Math.ceil(last10largest.reduce((a,b) => a > b ? a : b) / 4)
    console.log(last10largest);
    // skip only to figure that matches number of pixels
    for (let i = 0; i < bufferLength; i+= Math.floor(pixelRatio)) {
      if (
        dataArray[i] < 128 - diffToUse
        || dataArray[i] > 128 + diffToUse
      ) {
        const fade = Math.abs(dataArray[i] - 128)
        let pixelIdx = Math.floor(pixels * (i / bufferLength));
        if (cells[pixelIdx]) {
          styleCell(cells[pixelIdx], fade*10, dataArray[i])
          setTimeout(() => clearCell(cells[pixelIdx]), 100)
        }
      }
    }
    j++;
    requestAnimationFrame(draw)
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
  if (!!setup) {
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
  const [moving, setMoving] = createSignal()
  createRenderEffect(() => {
    let timer: number;
    const mouseMoveEvent = () => {
      if (timer) {
        clearTimeout(timer)
      }
      setMoving(true)
      timer = setTimeout(setMoving, 2000, false)
    }
    document.addEventListener('mousemove', mouseMoveEvent)
  })
  if (!audioReady) {
    fullSetup()
  }
  return (
    <div class={`${styles.App} ${moving() ? '': styles.NoCursor}`} style={`--size: var(${PIXEL_SIZE}px);`}>
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

const basicHue = (dataPoint: number, base: number = 0) => (dataPoint * 15 + 360 + base) % 360

const clearCell = (cell: HTMLElement, decay?: number) => {
  cell.style.transitionDuration = `${decay ? decay * 3 : 500}ms`
  cell.style.backgroundColor = 'hsla(0,0%,0%,0)'
  const childCell = cell.childNodes[0] as HTMLElement;
  childCell.style.transitionDuration = `${decay || 500}ms`
  childCell.style.backgroundColor = 'rgba(0,0,0,1)'
  childCell.style.transform = `scale(1.4)`
}

const styleCell = (cell: HTMLElement, fade?: number, color: number = 0) => {
  cell.style.transitionDuration = `${5}ms`
  cell.style.filter = 'blur(4px)';
  cell.style.backgroundColor = `hsla(${basicHue(color, 0)}, 100%, 50%, 1)`
  const childCell = cell.childNodes[0] as HTMLElement;
  childCell.style.transitionDuration = `${5}ms`
  childCell.style.transform = `scale(0.1)`
  childCell.style.backgroundColor = 'rgba(0,0,0,1)'
  childCell.style.transitionDuration = `${(fade || 100)}ms`
  childCell.style.transform = `scale(1)`
}

export const Visualizer: Component = () => {
  const [resolution, setResolution] = createSignal(getPixelTotal())

  createRenderEffect(() => {
    const ro = new ResizeObserver(() => {
      if (resizeTimeoutHandle) {
        clearTimeout(resizeTimeoutHandle)
      }
      resizeTimeoutHandle = setTimeout(() => {
        const newRes = getPixelTotal()
        pixels = newRes
        if (analyser) {
          analyser.fftSize = getFft()
        }
        setResolution(newRes)
      }, 50)
    })
    ro.observe(document.body)
  })
  return (
    <Cells cellCount={resolution()} />
  );
};
