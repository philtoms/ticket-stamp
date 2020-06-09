import { init, parse } from 'es-module-lexer/dist/lexer.cjs';

const fs = require('fs');

const { resolve } = require('path');

const cache = {};

module.exports = (baseDir, importMap) => {
  const fsPath = (url, root) => {
    if (url.startsWith('/')) url = url.substr(1);
    let name = url.split('/').pop();
    const path = url.replace(`${name}`, '');
    name += ['js', 'css', 'json'].includes(name.split('.').pop()) ? '' : '.js';

    return [resolve(root, path, name), path, name];
  };

  return async (req, res, next) => {
    if (
      !req.url.startsWith('/src') &&
      !req.url.startsWith('/node_modules') &&
      !req.url.startsWith('/web_modules')
    )
      return next();

    // if (cache[req.url]) {
    //   res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    //   return res.send(cache[req.url])
    // }

    const [file, root] = fsPath(req.url, baseDir);

    // This can be considerably simplified when full import-map support lands in browsers.
    const resolveModule = file => {
      // account for the default index.js allowed by node
      fs.access(file, fs.F_OK, async err => {
        if (err) {
          if (file.includes('/index.js')) return res.status(404).send(err);
          return resolveModule(file.replace('.js', '/index.js'));
        }

        let src = fs.readFileSync(file, 'utf8');

        let parsed;
        await init;
        try {
          parsed = parse(src);
        } catch (err) {
          console.error(err);
          return res.status(401).send(err);
        }
        const [imports] = parsed;
        src = imports.reverse().reduce((acc, { s, e, d }) => {
          if (d !== -1) return acc;
          const _import = acc.substring(s, e);
          if (importMap.imports[_import]) {
            return (
              acc.substr(0, s) + importMap.imports[_import] + acc.substr(e)
            );
          } else {
            let name;
            // special case for @audi asset requests.
            if (_import.startsWith('@audi') && !_import.includes('/dist')) {
              name = `/node_modules/${_import}/dist/index.js`;
            } else {
              name =
                _import === '.' || _import === './'
                  ? './index.js'
                  : `${_import}${
                      ['js', 'css', 'json'].includes(_import.split('.').pop())
                        ? ''
                        : '.js'
                    }`;
              const __import =
                importMap.imports[
                  _import
                    .replace('../', '')
                    .replace('./', '')
                    .replace('.js', '')
                ];
              if (__import && !__import.startsWith('/web_modules')) {
                name = __import;
              } else if (!name.startsWith('/') && !name.startsWith('.')) {
                name = `/node_modules/${name}`;
              }
            }
            if (name.startsWith('/') || name.startsWith('.')) {
              try {
                const [file] = fsPath(
                  name,
                  name.startsWith('/') ? baseDir : root
                );
                fs.accessSync(file, fs.F_OK);
              } catch (err) {
                if (name.endsWith('.js')) {
                  name = name.replace('.js', '/index.js');
                  try {
                    const [file] = fsPath(
                      name,
                      name.startsWith('/') ? baseDir : root
                    );
                    fs.accessSync(file, fs.F_OK);
                  } catch (err) {
                    name = console.error('no access!');
                  }
                }
              }
            }
            return acc.substr(0, s) + name + acc.substr(e);
          }
        }, src);

        cache[req.url] = src;
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        res.send(cache[req.url]);
      });
    };
    resolveModule(file);
  };
};
