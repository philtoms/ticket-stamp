import currentBranch from 'current-git-branch';
import execa from 'execa';

const cwd = process.cwd();

const git = () => {
  try {
    let b = currentBranch(cwd);
    let status = '';
    let isAncestor = false;
    let base = '';

    b = b && b.slice(0, 14) !== '(HEAD detached' ? b : 'master';
    if (b !== 'master') {
      execa.sync('git', ['fetch']);
      base = execa.sync('git', ['rev-parse', b]).stdout;
      status = execa.sync('git', ['status', '--porcelain']).stdout;
      try {
        isAncestor =
          execa.sync('git', ['merge-base', '--is-ancestor', 'master', b])
            .exitCode === 0;
      } catch (e) {
        isAncestor = false;
      }
    }
    return {
      base,
      status:
        !status && !isAncestor
          ? 'Master must be ancestor of current branch'
          : status,
      isAncestor,
    };
  } catch (e) {
    return {
      status: e,
    };
  }
};

export default git;
