import { goLive } from '../utils/import-map';
import log from '../utils/log';

// promote a ticket through dev -> QA -> prod
// considerations:
// - a ticket can only be promoted if master is the ancestor of HEAD
// - if the promotion is from QA to prod, the HEAD could be merged in to master
// - git hooks can be integrated into the promotion checks to ensure that the
//   build has completed cleanly.
export default (iepMap, stamp) => (req, res) => {
  const { ticket } = req.params;
  const base = req.promote; // expecting base from git-policy but not a blocker

  const iep = iepMap[ticket];
  if (iep) {
    const stage = iep.stage === 'dev' ? 'qa' : 'prod';
    iepMap[ticket] = stamp({
      ...iep,
      base,
      stage,
    });
    if (stage === 'prod') {
      iepMap.prod.unshift(iepMap[ticket]);
      delete iepMap[ticket];
      goLive(iepMap.prod[0].map);
    }
    return res.send(log('promote', iepMap[ticket] || iepMap.prod[0]));
  }

  res.status(404).send(`unrecognized ticket ${ticket}`);
};
