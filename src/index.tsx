/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import { Visualizer } from './Visualizer';
import { App } from './App';
import { Router, Route, Routes } from "@solidjs/router";
import { Youtube } from './YoutubeFilter';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}


render(
  () => (
    <Router>
      <Routes>
        <Route path="/" component={App} />
        <Route path="/video-filter" component={Youtube} />
        <Route path="/visualizer" component={Visualizer} /> {/* 👈 Define the home page route */}
      </Routes>
    </Router>
  ),
  root!
);