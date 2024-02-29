import { createEffect, createSignal } from "solid-js";

export const GetMicNodeButton = (props: { setNode: (ac: AudioContext, m: MediaStreamAudioSourceNode) => void }) => {
  const [micNode, setMicNode] = createSignal<MediaStreamAudioSourceNode>()
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>();
  const [audioContext, setAudioContext] = createSignal<AudioContext>();
  const getAudioNode = () => {
    const ac = new AudioContext();
    setAudioContext(ac)
    setLoading(true)
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        const micSourceNode = ac.createMediaStreamSource(stream);
        setMicNode(micSourceNode);
      })
      .catch(setError)
      .finally(() => setLoading(false)) ;
  }

  createEffect(() => {
    if (!!micNode() && !!audioContext()) {
      props.setNode(audioContext()!, micNode() as MediaStreamAudioSourceNode)
    }
  });

  if (error()) {
    alert(`error ${error()}`);
    setError(null);
  }

  return <>
  <button type="button" onClick={getAudioNode} disabled={loading()}>Get Mic{loading() ? '...' : null}</button>
  </>
}

export const FullScreenButton = (props: { fullScreenSelector: string }) => {
  const [fullScreen, setFullScreen] = createSignal(false);
  const requestFullScreen = () => {
    document.querySelector(props.fullScreenSelector)?.requestFullscreen()
      ?.then(() => {
        setFullScreen(true)
      })
      ?.catch(e1 => {
        document.getElementsByTagName('canvas')[0]?.requestFullscreen()
          ?.catch(e2 => { window.alert(`fullscreen not granted ${JSON.stringify(e2)} -- Trace: ${JSON.stringify(e1)}`); })
      })
  }

  if (fullScreen()) {
    <button type="button"  onClick={() => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }}>
      Exit full screen
    </button>
  }

  return (
    <button type="button" onClick={requestFullScreen}>
      Full screen
    </button>
  );
}
