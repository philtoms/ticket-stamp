// optional SSR perf improvement.
// Not really necessary with defer refined script loading - undeferred script would
// kick in immediately. For now audiusa.com forces all scripts to wait until DOM complete
// - hence the current jank. This fixes that!
import vhCheck from './vh-check-static';
// again, not necessary when we re-visit the component source design but this highlights
// the timeless power of scripting over applications.
// NB: this is the only code-fix required for auto-playing MUI videos and its 100% SSR
const autoPlay = (body) => body.replace('playsinline', 'playsinline autoplay');

// The injectors:
// These are obviously crude and dangerous but they wouldn't be necessary
// if the application responsibilities were sorted out. Nevertheless this
// is a useful script pattern for powerful script control over a live application
// - just needs a little sanitizing.
const injectStyle = (buffer) => {
  return buffer.replace(
    /<\/head>/,
    `<style>${vhCheck('browser-address-bar')}</style></head>`
  );
};

const injectHtml = (buffer) => {
  return autoPlay(buffer);
};

const injectScript = (buffer, map) => {
  return buffer.replace(/<script[^<]+<\/script>/g, '').replace(
    /<\/body>/,
    `\n$<script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
    <script type="importmap-shim">
      ${JSON.stringify(map, null, 2)}
    </script>
    <script type="module-shim" src="/src/script.js" defer></script></body>`
  );
};

// cache incomplete script elements and reattach on next chunk
const cache = {};

export default (body, id, map) => {
  const buffer = (cache[id] || '') + body;
  if (cache[id]) delete cache[id];
  if (buffer.match(/<script[^<]+$/)) {
    let id;
    do {
      id = Math.floor(Math.random() * 1000);
    } while (cache[id]);
    cache[id] = buffer;
    return ['', id];
  }
  return [injectHtml(injectStyle(injectScript(buffer, map)))];
};
