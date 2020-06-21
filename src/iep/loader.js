// Note: The loaders API is being redesigned.
//    This hook may disappear or its signature may change.
//    Do not rely on the API described below.
// https://nodejs.org/api/esm.html#esm_code_resolve_code_hook
import path from 'path';
import resolver from './resolver';

const root = process.env.PWD;
const preload = (entity, opts) => {
  const cache = import(path.resolve(root, 'ts-config.js')).then((module) => {
    const config = module.default;
    return config.cache(entity, { ...opts, persistRoot: config.stampDir });
  });
  return {
    get: async (...args) => (await cache).get(...args),
    set: async (...args) => (await cache).set(...args),
  };
};

const __iepMap = preload('iepMap', {
  defaults: { prod: '[]' },
});

const __srcMap = preload('srcMap', {
  persistKey: true,
});

const __urlMap = {};

const extractIEP = (specifier, protocol = '') => {
  const { pathname, searchParams } = new URL(protocol + specifier);
  const ticket = searchParams.get('__iep');
  return [pathname, ticket];
};

export async function resolve(specifier, context, defaultResolve) {
  let ticket;
  if (specifier.includes('__iep=')) {
    [specifier, ticket] = extractIEP(specifier, 'file://');
  } else if (context.parentURL && context.parentURL.includes('__iep=')) {
    [, ticket] = extractIEP(context.parentURL);
  }

  const { url } = defaultResolve(specifier, context, defaultResolve);

  if (ticket) {
    return { url: `${url}?__iep=${ticket}` };
  }
  return {
    url,
  };
}

export async function getFormat(url, context, defaultGetFormat) {
  if (url.includes('__iep=')) {
    return {
      format: 'module',
    };
  }
  // Defer to Node.js for all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}

export async function getSource(url, context, defaultGetSource) {
  if (url.includes('__iep=')) {
    const [pathname, ticket] = extractIEP(url);

    __urlMap[url] = `${ticket}.${pathname
      .replace(root, '')
      .replace(/\//g, '_')}`;

    const source = await __srcMap.get(__urlMap[url]);
    if (source) {
      return {
        source,
      };
    }

    const src = (await __iepMap.get(ticket)).map.imports[pathname];
    if (src) {
      url = 'file:///' + src;
    }
  }
  // Defer to Node.js for all other URLs.
  return defaultGetSource(url, context, defaultGetSource);
}

export async function transformSource(source, context, defaultTransformSource) {
  const { url } = context;
  if (await __srcMap.get(__urlMap[url])) {
    return {
      source,
    };
  }
  if (url.includes('__iep=')) {
    const [pathname, ticket] = extractIEP(url);
    const map = (await __iepMap.get(ticket)).map;
    source = await resolver(source, pathname, map);
    __srcMap.set(__urlMap[url], source);
    return {
      source,
    };
  }
  // Defer to Node.js for all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}
