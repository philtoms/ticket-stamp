import httpProxy from 'http-proxy';

export default ({ log, iepMap, errors }, options, render) => {
  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validate = async (ticket, stage) => {
    const iep = (await iepMap.get(ticket)) || {};
    if (iep.stage === stage) return iep;
    return (await iepMap.get('prod'))[0];
  };

  const proxy = httpProxy.createProxyServer(options);
  proxy.on('proxyRes', (proxyRes, req, res) => {
    const {
      headers: { referer },
    } = req;
    const { ticket, stage, iep, next } = req.stamp.context;
    if (!referer && iep) {
      let body = '';
      // transfer ticket to cookie so that it can be retrieved for
      // all script requests.
      res.cookie('stamp', `${stage}=${ticket}`, {
        maxAge: 60000,
        SameSite: 'None',
      });
      const _end = res.end;
      res.end = function () {};
      res.write = function (data) {
        data = data.toString('utf-8');
        body += data;
        if (data.includes('</html>')) {
          // render the body using the ticketed entry point
          render(ticket, body)
            .then((buffer) => {
              req.stamp.buffer = buffer;
              res.end = _end;
              if (options.inject) return res.end(options.inject(buffer));
              next();
            })
            .catch((err) => {
              res.end = _end;
              if (err.message !== '500') log.error('iep:proxy', err);
              return res.status(500).send(errors.PROD_500);
            });
        }
      };
    }
  });

  return async (req, res, next) => {
    try {
      const {
        url,
        query: { qa, dev },
        headers: { referer },
      } = req;
      const ticket = qa || dev;
      const stage = (qa && 'qa') || (dev && 'dev');
      const iep = await validate(ticket, stage);

      req.stamp.context = {
        ticket,
        stage,
        iep,
        next,
      };

      // block all upstream js requests
      const block = referer && iep && url.endsWith('.js');

      if (block) return next();

      proxy.web(req, res, options.target);
    } catch (err) {
      if (err.message !== '500') log.error('iep:proxy', err);
      res.status(500).send(errors.PROD_500);
    }
  };
};
