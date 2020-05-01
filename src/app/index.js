const modular_wrapper_1921999961 = /<div.+modular_wrapper_1921999961.+div>/;

export default (template) => {
  // use the mapped require to load token registered components
  const content = require('./content');
  const ContentBlock = require('../components/content-block');

  return template.replace(
    modular_wrapper_1921999961,
    ContentBlock(content.modular_wrapper_1921999961)
  );
};
