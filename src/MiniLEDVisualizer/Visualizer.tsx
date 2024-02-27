import { Component, createRenderEffect, createSignal } from 'solid-js';

import styles from './Visualizer.module.css';
import { GetMicNodeButton } from '../components/GetMicButton';

let resizeTimeoutHandle: number;
let analyser: AnalyserNode;
let pixels = 1020
let audioContext: AudioContext;

const PIXEL_SIZE = 80
const getPixelTotal = () => {
  const pixelCols = Math.floor(window.innerWidth / PIXEL_SIZE);
  const pixelRows = Math.floor(window.innerHeight / PIXEL_SIZE);
  const pixels = pixelCols * pixelRows;
  return pixels;
}



const getFft = () => {
  for (let i = 13; i > 4; i--) {
    if (pixels > (2**i / 2)) {
      return 2**(i+1);
    }
  }
  return 2 ** 7;
}

const audioAnalyserSetup = (streamNode: MediaStreamAudioSourceNode, framerate = 10, usesTimeout?: boolean) => {
  const analyser = audioContext.createAnalyser();
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 300// 10 %
  audioContext.resume();
  streamNode.connect(gainNode)
  streamNode.connect(analyser);
  analyser.connect(gainNode);
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
  let timerRef: number;
  const interval = 1000/framerate;
  function draw() {
    if (!usesTimeout) {
      const now = Date.now();
      if ((now - then) < interval) {
        requestAnimationFrame(draw);
        return;
      }
    }
    analyser.getByteTimeDomainData(dataArray);
    const cells = [...document.querySelectorAll('[id^=cell-]')] as HTMLElement[]
    const largestDeviation = dataArray.reduce((a,b) => {
      const diffA = Math.abs(128 - a)
      const diffB = Math.abs(128 - b)
      return diffA > diffB ? diffA : diffB;
    });
    console.log(`j: `, j)
    console.log('largest: ', largestDeviation, '; bufferLength: ', bufferLength)
    last10largest.shift()
    last10largest.push(largestDeviation);
    const diffToUse = Math.ceil(last10largest.reduce((a,b) => a > b ? a : b) / 2)
    console.log(last10largest);
    console.log('diff to use: ',diffToUse)
    // skip only to figure that matches number of pixels
    for (let i = 0; i < bufferLength && diffToUse > 2; i+= Math.floor(pixelRatio)) {
      if (
        dataArray[i] < 128 - diffToUse
        || dataArray[i] > 128 + diffToUse
      ) {
        const fade = Math.abs(dataArray[i] - 128)
        let pixelIdx = Math.floor(pixels * (i / bufferLength));
        if (cells[pixelIdx]) {
          styleCell(cells[pixelIdx], fade, (diffToUse / fade) * 120)
          setTimeout(() => clearCell(cells[pixelIdx]), fade*10)
        }
      }
    }
    j++;
    if (!usesTimeout) {
      requestAnimationFrame(draw)
    } else {
      setTimeout(draw, interval)
    }
  }
  draw()
}

const Cells = (props: { cellCount: number, hasChildCells: boolean }) => {
  const [moving, setMoving] = createSignal()
  const [initialized, setInitialized] = createSignal(false);
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

  return (
    <div class={`${styles.App} ${moving() ? '': styles.NoCursor}`} style={`--size: var(${PIXEL_SIZE}px);`}>
      {!initialized()
        ? <GetMicNodeButton setNode={(ac, micNode) => {
          audioContext = ac;
          audioAnalyserSetup(micNode, 1, true)
          setInitialized(true)
        }}/>
        : new Array(props.cellCount).fill(1).map((c, i) =>
          <div
            class={styles.Cell}
            id={`cell-${i}`}
            style={{
              width: `${PIXEL_SIZE}px`,
              height: `${PIXEL_SIZE}px`,
            }}
          >
            { props.hasChildCells && (            
              <div
                class={styles.InnerCell}
                style={{
                  // width: `${PIXEL_SIZE}px`,
                  // height: `${PIXEL_SIZE}px`,
                  // ['border-radius']: `${PIXEL_SIZE/2}px`,
                }}
              />
            )}
          </div>
        )
      }
    </div>
  )
}

const basicHue = (dataPoint: number, base: number = 0) => (dataPoint * 15 + 360 + base) % 360

const clearCell = (cell: HTMLElement, decay?: number, hasChildCell?: boolean) => {
  cell.style.transitionDuration = `${decay ? decay * 3 : 500}ms`
  cell.style.backgroundColor = 'hsla(0,0%,0%,0)'
  if (hasChildCell) {
    const childCell = cell.childNodes[0] as HTMLElement;
    childCell.style.transitionDuration = `${decay || 500}ms`
    childCell.style.backgroundColor = 'rgba(0,0,0,1)'
    childCell.style.transform = `scale(1.4)`
  }
}

const styleCell = (cell: HTMLElement, fade?: number, color: number = 0, hasChildCell?: boolean) => {
  cell.style.transitionDuration = `${5}ms`
  cell.style.filter = 'blur(4px)';
  cell.style.backgroundColor = `hsla(${basicHue(color, 0)}, 100%, 50%, 1)`
  if (hasChildCell) {
    const childCell = cell.childNodes[0] as HTMLElement;
    childCell.style.transitionDuration = `${5}ms`
    childCell.style.transform = `scale(0.1)`
    childCell.style.backgroundColor = 'rgba(0,0,0,1)'
    childCell.style.transitionDuration = `${(fade || 100)}ms`
    childCell.style.transform = `scale(1)`
  }
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
    <Cells cellCount={resolution()} hasChildCells={false} />
  );
};
