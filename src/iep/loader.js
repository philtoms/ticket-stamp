// Note: The loaders API is being redesigned.
//    This hook may disappear or its signature may change.
//    Do not rely on the API described below.
// https://nodejs.org/api/esm.html#esm_code_resolve_code_hook

import urlencode from 'urlencode';
import resolveSrc from './resolve-src';

const __iepMap = {};

const extractIEP = (specifier, protocol = '') => {
  const { pathname, searchParams } = new URL(protocol + specifier);
  const iep = searchParams.get('__iep');
  return [pathname, protocol ? JSON.parse(urlencode.decode(iep)) : iep];
};

export async function resolve(specifier, context, defaultResolve) {
  let iep;
  if (specifier.includes('__iep=')) {
    [specifier, iep] = extractIEP(specifier, 'file://');
  } else if (context.parentURL && context.parentURL.includes('__iep=')) {
    [, iep] = extractIEP(context.parentURL);
  }

  const { url } = defaultResolve(specifier, context, defaultResolve);

  if (iep) {
    if (iep.ticket) __iepMap[iep.ticket] = iep;
    return { url: `${url}?__iep=${iep.ticket || iep}` };
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
    const src = __iepMap[ticket].map.imports[pathname];
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
    const [path, ticket] = extractIEP(url);
    source = await resolveSrc(source, path, __iepMap[ticket].map);
    console.log(source);
    return {
      source,
    };
  }
  // Defer to Node.js for all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}
