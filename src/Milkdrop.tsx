import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { createEffect, createSignal } from 'solid-js';
import { FilterControls } from './components/FilterControls';
import { FadeAwayMenu } from './components/FadeAwayMenu';
import { GetMicNodeButton } from './components/GetMicButton';

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
    clearTimeout(timeoutRef);
  }
}

const allPresets = butterchurnPresets.getPresets();
let audioContext: AudioContext;

let refreshRate = 50;
function startRenderer(visualizer: any) {
  let then = Date.now();
  const continueRenderer = () => {
    const now = Date.now();
    if ((now - then) > refreshRate) {
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
  const [audioNode, setAudioNode] = createSignal<MediaStreamAudioSourceNode>();
  createEffect(() => {
    if (visualizer()) {
      props.onInitialize();
    }
  }, [visualizer]);

  const initalizeVisualizer = (ac: AudioContext, micNode: MediaStreamAudioSourceNode) => {
    if (!!visualizer()) {
      return;
    }
    audioContext = ac;
    setAudioNode(micNode);
    const canvas = document.getElementsByTagName('canvas')[0]
    const vis = butterchurn.createVisualizer(
      ac,
      canvas , {
      width: window.innerWidth * props.canvasSize,
      height: window.innerHeight * props.canvasSize,
      pixelRatio: 1,
      textureRatio: 1,
      meshHeight: props.meshSize[0],
      meshWidth: props.meshSize[1],
    });
    setVisualizer(vis);
    connectMicAudio(micNode, vis);
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
      <canvas style={{  position: 'absolute', top: '0px', width: '100vw', height: '100vh', "pointer-events": 'none', filter: props.filterStyle }}/>
      { !visualizer() && <GetMicNodeButton setNode={initalizeVisualizer} /> }
    </>
  );
};

const getSavedKey = (key: string) => localStorage.getItem(key) || '';
const updateSavedKey = (key: string, value: any) => localStorage.setItem(key, `${value}`);
const appendSavedKey = (key: string, value: string) => {
  const currentValue = JSON.parse(localStorage.getItem('key') || '[]');
  localStorage.setItem(key, JSON.stringify([...currentValue, value ]));
}
const removeFromSavedKey = (key: string, value: string) => {
  const currentValue = JSON.parse(localStorage.getItem('key') || '[]');
  localStorage.setItem(key, JSON.stringify(JSON.parse(localStorage.getItem('key') || '[]').filter((v: any) => v !== value)));
}

export const Milkdrop = () => {
  // Status info
  const [initialized, setInitialized] = createSignal(false);

  // Preset states
  const [presetList, /* setPresetList */] = createSignal(Object.keys(allPresets)); // full list of presets, possible not needed
  const [autoUpdatePeriodS, setAutoUpdatePeriodS] = createSignal(+getSavedKey('autoUpdatePeriod') || 15); // how frequent to update preset selection, 0 = off
  const [autoUpdate, setAutoUpdate] = createSignal(+getSavedKey('autoUpdate') || 0);
  const [isRandomized, setRandomizeStatus] = createSignal(!!getSavedKey('isRandomized'));
  const [activePreset, setActivePreset] = createSignal(20); // the current filter
  const [presetBlendSpeed, setPresetBlendSpeed] = createSignal(+getSavedKey('presetBlendSpeed') || 1);
  // const [filterListMode, setFilterListMode] = createSignal<FilterViewModes>('all'); // for disabling unliked filters from view state

  // Performance states
  const [mesh, setMesh] = createSignal<SixIndexes>(+getSavedKey('mesh') as SixIndexes || 5);
  const [canvasSize, setCanvasSize] = createSignal<SixIndexes>(+getSavedKey('canvasSize') as SixIndexes || 3);
  const [frameRate, setFrameRate] = createSignal<number>(+getSavedKey('frameRate') || 15);

  // derived filter
  const [filterStyle, setFilterStyle] = createSignal('');

  createEffect(() => {
    updateSavedKey('autoUpdatePeriod', autoUpdatePeriodS());
    updateSavedKey('autoUpdate', autoUpdate() ? 'true' : '');
    updateSavedKey('isRandomized', isRandomized() ? 'true' : '');
    updateSavedKey('presetBlendSpeed', presetBlendSpeed());
    updateSavedKey('mesh', mesh());
    updateSavedKey('canvasSize', canvasSize());
    updateSavedKey('frameRate', frameRate());
    refreshRate = 1000 / frameRate();
  });

  createEffect(() => {
    if (autoUpdate()) {
      setAutoUpdate(autoUpdatePeriodS());
    }
  })

  createEffect(() => {
    if (!initialized()) {
      return;
    }
    if (autoUpdate()) {
      timeoutRef = setTimeout(() => {
        const autoUpdatePresetLoop = () => {
          if (!autoUpdate()) {
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
            timeoutRef = setTimeout(() => {
              autoUpdatePresetLoop()
            }, updatePeriod * 1000);
          }
        }
        autoUpdatePresetLoop();
      }, autoUpdate());
    }
  });

  createEffect(() => {
    if (!autoUpdate()) {
      clearLoopAction()
    }
  });

  const requestFullScreen = () => {
    document.getElementById('milkdrop-page')?.requestFullscreen()
      ?.then(() => { console.log('granted')})
      ?.catch(e1 => {
        document.getElementsByTagName('canvas')[0]?.requestFullscreen()
          ?.catch(e2 => { window.alert(`fullscreen not granted ${JSON.stringify(e2)} -- Trace: ${JSON.stringify(e1)}`); })
      })
  }

  return (
    <div id="milkdrop-page">
      <MilkdropRenderer
        frameRate={frameRate()}
        meshSize={meshSizes[mesh()]}
        canvasSize={canvasSizes[canvasSize()]}
        blendSpeed={presetBlendSpeed()}
        preset={presetList()[activePreset()]}
        onInitialize={() => setInitialized(true)}
        filterStyle={filterStyle()}
      />
      { initialized()
        ? (
          <FadeAwayMenu>
            <button onClick={requestFullScreen}>Full screen</button>
            <h2>Preset settings</h2>
            {/* <p style={{ background: 'black', outline: '1px solid white' }}>
              Preset filter rule: <br />
              {['all', 'favourites', 'ommitted', 'all-but-omitted'].map(filterRule => 
                <label for={`filter-radio-${filterRule}`}>
                  {filterRule}
                  <input id={`filter-radio-${filterRule}`} type="radio" name="filter" value={filterRule} checked={filterListMode() === filterRule} onChange={e => setFilterListMode(e.target.value as FilterViewModes)} />
                </label>
              )}
            </p> */}
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
            <FilterControls setFilterStyle={setFilterStyle} />
          </FadeAwayMenu>
        )
        : null
      }
    </div>
  )
}