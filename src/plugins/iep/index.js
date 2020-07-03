import cache from 'iep-cache';
import importer from './importer';
import renderer from './renderer';
import proxy from './proxy';
import stageFilter from './utils/stage-filter';

export default (config) => {
  const iepMap = cache('iepMap', config['iep-cache']);
  const filter = stageFilter(iepMap, config.iep.stages);

  return {
    filter,
    iepMap,
    render: renderer(config, filter),
    proxy: proxy(config, filter),
    imports: importer(config, filter),
  };
};
