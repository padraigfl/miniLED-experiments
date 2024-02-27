import { ParentComponent, createEffect, createSignal } from "solid-js";

export const FadeAwayMenu: ParentComponent<{ keepPointerEvents?: boolean }> = (props) => {
  const [menuVisible, setMenuVisible] = createSignal(false);
  createEffect(() => {
    const menuOpacityListener = () => setMenuVisible(true);
    document.addEventListener('mousemove', menuOpacityListener);
    return () => document.removeEventListener('mousemove', menuOpacityListener);
  })
  createEffect(() => {
    if (menuVisible()) {
      setTimeout(() => { setMenuVisible(false) }, 10000)
    }
  })
  return (
    <div style={{ position: "relative", background: 'rgba(0,0,0,0.75)', "max-width": "320px", "max-height": "100vh", overflow: "auto", opacity: menuVisible() ? 1 : 0, transition: `all linear ${menuVisible() ? 0 : 5}s`, "pointer-events": !props.keepPointerEvents && !menuVisible() ? 'none' : undefined, "z-index": 5 }}>
      {props.children}
    </div>
  )
}