import { Link } from "@solidjs/router"

export const App = () => {
  return (
    <>
      <h1>MiniLED Experiments</h1>
      <p>A dumping ground for various things I wanted to make so my miniLED screen could be a neat mood setting screensaver thing in the corner of a room while I fall asleep.</p>
      <h2><Link href="/visualizer">HTML Visualizer</Link></h2>
      <p>Basic audio visualizer using HTML and CSS for the layout and styling.</p>
      <h2><Link href="/video-filter">Youtube Filter</Link></h2>
      <p>Applies some filters onto youtube videos in a sequence to try an maximise the number of unlit areas of your miniLED screen</p>
    </>
  )
}