import se from 'serialize-error';
import service from './service';

export default (config, filter) => async (req, res, next) => {
  const body = req.body;
  const { log, errors, serverEntry, ['iep-cache']: iepConf } = config;
  const { ticket } = req.iep.context || (await filter(req));
  const { worker, requestId } = service(ticket, iepConf);
  worker.send({ ticket, serverEntry, body, requestId });
  worker.on('message', ({ responseId, buffer, err }) => {
    if (err) {
      log.error('iep:render', se.deserializeError(JSON.parse(err)));
      res.status(500).send(errors.PROD_500);
    }
    if (requestId === responseId) {
      req.body = buffer;
      next();
    }
  });
};
