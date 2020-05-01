import path from 'path';
import express from 'express';
import fileupload from 'express-fileupload';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import iep from './iep';
import inject from './inject';

const app = express();

app.use(compression());
app.use(fileupload());
app.use(express.urlencoded({ extended: true }));

app.get('/iep/list', iep.list);
app.post('/iep', iep.register);
app.put('/iep/:ticket/promote', iep.promote);
app.put('/iep/:ticket', iep.update);

app.use(
  '/node_modules',
  express.static(path.resolve(__dirname, '../node_modules'))
);
app.use('/src', express.static(path.resolve(__dirname, '../src')));
app.use('/modules', express.static(path.resolve(__dirname, '../modules')));
app.use(
  '/',
  createProxyMiddleware(
    (pathName, { query: { qa, dev }, headers: { referer } }) => {
      const block =
        referer &&
        (pathName === '/__webpack_hmr' ||
          (iep.validTicket(qa, dev) && pathName.endsWith('.js')));
      return !block;
    },
    {
      target: process.env.TARGET || 'http://localhost:3000',
      changeOrigin: true,
      headers: {
        'accept-encoding': 'identity',
      },
      onProxyRes: function (
        proxyRes,
        { query: { qa, dev }, headers: { referer } },
        res
      ) {
        const ticket = iep.validTicket(qa, dev);
        if (!referer && ticket) {
          const _write = res.write;
          let body = '';
          res.write = function (data) {
            data = data.toString('utf-8');
            body += data;
            if (data.includes('</html>')) {
              try {
                const buffer = inject(
                  iep.render(ticket, body, 'app'),
                  ticket.map
                );
                return _write.call(res, buffer);
              } catch (err) {
                console.error(err);
              }
            }
          };
        }
      },
    }
  )
);

const listener = app.listen(process.env.PORT || 8080, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
