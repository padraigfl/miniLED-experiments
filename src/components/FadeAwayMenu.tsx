import { JSX, ParentComponent, createEffect, createRenderEffect, createSignal } from "solid-js";

export const FadeAwayMenu = (props: { keepPointerEvents?: boolean; children: JSX.Element }) => {
  const [menuVisible, setMenuVisible] = createSignal(false);
  const [isMobile] = createSignal(window.innerWidth < 450 && window.innerHeight < 1000);
  const [isMobileMenuOpen, setMobileMenuOpen] = createSignal(true);
  createRenderEffect(() => {
    const menuOpacityListener = () => setMenuVisible(true);
    document.addEventListener('mousemove', menuOpacityListener);
    return () => document.removeEventListener('mousemove', menuOpacityListener);
  })
  createEffect(() => {
    if (menuVisible()) {
      setTimeout(() => { setMenuVisible(false) }, 10000)
    }
  })
  createRenderEffect(() => {
    setMobileMenuOpen(isMobileMenuOpen());
  })

  return (
    <div style={{ position: "absolute", top: '0px', left: '0px', background: 'rgba(0,0,0,0.75)', "max-width": "320px", "max-height": "100vh", overflow: "auto", opacity: menuVisible() || isMobile() ? 1 : 0, transition: `all linear ${menuVisible() ? 0 : 5}s`, "pointer-events": !isMobile() && !props.keepPointerEvents && !menuVisible() ? 'none' : undefined, "z-index": 5 }}>
      { isMobile()
        ? isMobileMenuOpen()
          ? (
            <button onClick={() => { setMobileMenuOpen(false); }} style={{ border: '1px solid white', background: 'black', color: 'white'}}>
              Close
            </button>
          )
          : (
          <button onClick={() => setMobileMenuOpen(true)} style={{ border: '1px solid white', background: 'black', color: 'white', opacity: menuVisible() ? 1 : 0, transition: `all linear ${menuVisible() ? 0 : 5}s`, "z-index": 5 }}>
            Settings
          </button>
        )
        : null
      }
      {!isMobile() || isMobileMenuOpen() ? props.children : null}
    </div>
  )
}