// taken verbatim from audi-components-ui
export const getElementCoords = (elem) => {
  const { top: elTop, left: elLeft } = elem.getBoundingClientRect();
  const { body, documentElement: docEl } = document;

  const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const clientLeft = docEl.clientLeft || body.clientLeft || 0;

  const top = elTop + scrollTop - clientTop;
  const left = elLeft + scrollLeft - clientLeft;

  return { top: Math.round(top), left: Math.round(left) };
};

export const handleScroll = (id, topSpacing = 0) => () => {
  // account for the erroneous double hash
  const element = document.getElementById(`#${id}`);
  window.scrollTo({
    top: getElementCoords(element).top - topSpacing,
    behavior: 'smooth',
  });
};

// The added script. This would be applied to registered selectors in production source
// - where registered implies any of OO-CSS, css-modules, etc...
Array.from(document.querySelectorAll('[href^="#scroll-to"]')).forEach((el) => {
  console.log('scrolling...... for AUSA-201');
  el.addEventListener('click', handleScroll(el.href.split('#').pop()));
});

// normalize landing behavior: if the url contains a scroll hash, use it
// (but wait until the page settles)
if (window.location.hash.includes('scroll-to'))
  setTimeout(handleScroll(window.location.hash.split('#').pop()), 1000);
