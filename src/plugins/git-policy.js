import git from '../utils/git';

// promote a ticket through dev -> QA -> prod
// considerations:
// - a ticket can only be promoted if master is the ancestor of HEAD
// - if the promotion is from QA to prod, the HEAD could be merged in to master
// - git hooks can be integrated into the promotion checks to ensure that the
//   build has completed cleanly.
export default (iepMap, stamp) => (req, res) => {
  const { isAncestor, status, base } = git();
  if (!isAncestor || status) {
    return res.status(403).send(status);
  }
  req.stamp = {
    ...req.stamp,
    promote: {
      ...req.promote,
      base,
    },
  };

  return true;
};
