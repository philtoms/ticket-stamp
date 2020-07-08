import runPipe from './run-pipe.mjs';
import endOfPipe from './end-of-pipe.mjs';
import ofType from './of-type';

const importPlugin = (plugin, paths, options) => {
  // reduce to first found path or plugin package name
  const { ctx } = options;
  const pluginPath = ofType(plugin, paths, ['js', 'mjs']);
  return new Promise((resolve) =>
    import(pluginPath).then((module) =>
      resolve(runPipe(ctx, module.default(options)))
    )
  );
};

export default (pipeline, paths, options) => [
  ...pipeline.map((plugin) => {
    const module = importPlugin(plugin, paths, options);
    return (req, res, next) => module.then((mw) => mw(req, res, next));
  }),
  endOfPipe(options.ctx),
];
