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
    let selector = acc.substring(s, e);
    const mappedSelector = selector
      .replace('../', '')
      .replace('./', '')
      .replace('.js', '');
    if (map.imports[mappedSelector]) {
      selector = mappedSelector;
    } else {
      if (selector.startsWith('.') || selector.startsWith('/')) {
        selector =
          selector === '.' || selector === './'
            ? './index.js'
            : `${selector}${
                ['js', 'css', 'json'].includes(selector.split('.').pop())
                  ? ''
                  : '.js'
              }`;
        try {
          const [file] = fsPath(
            selector,
            selector.startsWith('/') ? baseDir : root
          );
          fs.accessSync(file, fs.F_OK);
          // selector = file;
        } catch (err) {
          if (selector.endsWith('.js')) {
            selector = selector.replace('.js', '/index.js');
            try {
              const [file] = fsPath(
                selector,
                selector.startsWith('/') ? baseDir : root
              );
              fs.accessSync(file, fs.F_OK);
              // selector = file;
            } catch (err) {
              selector = log.error('no access!');
            }
          }
        }
      } else {
        selector = resolvePackage(selector);
      }
    }
    return selector ? acc.substr(0, s) + selector + acc.substr(e) : acc;
  }, source);
};
