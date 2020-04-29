import fs from 'fs';
import chokidar from 'chokidar';
import FormData from 'form-data';
import git from '../utils/git';
import fetch from '../utils/fetch';
import log from '../utils/log';

const iepServer = 'http://localhost:8080/iep';
let ticketId;

export const register = (ticket, verbose) => {
  ticketId = ticket.replace(/([a-zA-Z]+)-?([0-9]+)/, '$1-$2').toUpperCase();
  const form = new FormData();
  const { base } = git();
  console.log(base);
  form.append('ticket', ticketId);
  form.append('base', base);
  return fetch(iepServer, 'POST', form, verbose);
};

export const update = (files, folder = './src', verbose) => {
  if (files.length === 0) {
    log(`watching ${folder}:`);
    chokidar.watch(folder).on('change', (path) => {
      update([path], folder, verbose);
    });
    process.stdin.resume();
  }
  return Promise.all(
    files.map((file) => {
      const form = new FormData();
      form.append(file, fs.createReadStream(file));
      return fetch(`${iepServer}/${ticketId}`, 'PUT', form, verbose);
    })
  );
};

export const promote = (verbose) => {
  const { canPromote, status } = git();
  if (canPromote) {
    return fetch(`${iepServer}/${ticketId}/promote`, 'PUT', null, verbose);
  }
  log(401, 'Git status', status);
};

export const list = (prod, qa, dev, verbose) => {
  const query = (prod && 'prod') || (qa && 'qa') || (dev && 'dev');
  return fetch(
    `${iepServer}/list${query ? `?stage=${query}` : ''}`,
    'GET',
    null,
    verbose
  );
};
