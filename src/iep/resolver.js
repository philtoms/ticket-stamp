import { init, parse } from 'es-module-lexer/dist/lexer';

import fs from 'fs';
import path from 'path';
import log from '../utils/log';

const fsPath = (pathname, root) => {
  if (pathname.startsWith('/')) pathname = pathname.substr(1);
  let name = pathname.split('/').pop();
  pathname = pathname.replace(`${name}`, '');
  name += ['js', 'css', 'json'].includes(name.split('.').pop()) ? '' : '.js';

  return [path.resolve(root, pathname, name), pathname, name];
};

const resolvePackage = (pathname) => {
  const pkgPath = path.resolve(pathname, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath));
    return path.resolve(pathname, pkg.main);
  }
};

const srcDir = process.env.SRC || process.cwd() + '/src';

export default async (source, pathname, map, baseDir = srcDir) => {
  await init;
  const [imports] = parse(source);
  const root = path.parse(pathname).dir;
  return imports.reverse().reduce((acc, { s, e, d }) => {
    if (d !== -1) return acc;
    let specifier = acc.substring(s, e);
    const selector = specifier.replace('/index.js', '').split('/').pop();
    const mappedSelector = map.imports[specifier] || map.imports[selector];
    if (mappedSelector) {
      specifier = mappedSelector;
    } else {
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        specifier =
          specifier === '.' || specifier === './'
            ? './index.js'
            : `${specifier}${
                ['js', 'css', 'json'].includes(specifier.split('.').pop())
                  ? ''
                  : '.js'
              }`;
        try {
          const [file] = fsPath(
            specifier,
            specifier.startsWith('/') ? baseDir : root
          );
          fs.accessSync(file, fs.F_OK);
          // specifier = file;
        } catch (err) {
          if (specifier.endsWith('.js')) {
            specifier = specifier.replace('.js', '/index.js');
            try {
              const [file] = fsPath(
                specifier,
                specifier.startsWith('/') ? baseDir : root
              );
              fs.accessSync(file, fs.F_OK);
              // specifier = file;
            } catch (err) {
              specifier = log.error('resolver', 'no access!');
            }
          }
        }
      } else {
        specifier = resolvePackage(specifier);
      }
    }
    return specifier ? acc.substr(0, s) + specifier + acc.substr(e) : acc;
  }, source);
};
