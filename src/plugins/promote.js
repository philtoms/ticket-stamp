import stamp from '../utils/stamp';

// promote a ticket through dev -> QA -> prod
// considerations:
// - a ticket can only be promoted if master is the ancestor of HEAD
// - if the promotion is from QA to prod, the HEAD could be merged in to master
// - git hooks can be integrated into the promotion checks to ensure that the
//   build has completed cleanly.
export default ({ iepMap }) => async (req, res, next) => {
  const {
    params: { ticket },
    stamp: { payload: { base } = {}, user, stage: reqStage, id, done },
  } = req;

  const iep = await iepMap.get(ticket);
  if (iep) {
    const stage = reqStage || (iep.stage === 'dev' ? 'qa' : 'prod');
    const stamped = stamp({
      ...iep,
      id,
      user,
      base,
      stage,
      status: 'promoted',
    });
    if (stage === 'prod' && done) {
      const prod = await iepMap.get('prod');
      prod.unshift(stamped);
      iepMap.remove(ticket);
      iepMap.set('prod', prod);
      return next({ payload: prod[0], message: prod[0] });
    }
    iepMap.set(ticket, stamped);
    return next({ status: 200, payload: stamped, message: stamped });
  }

  res.status(404).send(`unrecognized ticket ${ticket}`);
};
