import register from './register';
import promote from './promote';
import revert from './revert';
import remove from './remove';

const pick = (obj, [head, ...tail]) =>
  tail.length ? pick(obj[head], tail) : obj[head];

const stageIdx = {
  dev: 1,
  qa: 2,
  prod: 3,
};

export default ({ log }, { workflowMap, issueKeys, iepMap }) => async (
  req,
  res,
  next
) => {
  // map the issue on to ticket-stamp semantics
  const { webhookEvent } = req.body;
  const user = pick(req.body, issueKeys.user.split('/'));
  const ticket = pick(req.body, issueKeys.ticket.split('/'));

  if (webhookEvent === 'jira:issue_created') {
    return register(iepMap)({ body: { ticket }, stamp: { user } }, res, next);
  }

  if (webhookEvent === 'jira:issue_updated') {
    const stage = workflowMap[pick(req.body, issueKeys.workflow.split('/'))];

    // use direct comparison rather than implied changelog state so that TS is kept
    // in line with current workflow stage. This translates to revert, promote or unchanged
    const prod = (await iepMap.get('prod')) || [{}];
    const iep =
      (await iepMap.get(ticket)) ||
      prod.find((entry) => entry.ticket === ticket);

    if (iep) {
      if (stageIdx[stage] > stageIdx[iep.stage])
        return promote(iepMap)(
          {
            params: { ticket },
            stamp: { user, stage },
          },
          res,
          next
        );

      if (stageIdx[stage] < stageIdx[iep.stage])
        return revert(iepMap)(
          {
            params: { ticket },
            stamp: { user, stage },
          },
          res,
          next
        );

      return res.status(202).send(`unchanged ticket ${ticket}`);
    }

    // do nothing but log
    log('webhooks/jira', `unrecognized ticket ${ticket}`);
    return res.status(200).send(`unrecognized ticket ${ticket}`);
  }

  if (webhookEvent === 'jira:issue_deleted') {
    return remove(iepMap)({ params: { ticket }, stamp: { user } }, res, next);
  }
};
