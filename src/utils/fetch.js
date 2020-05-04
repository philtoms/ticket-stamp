import fetch from 'node-fetch';
import log from './log';
export default (action, url, method, body, verbose) =>
  fetch(url, {
    method,
    body,
  })
    .then(async (res) => ({
      status: res.status,
      body: await (res.status <= 201 ? res.json() : res.text()),
    }))
    .then(({ status, body }) => {
      log(action, status, verbose ? JSON.stringify(body, null, 2) : '');
    });
