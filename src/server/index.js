import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';
import fileupload from 'express-fileupload';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpm from 'http-proxy-middleware';
import iep from '../iep';
import inject from './inject';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const iepPath = path.resolve(__dirname, '../../iep');
const srcPath = path.resolve(__dirname, '../../src');
const appPath = path.resolve(__dirname, '../app/index.js');
const modPath = path.resolve(__dirname, '../../node_modules');

const {
  list,
  register,
  promote,
  update,
  revert,
  close,
  validTicket,
  render,
  resolve,
} = iep(iepPath, appPath, srcPath);

app.use(compression());
app.use(cookieParser());
app.use(fileupload());
app.use(express.urlencoded({ extended: true }));

// app.use('/', moduleResolver(root, importMap));

app.use('/src/*', resolve);
app.use('/static/*', resolve);
app.get('/iep/list', list);
app.post('/iep', register);
app.put('/iep/:ticket/promote', promote);
app.put('/iep/:ticket/revert', revert);
app.put('/iep/:ticket/close', close);
app.put('/iep/:ticket', update);

app.use('/node_modules', express.static(modPath));
app.use('/iep', express.static(iepPath));
app.use(
  '/',
  hpm.createProxyMiddleware(
    (pathName, { query: { qa, dev }, headers: { referer } }) => {
      const ticket = qa || dev;
      const stage = (qa && 'qa') || (dev && 'dev');
      const block =
        referer && validTicket(ticket, stage) && pathName.endsWith('.js');
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
        const ticket = qa || dev;
        const stage = (qa && 'qa') || (dev && 'dev');
        const iep = validTicket(ticket, stage);
        if (!referer && iep) {
          let body = '';
          const _end = res.end;
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
                render(iep, body).then((buffer) => {
                  _end.call(res, inject(buffer));
                });
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
