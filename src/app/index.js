import content from './content';
import ContentBlock from '../components/content-block';

const modular_wrapper_1921999961 = /<div.+modular_wrapper_1921999961.+div>/;

export default (template) => {
  return template.replace(
    modular_wrapper_1921999961,
    ContentBlock(content.modular_wrapper_1921999961)
  );
};
