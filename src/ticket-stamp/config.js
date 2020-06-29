import path from 'path';
import iepConfig from '../plugins/iep/config';

const rootPath = process.env.PWD;

const serverEntry = path.resolve(rootPath, 'src/app/index.js');
const clientEntry = path.resolve(rootPath, 'src/index.js');
const stampedPath = path.resolve(rootPath, 'stamped');

export default (config) => ({
  iep: iepConfig({
    persistRoot: stampedPath,
    ...config.iep,
  }),
  routes: {
    src: '/src',
    ...config.routes,
  },
  clientEntry,
  serverEntry,
  stampedPath,
  ...config,
});
