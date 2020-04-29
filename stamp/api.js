import fs from 'fs';
import fetch from 'node-fetch';
import chokidar from 'chokidar';
import FormData from 'form-data';

const iepServer = 'http://localhost:8080/iep';
let ticketId;

export const register = (ticket, verbose) => {
  ticketId = ticket.replace(/([a-zA-Z]+)-?([0-9]+)/, '$1-$2').toUpperCase();
  const form = new FormData();
  form.append('ticket', ticketId);
  return fetch(iepServer, {
    method: 'POST',
    body: form,
  })
    .then(async (res) => ({
      status: res.status,
      body: await (res.status === 200 ? res.json() : res.text()),
    }))
    .then(({ status, body }) => {
      console.log(status, verbose ? JSON.stringify(body, null, 2) : '');
    });
};

export const update = (files, verbose) => {
  if (files.length === 0) {
    console.log('watching...');
    chokidar.watch('./src').on('change', (path) => {
      update([path], verbose);
    });
    process.stdin.resume();
  }
  return Promise.all(
    files.map((file) => {
      const form = new FormData();
      form.append(file, fs.createReadStream(file));
      return fetch(`${iepServer}/${ticketId}`, {
        method: 'PUT',
        body: form,
      })
        .then(async (res) => ({
          status: res.status,
          body: await (res.status === 200 ? res.json() : res.text()),
        }))
        .then(({ status, body }) => {
          console.log(status, verbose ? JSON.stringify(body, null, 2) : '');
        });
    })
  );
};

export const promote = (verbose) => {
  return fetch(`${iepServer}/${ticketId}/promote`, {
    method: 'PUT',
  })
    .then(async (res) => ({
      status: res.status,
      body: await (res.status === 200 ? res.json() : res.text()),
    }))
    .then(({ status, body }) => {
      console.log(status, verbose ? JSON.stringify(body, null, 2) : '');
    });
};

export const list = (prod, qa, dev, verbose) => {
  const query = (prod && 'prod') || (qa && 'qa') || (dev && 'dev');
  return fetch(`${iepServer}/list${query ? `?stage=${query}` : ''}`, {
    method: 'GET',
  })
    .then(async (res) => ({
      status: res.status,
      body: await (res.status === 200 ? res.json() : res.text()),
    }))
    .then(({ status, body }) => {
      console.log(status, verbose ? JSON.stringify(body, null, 2) : '');
    });
};
