import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { createEffect, createSignal } from 'solid-js';
import { FilterControls } from './components/FilterControls';
import { FadeAwayMenu } from './components/FadeAwayMenu';
import { GetMicNodeButton } from './components/GetMicButton';
import { NumericInput, SelectInput } from './components/inputs';

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

const MilkdropRenderer = (props: { filterStyle?: string; onInitialize: () => void; blendSpeed: number; preset: string; frameRate: number; meshSize: [number, number] }) => {
  const [activePreset, setActivePreset] = createSignal(props.preset);
  const [visualizer, setVisualizer] = createSignal<any>();
  createEffect(() => {
    if (visualizer()) {
      props.onInitialize();
      visualizer().loadPreset(allPresets[props.preset], props.blendSpeed);
    }
  }, [visualizer]);

  const initalizeVisualizer = (ac: AudioContext, micNode: MediaStreamAudioSourceNode) => {
    if (!!visualizer()) {
      return;
    }
    audioContext = ac;
    const canvas = document.getElementsByTagName('canvas')[0]
    const vis = butterchurn.createVisualizer(
      ac,
      canvas , {
      width: window.innerWidth / 1,
      height: window.innerHeight / 1,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1,
      meshHeight: props.meshSize[0],
      meshWidth: props.meshSize[1],
    });
    setVisualizer(vis);
    connectMicAudio(micNode, vis);
  }

  createEffect(() => {
    visualizer()?.setInternalMeshSize(props.meshSize[0], props.meshSize[1])
  });

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

const defaultFilters = {
  brightness: 0.45,
  contrast: 7,
  saturate: 7.3,
  blur: 30,
  isEnabled: true,
};

export const Milkdrop = () => {
  // Status info
  const [initialized, setInitialized] = createSignal(false);

  // Preset states
  // full list of presets, possible not needed
  const [presetList, /* setPresetList */] = createSignal(Object.keys(allPresets));
  // the currently active preset
  const [activePreset, setActivePreset] = createSignal(84);
  // the duration of blending between presets
  const [presetBlendSpeed, setPresetBlendSpeed] = createSignal(+getSavedKey('presetBlendSpeed') || 5);
  // for disabling unliked filters from view state
  // // const [filterListMode, setFilterListMode] = createSignal<FilterViewModes>('all');

  // how frequent to update preset selection
  const [autoUpdatePeriodS, setAutoUpdatePeriodS] = createSignal(+getSavedKey('autoUpdatePeriod') || 15);
  // for toggling update period
  const [autoUpdate, setAutoUpdate] = createSignal(+getSavedKey('autoUpdate') || 0);
  // toggle for whether updates should be randomized
  const [isRandomized, setRandomizeStatus] = createSignal(!!getSavedKey('isRandomized'));

  // Performance states
  // maximum refresh rate per second
  const [frameRate, setFrameRate] = createSignal<number>(+getSavedKey('frameRate') || 10);
  // updates mesh size in butterchurn, unsure how this impacts things
  const [mesh, setMesh] = createSignal<SixIndexes>(+getSavedKey('mesh') as SixIndexes || 0);
  // updates canvas size if it has some performance benefits
  // const [canvasSize, setCanvasSize] = createSignal<SixIndexes>(+getSavedKey('canvasSize') as SixIndexes || 3);

  // derived filter
  const [filterStyle, setFilterStyle] = createSignal('');

  // Update saved values
  createEffect(() => {
    updateSavedKey('autoUpdatePeriod', autoUpdatePeriodS());
    updateSavedKey('autoUpdate', autoUpdate() ? 'true' : '');
    updateSavedKey('isRandomized', isRandomized() ? 'true' : '');
    updateSavedKey('presetBlendSpeed', presetBlendSpeed());
    updateSavedKey('mesh', mesh());
    // updateSavedKey('canvasSize', canvasSize());
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
        // canvasSize={canvasSizes[canvasSize()]}
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
            <NumericInput text="Blend" min={1} max={autoUpdatePeriodS()} value={presetBlendSpeed()} update={setPresetBlendSpeed} />
            <p style={{ background: 'black', outline: '1px solid white' }}>Automatic change: <input type="checkbox" checked={autoUpdate() !== 0} onChange={() => setAutoUpdate(autoUpdate() !== 0 ? 0 : autoUpdatePeriodS)} /></p>
            { autoUpdate() && (
              <>
                <NumericInput text="Update Rate" min={1} max={120} value={autoUpdatePeriodS()} update={setAutoUpdatePeriodS} />
                <p style={{ background: 'black', outline: '1px solid white' }}>Randomize: <input type="checkbox" checked={isRandomized()} onChange={() => setRandomizeStatus(!isRandomized())} /></p>
              </>
            )}
            <h2>Render settings</h2>
            <SelectInput text="Mesh" selectedIdx={mesh()} options={meshSizes.map(([m1, m2]) => `${m1}x${m2}`)} update={v => {
              setMesh(v as SixIndexes);
            }} />
            <NumericInput text="Frame Rate" min={1} max={120} value={frameRate()} update={setFrameRate} />
            {/* <SelectInput text="Canvas Size" selectedIdx={canvasSize()} options={canvasSizes} update={setCanvasSize} /> */}
            <h2>Filter settings</h2>
            <FilterControls setFilterStyle={setFilterStyle} initialValues={defaultFilters} />
          </FadeAwayMenu>
        )
        : null
      }
    </div>
  )
}