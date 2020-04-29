import fetch from 'node-fetch';
import log from './log';
export default (url, method, body, verbose) =>
  fetch(url, {
    method,
    body,
  })
    .then(async (res) => ({
      status: res.status,
      body: await (res.status === 200 ? res.json() : res.text()),
    }))
    .then(({ status, body }) => {
      log(status, verbose ? JSON.stringify(body, null, 2) : '');
    });
