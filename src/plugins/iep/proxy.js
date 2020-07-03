import httpProxy from 'http-proxy';
import cookies from './utils/cookies';

export default (config, filter) => {
  const {
    log,
    iep: { proxy: options },
    errors,
  } = config;

  const parseCookies = cookies();
  const proxy1 = httpProxy.createProxyServer({
    ...options,
  });

  const proxy2 = httpProxy.createProxyServer({
    ...options,
    selfHandleResponse: true,
  });

  proxy2.on('proxyRes', (proxyRes, req, res) => {
    const {
      headers: { referer },
    } = req;
    const buffer = [];
    proxyRes.on('data', function (chunk) {
      buffer.push(chunk);
    });
    proxyRes.on('end', function () {
      req.body = Buffer.concat(buffer).toString();
      const { ticket, stage, next } = req.iep.context;
      if (!referer && ticket) {
        // transfer ticket to cookie so that it can be retrieved for
        // all script requests.
        res.cookie('iep', `${stage}=${ticket}`, {
          maxAge: 60000,
          SameSite: 'None',
        });
        return next();
      }
      Object.entries(proxyRes.headers).forEach(([key, value]) =>
        res.setHeader(key, value)
      );
      res.send(req.body);
    });
  });

  return async (req, res, next) => {
    try {
      const { ticket, stage } = await filter.stage(req);
      req.iep = {
        ...req.iep,
        context: {
          ticket,
          stage,
          next,
        },
      };

      // split page requests into [first (cookies not set), ...rest (cookies set)]
      return parseCookies(req).ticket
        ? proxy1.web(req, res, options.target)
        : proxy2.web(req, res, options.target);
    } catch (err) {
      if (err.message !== '500') log.error('iep:proxy', err);
      res.status(500).send(errors.PROD_500);
    }
  };
};
