import register from './register';
import promote from './promote';
import revert from './revert';
import remove from './remove';
import localRes from '../utils/local-response';
import pick from '../utils/pick';

const stageIdx = {
  dev: 1,
  qa: 2,
  prod: 3,
};

export default (config, { workflowMap, issueKeys }, iepMap) => {
  const {
    iep: { log },
  } = config;

  const handler = async (req, res, next) => {
    const webHookId = req.get('X-Atlassian-Webhook-Identifier');
    // map the issue on to ticket-stamp semantics
    const { webhookEvent } = req.body;
    const user = pick(req.body, issueKeys.user);
    const ticket = pick(req.body, issueKeys.ticket);
    const done = pick(req.body, issueKeys.done);

    if (webhookEvent === 'jira:issue_created') {
      return register(config, iepMap)(
        { body: { ticket }, stamp: { user, id: webHookId } },
        res,
        next
      );
    }

    if (webhookEvent === 'jira:issue_updated') {
      const stage = workflowMap[pick(req.body, issueKeys.workflow)];

      // use direct comparison rather than implied changelog state so that TS is kept
      // in line with current workflow stage. This translates to revert, promote or unchanged
      const prod = await iepMap.get('prod');
      const iep =
        (await iepMap.get(ticket)) ||
        prod.find((entry) => entry.ticket === ticket);

      if (
        !iep &&
        (await register(config, iepMap)(
          { body: { ticket }, stamp: { user, id: webHookId } },
          localRes(),
          next
        ))
      ) {
        return handler(req, res, next);
      }

      if (iep) {
        if (iep.id === webHookId) return res.send(200);
        if (stageIdx[stage] > stageIdx[iep.stage])
          return promote(config, iepMap)(
            {
              params: { ticket },
              stamp: { user, stage, id: webHookId, done },
            },
            res,
            next
          );

        if (stageIdx[stage] < stageIdx[iep.stage])
          return revert(config, iepMap)(
            {
              params: { ticket },
              stamp: { user, stage, id: webHookId },
            },
            res,
            next
          );

        return res.status(202).send(`unchanged ticket ${ticket}`);
      }
      // do nothing but log
      log.warn('webhooks/jira', `unrecognized ticket ${ticket}`);
      return res.status(200).send(`unrecognized ticket ${ticket}`);
    }

    if (webhookEvent === 'jira:issue_deleted') {
      return remove(config, iepMap)(
        { params: { ticket }, stamp: { user, id: webHookId } },
        res,
        next
      );
    }
  };
  return handler;
};
