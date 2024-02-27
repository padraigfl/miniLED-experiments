import { createEffect, createSignal } from "solid-js";

let audioContext: AudioContext;

export const GetMicNodeButton = (props: { setNode: (ac: AudioContext, m: MediaStreamAudioSourceNode) => void }) => {
  const [micNode, setMicNode] = createSignal<MediaStreamAudioSourceNode>()
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>();
  const getAudioNode = () => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    setLoading(true)
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream: MediaStream) => {
        const micSourceNode = audioContext.createMediaStreamSource(stream);
        setMicNode(micSourceNode);
      })
      .catch(setError)
      .finally(() => setLoading(false)) ;
  }

  createEffect(() => {
    if (!!micNode() && !!audioContext) {
      props.setNode(audioContext, micNode() as MediaStreamAudioSourceNode)
    }
  });

  if (error()) {
    alert(`error ${error()}`);
    setError(null);
  }

  return <>
  This doesn't work on Chrome currently, I'm not sure why??
  <button type="button" onClick={getAudioNode} disabled={loading()}>Get Mic{loading() ? '...' : null}</button>
  </>
}