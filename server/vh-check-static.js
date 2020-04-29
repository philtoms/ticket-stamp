export default (cssVarName, offset = 0) => `
:root {
  --${cssVarName}: ${offset}px
}
`;
