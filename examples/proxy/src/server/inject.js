import pipe from '../../../../src/utils/pipe';

// optional SSR perf improvement.
// Not really necessary with defer refined script loading - undeferred script would
// kick in immediately. For now audiusa.com forces all scripts to wait until DOM complete
// - hence the current jank. This fixes that!
import vhCheck from '../components/vh-check/static';

// again, not necessary when we re-visit the component source design but this highlights
// the timeless power of scripting over applications.
// NB: this is the only code-fix required for auto-playing MUI videos and its 100% SSR
import autoPlay from '../components/video/autoplay';

export default (buffer, map) => {
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

  const injectHtml = pipe([autoPlay]);

  const injectScript = (buffer) => {
    return buffer.replace(/<script[^<]+<\/script>/g, '').replace(
      /<\/body>/,
      `\n
    <script type="module" src="/src/app/script.js" defer></script></body>`
    );
  };

  return pipe([injectScript, injectStyle, injectHtml])(buffer);
};
