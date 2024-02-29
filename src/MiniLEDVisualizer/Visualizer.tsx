import { Component, createEffect, createRenderEffect, createSignal } from 'solid-js';
import styles from './Visualizer.module.css';
import { FullScreenButton, GetMicNodeButton } from '../components/GetMicButton';
import { FadeAwayMenu } from '../components/FadeAwayMenu';
import { NumericInput } from '../components/inputs';

let resizeTimeoutHandle: number;
let pixels = 1020;
let pixelSize = 80;

const getPixelTotal = () => {
  const pixelCols = Math.floor(window.innerWidth / pixelSize);
  const pixelRows = Math.floor(window.innerHeight / pixelSize);
  return pixelCols * pixelRows;
}

const getFft = () => {
  for (let i = 13; i > 4; i--) {
    if (pixels > (2**i / 2)) {
      return 2**(i+1);
    }
  }
  return 2 ** 7;
}
let ac: AudioContext;
let streamNode: MediaStreamAudioSourceNode;
let active = false;
let analyser: AnalyserNode;
let gainNode: GainNode;
let framerate = 10;

const audioAnalyserSetup = async (usesTimeout?: boolean) => {
  analyser = ac.createAnalyser();
  analyser.fftSize = getFft();
  analyser.smoothingTimeConstant = 0;
  gainNode = ac.createGain();
  gainNode.gain.value = 10// 10 %
  streamNode.connect(gainNode);
  gainNode.connect(analyser);
  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength * 2);

  analyser.smoothingTimeConstant = 0.5;
  // analyser.maxDecibels = -40;
  // analyser.minDecibels = -60
  let j = 0;
  let then = 0;
  const last10largest = [0,0,0,0,0,0,0,0,0,0];
  active = true;
  function draw() {
    const interval = 1000/framerate;
    if (!active) {
      return;
    }
    if (!usesTimeout) {
      const now = Date.now();
      if ((now - then) < interval) {
        requestAnimationFrame(draw);
        return;
      }
      then = now;
    }
    bufferLength = analyser.frequencyBinCount;
    const pixelRatio = bufferLength / pixels;
    // analyser.getByteFrequencyData(dataArray);
    analyser.getByteTimeDomainData(dataArray);
    const cells = [...document.querySelectorAll('[id^=cell-]')] as HTMLElement[];
    const largestDeviation = dataArray.slice(0, bufferLength).reduce((a,b) => {
      const diffA = Math.abs(128 - a);
      const diffB = Math.abs(128 - b);
      return diffA > diffB ? diffA : diffB;
    });

    if (j % framerate === 0) {
      last10largest.shift();
      last10largest.push(largestDeviation);
    }
    const sortedLargest = [...last10largest].sort((a,b) => a < b ? 1 : -1)
    const diffToUse = Math.ceil(sortedLargest[0]);

    const range = 360 / diffToUse;
    for (let i = 0; i < pixels && diffToUse > 2; i++) {
      const dataIdx = dataArray[Math.floor(bufferLength / pixels) * i];
      const dataValue = dataArray[dataIdx];
      if (
        dataValue < 128 - diffToUse
        || dataValue > 128 + diffToUse
      ) {
        const fade = Math.abs(dataValue - 128);
        if (cells[i]) {
          styleCell(cells[i], fade * interval / 1000, (diffToUse / fade) * range * 20);
          setTimeout(() => clearCell(cells[i]), fade * interval / 1000);
        }
      }
    }
    j++;
    if (!usesTimeout) {
      requestAnimationFrame(draw);
    } else {
      setTimeout(draw, interval);
    }
  }
  draw();
}

const Cells = (props: { resizeTime: number, hasChildCells: boolean }) => {
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
  });
  const [gain, setGain] = createSignal(0);
  const [cellSize, setCellSize] = createSignal(
    Math.floor(
      (window.innerWidth > window.innerHeight ? window.innerWidth : window.innerHeight) / 15
    )
  );
  const [refreshRate, setRefreshRate] = createSignal(10);
  const [cellCount, setCellCount] = createSignal(getPixelTotal());

  createEffect(() => {
    if (props.resizeTime) {
      pixels = getPixelTotal();
      setCellCount(pixels)
    }
  });

  createEffect(() => {
    if (gainNode?.gain) {
      gainNode.gain.value = gain();
    }
  })
  createEffect(() => {
    framerate = refreshRate();
  })

  createEffect(() => {
    pixelSize = cellSize();
    pixels = getPixelTotal();
    if (analyser) {
      analyser.fftSize = getFft();
    }
    setCellCount(getPixelTotal());
  });

  return (
    <div id="visualizer">
      { initialized() && (
          <FadeAwayMenu>
            <p>Basic HTML visualiser for testing miniLED screens</p>
            <p>These settings may impact performance massively</p>
            {[
              { text: "gain", update: setGain, value: gain(), min: -20, max: 300 },
              { text: "blockSize", update: setCellSize, value: cellSize(), min: 20, max: 300 },
              { text: "frameRate (max)", update: setRefreshRate, value: refreshRate(), min: 1, max: 120 },
            ].map(v => 
              <NumericInput {...v} />
            )}
            <FullScreenButton fullScreenSelector="#visualizer" />
        </FadeAwayMenu>
      )}
      <div class={`${styles.App} ${moving() ? '': styles.NoCursor}`} style={`--size: var(${cellSize()}px);`}>
        {!initialized()
          ? <div><GetMicNodeButton setNode={(audioContext, micNode) => {
            ac = audioContext;
            streamNode = micNode;
            audioAnalyserSetup(true)
            setInitialized(true)
          }}/></div>
          : new Array(cellCount()).fill(1).map((c, i) =>
            <div
              class={styles.Cell}
              id={`cell-${i}`}
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
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
    </div>
  )
}

export const Visualizer: Component = () => {
  const [lastResize, setLastResize] = createSignal(Date.now());

  createRenderEffect(() => {
    const ro = new ResizeObserver(() => {
      if (resizeTimeoutHandle) {
        clearTimeout(resizeTimeoutHandle);
      }
      resizeTimeoutHandle = setTimeout(() => {
        setLastResize(Date.now());
      }, 50);
    })
    ro.observe(document.body);
  })

  createEffect(() => {
    return () => { active = false; };
  })

  return (
    <Cells resizeTime={lastResize()} hasChildCells={false} />
  );
};

const basicHue = (dataPoint: number, base: number = 0) => {
  const value = (dataPoint + 360 + base)
  return value % 360;
}

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
  // cell.style.filter = 'blur(4px)';
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