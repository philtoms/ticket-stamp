import hpm from 'http-proxy-middleware';

export default (options, validate, render) =>
  hpm.createProxyMiddleware(
    async (pathName, { query: { qa, dev }, headers: { referer } }) => {
      const ticket = qa || dev;
      const stage = (qa && 'qa') || (dev && 'dev');
      const block =
        referer && (await validate(ticket, stage)) && pathName.endsWith('.js');
      return !block;
    },
    {
      ...options,
      onProxyRes: async function (
        proxyRes,
        // extract the ticket credentials from the query
        { query: { qa, dev }, headers: { referer } },
        res
      ) {
        const ticket = qa || dev;
        const stage = (qa && 'qa') || (dev && 'dev');
        const iep = await validate(ticket, stage);
        if (!referer && iep) {
          let body = '';
          const _end = res.end;
          // transfer ticket to cookie so that it can be retrieved for
          // all script requests.
          res.cookie('stamp', `${stage}=${ticket}`, {
            maxAge: 60000,
            SameSite: 'None',
          });
          res.end = function () {};
          res.write = function (data) {
            data = data.toString('utf-8');
            body += data;
            if (data.includes('</html>')) {
              try {
                // render the body using the ticketed entry point
                render(iep, body).then((buffer) => {
                  _end.call(res, buffer);
                });
              } catch (err) {
                console.error(err);
              }
            }
          };
        }
      },
    }
  );
