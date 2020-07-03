export default (iepMap) => async (req) => {
  const {
    query: { qa, dev },
  } = req;

  const ticket = qa || dev;
  const stage = (qa && 'qa') || (dev && 'dev');

  let iep = (await iepMap.get(ticket)) || {};
  if (iep.stage !== stage) iep = (await iepMap.get('prod'))[0];

  return {
    iep,
    ticket,
    stage,
  };
};
