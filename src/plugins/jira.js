import register from './register';
import promote from './promote';
import revert from './revert';
import close from './close';

const pick = (obj, [head, ...tail]) =>
  tail.length ? pick(obj[head], tail) : obj[head];

const stageIdx = {
  dev: 1,
  qa: 2,
  prod: 3,
};

export default ({ workflowMap, issueKeys, iepMap }) => async (
  req,
  res,
  next
) => {
  const { webhookEvent } = req.body;
  const user = pick(req.body, issueKeys.user.split('/'));
  const ticket = pick(req.body, issueKeys.ticket.split('/'));

  if (webhookEvent === 'jira:issue_created') {
    return register(iepMap)({ body: { ticket }, stamp: { user } }, res, next);
  }

  if (webhookEvent === 'jira:issue_updated') {
    const stage = workflowMap[pick(req.body, issueKeys.workflow.split('/'))];

    const prod = (await iepMap.get('prod')) || [{}];
    const iep =
      (await iepMap.get(ticket)) ||
      prod.find((entry) => entry.ticket === ticket);

    if (iep) {
      if (stageIdx[stage] > stageIdx[iep.stage])
        return promote(iepMap)(
          {
            params: { ticket },
            stamp: { user, stage, promote: {} },
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

      return res.status(202).send(`updated ticket ${ticket}`);
    }

    return res.status(404).send(`unrecognized ticket ${ticket}`);
  }

  if (webhookEvent === 'jira:issue_deleted') {
    return close(iepMap)({ params: { ticket }, stamp: { user } }, res, next);
  }
};
