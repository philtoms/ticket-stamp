import path from 'path';
import express from 'express';
import fileupload from 'express-fileupload';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import iep from '../iep';
import inject from './inject';

const app = express();

const iepPath = path.resolve(__dirname, '../../iep');
const srcPath = path.resolve(__dirname, '../../src');
const appPath = path.resolve(__dirname, '../app/index.js');
const modPath = path.resolve(__dirname, '../../node_modules');

const { list, register, promote, update, validTicket, render } = iep(
  iepPath,
  appPath
);

app.use(compression());
app.use(fileupload());
app.use(express.urlencoded({ extended: true }));

app.get('/iep/list', list);
app.post('/iep', register);
app.put('/iep/:ticket/promote', promote);
app.put('/iep/:ticket', update);

app.use('/node_modules', express.static(modPath));
app.use('/src', express.static(srcPath));
app.use('/iep', express.static(iepPath));
app.use(
  '/',
  createProxyMiddleware(
    (pathName, { query: { qa, dev }, headers: { referer } }) => {
      const block =
        referer &&
        (pathName === '/__webpack_hmr' ||
          (validTicket(qa, dev) && pathName.endsWith('.js')));
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
        const ticket = validTicket(qa, dev);
        if (!referer && ticket) {
          const _write = res.write;
          let body = '';
          res.write = function (data) {
            data = data.toString('utf-8');
            body += data;
            if (data.includes('</html>')) {
              try {
                const buffer = inject(render(ticket, body), ticket.map);
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
