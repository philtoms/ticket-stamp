import log from '../utils/log';

// promote a ticket through dev -> QA -> prod
// considerations:
// - a ticket can only be promoted if master is the ancestor of HEAD
// - if the promotion is from QA to prod, the HEAD could be merged in to master
// - git hooks can be integrated into the promotion checks to ensure that the
//   build has completed cleanly.
export default (iepMap, stamp) => async (req, res) => {
  try {
    const { ticket } = req.params;
    const { base } = req.stamp.promote; // expecting base from git-policy but not a blocker

    const iep = await iepMap.get(ticket);
    if (iep) {
      const stage = iep.stage === 'dev' ? 'qa' : 'prod';
      const stamped = stamp({
        ...iep,
        base,
        stage,
      });
      if (stage === 'prod') {
        const prod = await iepMap.get('prod');
        prod.unshift(stamped);
        iepMap.remove(ticket);
        iepMap.set('prod', prod);
        return res.send(log('promote', prod[0]));
      }
      iepMap.set(ticket, stamped);
      return res.send(log('promote', stamped));
    }

    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
