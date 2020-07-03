import cache from 'iep-cache';
import importer from './importer';
import renderer from './renderer';
import proxy from './proxy';
import defaultFilter from './utils/default-filter';

export default (config) => {
  const iepMap = cache('iepMap', config['iep-cache']);
  const filter = (config.iep.filter || defaultFilter)(iepMap);

  return {
    filter,
    iepMap,
    render: renderer(config, filter),
    proxy: proxy(config, filter),
    imports: importer(config, filter),
  };
};
