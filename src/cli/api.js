import fs from 'fs';
import chokidar from 'chokidar';
import FormData from 'form-data';
import git from '../utils/git';
import split from '../utils/split-path';
import log from './log';
import fetch from './fetch';

const srcDir = process.env.SRC || process.cwd() + '/src';

const iepServer = 'http://localhost:8080/stamp';
let ticketId;

export const register = (ticket, verbose) => {
  ticketId = ticket.replace(/([a-zA-Z]+)-?([0-9]+)/, '$1-$2').toUpperCase();
  const form = new FormData();
  const { base } = git();
  form.append('ticket', ticketId);
  form.append('base', base);
  return fetch('register', iepServer, 'POST', form, verbose);
};

export const update = (files, folder = srcDir, verbose) => {
  if (files.length === 0) {
    log(`watching ${folder}:`);
    chokidar.watch(folder).on('change', (path) => {
      update([path], folder, verbose);
    });
    process.stdin.resume();
  }
  return Promise.all(
    files.map((file) => {
      const [name, type] = split(file);
      const form = new FormData();
      form.append('name', name);
      form.append('type', type);
      form.append('file', fs.createReadStream(file));
      return fetch(
        `update ${file}`,
        `${iepServer}/${ticketId}`,
        'PUT',
        form,
        verbose
      );
    })
  );
};

export const promote = (verbose) => {
  const { isAncestor, status } = git();
  if (isAncestor && !status) {
    return fetch(
      'promote',
      `${iepServer}/${ticketId}/promote`,
      'PUT',
      null,
      verbose
    );
  }
  log('promote', 401, 'Git status', status);
};

export const revert = (verbose) => {
  return fetch(
    'revert',
    `${iepServer}/${ticketId}/revert`,
    'PUT',
    null,
    verbose
  );
};

export const close = (verbose) => {
  return fetch('remove', `${iepServer}/${ticketId}`, 'DELETE', null, verbose);
};

export const list = (prod, qa, dev, verbose) => {
  const query = (prod && 'prod') || (qa && 'qa') || (dev && 'dev');
  return fetch(
    'list',
    `${iepServer}/list${query ? `?stage=${query}` : ''}`,
    'GET',
    null,
    verbose
  );
};
