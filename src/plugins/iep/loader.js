// Note: The loaders API is being redesigned.
//    This hook may disappear or its signature may change.
//    Do not rely on the API described below.
// https://nodejs.org/api/esm.html#esm_code_resolve_code_hook
import path from 'path';
import resolver from './resolver';
import cache from './import-cache';
import { subscribe } from './utils/pubsub';

const root = process.env.PWD;

const iepMap = cache('iepMap');
const iepSrc = cache('iepSrc');

// pub-sub: subscribe to published entity updates
subscribe('iepMap', iepMap.update, process);
subscribe('iepSrc', iepSrc.update, process);

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

  // fill in missing root for import-mapped specifiers of the form '/relative/path'
  if (ticket && specifier.startsWith('/') && !specifier.startsWith(root)) {
    specifier = path.resolve(root, specifier.substr(1));
  }

  const { url } = defaultResolve(specifier, context, defaultResolve);

  // propagate ticket state through the tree
  return { url: ticket ? `${url}?__iep=${ticket}` : url };
}

export async function getSource(url, context, defaultGetSource) {
  if (url.includes('__iep=')) {
    const [pathname, ticket] = extractIEP(url);
    const cacheKey = `${ticket}.${pathname}`;

    const iep = await iepMap.get(ticket);
    const { timestamp, source } = await iepSrc.get(cacheKey, iep);
    if (timestamp > iep.timestamp) {
      return {
        source,
      };
    }

    const src = iep.map.imports[pathname];
    if (src) {
      url = 'file:///' + src;
    }
  }
  // Defer to Node.js for all other URLs.
  return defaultGetSource(url, context, defaultGetSource);
}

export async function transformSource(source, context, defaultTransformSource) {
  const { url } = context;
  if (url.includes('__iep=')) {
    const [pathname, ticket] = extractIEP(url);
    const iep = await iepMap.get(ticket);
    const cacheKey = `${ticket}.${pathname}`;
    const { timestamp } = await iepSrc.get(cacheKey);
    if (timestamp > iep.timestamp) {
      return {
        source,
      };
    }

    source = await resolver(source, ticket, pathname, iep.map);

    return {
      source,
    };
  }
  // Defer to Node.js for all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}
