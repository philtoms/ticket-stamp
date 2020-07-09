import fetch from 'node-fetch';
import log from './log';

export default (action, url, method, body, verbose) =>
  fetch(url, {
    method,
    body,
  })
    .then(async (res) => ({
      status: res.status,
      body: await res.json(),
    }))
    .then(({ status, body }) => {
      log(action, status, verbose ? JSON.stringify(body, null, 2) : '');
    });
