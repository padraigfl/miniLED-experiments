import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { createEffect, createSignal } from 'solid-js';
import { NumberControls, createFilterSettings } from './filterControls';
 

type FilterViewModes = 'all' | 'favourites' | 'ommitted' | 'all-but-omitted'

const getValueInRange = (value: number, minValue: number = 0, maxValue: number) => value < minValue ? minValue : value;

type SixIndexes = 0|1|2|3|4|5;
const meshSizes: [number, number][] = [
  [24, 18],
  [32, 24],
  [48, 36],
  [64, 48],
  [96, 72],
  [128, 96],
]

const canvasSizes = [-3,-2, -1, 0, 1, 2].map(v => 2**v);

const NumericInput = (props: { text: string, value: number, update: (n: number) => any, min: number, max: number}) =>
  <p style={{ background: 'black', outline: '1px solid white' }}>
    {props.text}: 
    <input type="number" value={props.value} min={props.min} max={props.max} onChange={e => props.update(getValueInRange(+e.target.value, props.min, props.max))} />
  </p>

const SelectInput = (props: { text: string, options: (string | number)[], selectedIdx: number, update: (n: number) => any }) =>
  <p style={{ background: 'black', outline: '1px solid white' }}>
    {props.text}: 
    <select value={props.selectedIdx} onChange={e => props.update(+e.target.value)} style={{ "max-width": "320px" }}>
      {props.options.map((o, idx) => <option value={idx} disabled={idx === props.selectedIdx}>{o}</option>)}
    </select>
  </p>

let timeoutRef: number;
const clearLoopAction = () => {
  if (timeoutRef) {
    console.log('clear timeout');
    clearTimeout(timeoutRef);
  }
}

const allPresets = butterchurnPresets.getPresets();
let audioContext: AudioContext;

function startRenderer(visualizer: any) {
  let then = Date.now();
  const continueRenderer = () => {
    const now = Date.now();
    if ((now - then) > 50) {
      visualizer.render();
      then = now;
    }
    requestAnimationFrame(() => continueRenderer())
  }
  continueRenderer();
}

function connectMicAudio(sourceNode: AudioNode, visualizer: any) {
  audioContext.resume();

  var gainNode = audioContext.createGain();
  gainNode.gain.value = 1.85;
  sourceNode.connect(gainNode);

  visualizer.connectAudio(gainNode);
  startRenderer(visualizer);
}

const MilkdropRenderer = (props: { filterStyle?: string; onInitialize: () => void; blendSpeed: number; preset: string; frameRate: number; meshSize: [number, number], canvasSize: number }) => {
  const [activePreset, setActivePreset] = createSignal(props.preset);
  const [visualizer, setVisualizer] = createSignal<any>();
  console.log('\nvisualizer render\n`')
  createEffect(() => {
    if (visualizer()) {
      props.onInitialize();
    }
  }, [visualizer]);

  const getAudioNode = () => {
    if (!!visualizer()) {
      return;
    }
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    const canvas = document.getElementsByTagName('canvas')[0]
    const vis = butterchurn.createVisualizer(audioContext, canvas , {
      width: window.innerWidth / 4,
      height: window.innerHeight / 4,
      pixelRatio: 1,
      textureRatio: 1,
      meshHeight: 18,
      meshWidth: 24,
    });
    setVisualizer(vis);
    console.log(vis);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        const micSourceNode = audioContext.createMediaStreamSource(stream);;
        connectMicAudio(micSourceNode, vis);
      })
  }

  createEffect(() => {
    visualizer()?.setInternalMeshSize(props.meshSize[0], props.meshSize[1])
  }, [meshSizes, visualizer]);

  createEffect(() => {
    if (!visualizer()) {
      return;
    }
    if (props.preset && activePreset() !== props.preset) {
      const newPreset = allPresets[props.preset];
      visualizer().loadPreset(allPresets[props.preset], props.blendSpeed);
      setActivePreset(newPreset);
    }
  }, [props.preset, props.blendSpeed, activePreset, visualizer]);

  return (
    <>
      <canvas style={{  position: 'absolute', top: '0px', width: '100vw', height: '100vh', "pointer-events": 'none', filter: props.filterStyle || 'brightness(0.5) contrast(2) brightness(2)' }}/>
      { !visualizer() && <button onClick={getAudioNode}>Begin</button> }
    </>
  );
};

export const Milkdrop = () => {
  // Status info
  const [initialized, setInitialized] = createSignal(false);

  // Preset states
  const [presetList, setPresetList] = createSignal(Object.keys(allPresets)); // full list of presets, possible not needed
  const [autoUpdatePeriodS, setAutoUpdatePeriodS] = createSignal(15); // how frequent to update preset selection, 0 = off
  const [autoUpdate, setAutoUpdate] = createSignal(autoUpdatePeriodS());
  const [isRandomized, setRandomizeStatus] = createSignal(true);
  const [filterListMode, setFilterListMode] = createSignal<FilterViewModes>('all'); // for disabling unliked filters from view state
  const [activePreset, setActivePreset] = createSignal(20); // the current filter
  const [presetBlendSpeed, setPresetBlendSpeed] = createSignal(1);

  // Performance states
  const [mesh, setMesh] = createSignal<SixIndexes>(5);
  const [canvasSize, setCanvasSize] = createSignal<SixIndexes>(3);
  const [frameRate, setFrameRate] = createSignal<number>(15);

  createEffect(() => {
    // setPresetList(presetList().filter())
  }, [filterListMode])

  createEffect(() => {
    if (autoUpdate()) {
      setAutoUpdate(autoUpdatePeriodS());
    }
  }, [autoUpdatePeriodS, autoUpdate])

  createEffect(() => {
    if (!initialized()) {
      return;
    }
    if (autoUpdate()) {
      timeoutRef = setTimeout(() => {
        const autoUpdatePresetLoop = () => {
          if (!autoUpdate()) {
            console.log('no update')
            return;
          }
          clearLoopAction();
          const currentPreset = activePreset();
          const updatePeriod = autoUpdatePeriodS();
          const presetCount = presetList().length
          const availablePresets = presetCount - 1 // we remove one index from selection
          const selectedIdx = isRandomized() ? Math.floor(Math.random() * availablePresets) : ((currentPreset + 1) % availablePresets)
          const newPresetIdx = selectedIdx >= currentPreset ? (selectedIdx + 1 % presetCount) : selectedIdx;
          setActivePreset(newPresetIdx);
          if (updatePeriod) {
            console.log('new timeout', updatePeriod * 1000)
            timeoutRef = setTimeout(() => {
              console.log('timed out');
              autoUpdatePresetLoop()
            }, updatePeriod * 1000);
          }
        }
        autoUpdatePresetLoop();
      }, autoUpdate());
    }
  }, [initialized, activePreset, autoUpdate, isRandomized]);

  createEffect(() => {
    if (!autoUpdate()) {
      clearLoopAction()
    }
  }, [autoUpdate()]);

  const [filterState] = createSignal(createFilterSettings());

  return (
    <>
      <MilkdropRenderer
        frameRate={frameRate()}
        meshSize={meshSizes[mesh()]}
        canvasSize={canvasSizes[canvasSize()]}
        blendSpeed={presetBlendSpeed()}
        preset={presetList()[activePreset()]}
        onInitialize={() => setInitialized(true)}
        filterStyle={filterState().filterCssObject}
      />
      { initialized()
        ? (
          <div style={{ position: "relative", "max-width": "320px", "max-height": "100vh", overflow: "auto"  }}>
            <h2>Preset settings</h2>
            <p style={{ background: 'black', outline: '1px solid white' }}>
              Preset filter rule: <br />
              {['all', 'favourites', 'ommitted', 'all-but-omitted'].map(filterRule => 
                <label for={`filter-radio-${filterRule}`}>
                  {filterRule}
                  <input id={`filter-radio-${filterRule}`} type="radio" name="filter" value={filterRule} checked={filterListMode() === filterRule} onChange={e => setFilterListMode(e.target.value as FilterViewModes)} />
                </label>
              )}
            </p>
            <SelectInput text="Current Preset" selectedIdx={activePreset()} options={presetList()} update={setActivePreset} />
            <NumericInput text="Update Rate" min={1} max={120} value={autoUpdatePeriodS()} update={setAutoUpdatePeriodS} />
            <NumericInput text="Blend" min={1} max={autoUpdatePeriodS()} value={presetBlendSpeed()} update={setPresetBlendSpeed} />
            <p style={{ background: 'black', outline: '1px solid white' }}>Randomize: <input type="checkbox" checked={isRandomized()} onChange={() => setRandomizeStatus(!isRandomized())} /></p>
            <p style={{ background: 'black', outline: '1px solid white' }}>Automatic change: <input type="checkbox" checked={autoUpdate() !== 0} onChange={() => setAutoUpdate(autoUpdate() !== 0 ? 0 : autoUpdatePeriodS)} /></p>
            <h2>Render settings</h2>
            <SelectInput text="Mesh" selectedIdx={mesh()} options={meshSizes.map(([m1, m2]) => `${m1}x${m2}`)} update={v => {
              setMesh(v as SixIndexes);
            }} />
            <NumericInput text="Frame Rate" min={1} max={120} value={frameRate()} update={setFrameRate} />
            <SelectInput text="Canvas Size" selectedIdx={canvasSize()} options={canvasSizes} update={setCanvasSize} />
            <h2>Filter settings</h2>
            <NumberControls controls={filterState().numericControls()} />
            <p style={{ background: 'black', outline: '1px solid white' }}>Filters active: <input type="checkbox" checked={filterState().isEnabled()} onChange={() => filterState().setEnabled(!filterState().isEnabled())} /></p>
            {filterState().filterCssObject}
          </div>
        )
        : null
      }
    </>
  )
}