import { Link } from "@solidjs/router"

export const App = () => {
  return (
    <>
      <h1>MiniLED Experiments</h1>
      <p>A dumping ground for various things I wanted to make so my miniLED screen could be a neat mood setting screensaver thing in the corner of a room while I fall asleep.</p>
      <h2><Link href="/visualizer">HTML Visualizer</Link></h2>
      <p>Basic audio visualizer using HTML and CSS for the layout and styling. May expand in future.</p>
      <h2><Link href="/video-filter">Youtube Filter</Link></h2>
      <p>Applies some filters onto youtube videos in a sequence to try an maximise the number of unlit areas of your miniLED screen</p>
      <h2><Link href="/milkdrop">Milkdrop</Link></h2>
      <p>Uses jberg's <Link href="https://github.com/jberg/butterchurn">Butterchurn</Link> libray, a webGL implementation of the <Link href="http://www.geisswerks.com/about_milkdrop.html">milkdrop</Link> visualizer</p>
      <p>As it's highly colourful I will make moves to reduce the color schemes. Hopefully I can add a means to create a list of favoured presets to stick to.</p>
    </>
  )
}