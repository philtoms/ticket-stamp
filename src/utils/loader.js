const someCondition = false;
const anotherCondition = false;

export async function resolve(specifier, context, defaultResolve) {
  const { parentURL = null } = context;
  // console.log(
  //   specifier.startsWith('.')
  //     ? new URL(specifier + '.js', parentURL).href
  //     : specifier
  // );
  let res;
  if (!someCondition) {
    res = {
      url: specifier.startsWith('.')
        ? new URL(specifier, parentURL).href
        : 'nodejs:' + specifier,
    };
  }
  if (anotherCondition) {
    // When calling the defaultResolve, the arguments can be modified. In this
    // case it's adding another value for matching conditional exports.
    return defaultResolve(specifier, {
      ...context,
      conditions: [...context.conditions, 'another-condition'],
    });
  }
  // Defer to Node.js for all other specifiers.
  console.log(res);
  res = defaultResolve(specifier, context, defaultResolve);
  console.log(res);
  return res;
}

export async function transformSource(source, context, defaultTransformSource) {
  const { url, format } = context;
  if (someCondition) {
    // For some or all URLs, do some custom logic for modifying the source.
    // Always return an object of the form {source: <string|buffer>}.
    return {
      source,
    };
  }
  // console.log(source);
  // Defer to Node.js for all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}
