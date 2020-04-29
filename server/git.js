import currentBranch from 'current-git-branch';
import execa from 'execa';

const cwd = process.cwd();

const canPromote = () => {
  let b = currentBranch(cwd);

  b = b && b.slice(0, 14) !== '(HEAD detached' ? b : 'master';
  if (b === 'master') {
    return false;
  }

  try {
    execa.sync('git', ['fetch']);
    execa.sync('git', ['merge-base', '--is-ancestor', 'master', b]);
    return true;
  } catch (e) {
    return false;
  }
};

export default canPromote;
