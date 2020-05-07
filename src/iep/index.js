import fs from 'fs';
import overrideRequire from 'override-require';
import { init, parse } from 'es-module-lexer/dist/lexer.cjs';

import ImportMap, { goLive } from '../utils/import-map';
import git from '../utils/git';
import log from '../utils/log';
import split from '../utils/split-path';

const iepMap = { prod: [] };

const stamp = (data) => ({
  ...data,
  user: process.env.USER,
  timestamp: Date().toString(),
});

export default (modulePath, appPath, srcPath) => {
  const list = (req, res) => {
    const { stage } = req.query;
    res.send(
      Object.entries(iepMap)
        .filter(([ticket]) => !stage || ticket.startsWith(stage))
        .reduce(
          (acc, [ticket, data]) => ({
            ...acc,
            [ticket.split('/').pop()]: data,
          }),
          {}
        )
    );
  };

  // tickets could be registered directly with IEP. In this workflow, ticket registration
  // would be a distinct step before developer registration and would typically be performed
  // by the ticket / workflow manager.
  // An alternative is to integrate the IEP service with the ticket service.
  // This alpha just accepts a unique ticket number
  const register = (req, res) => {
    const { ticket, base } = req.body;
    const prod = iepMap.prod.find((entry) => entry.ticket === ticket);
    if (prod) {
      return res.status(200).send(prod);
    }
    // don't overwrite existing ticket work
    // - use update to do that
    const iep = prod || iepMap[ticket];
    iepMap[ticket] =
      iep ||
      stamp({
        ticket,
        stage: 'dev',
        status: 'open',
        base,
        map: ImportMap(ticket),
      });

    return res.status(iep ? 200 : 201).send(log('register', iepMap[ticket]));
  };

  const update = (req, res) => {
    const { ticket } = req.params;
    const { name, type } = req.body;
    const { md5, data } = req.files.file;
    const iep = iepMap[ticket];
    if (iep) {
      if (iep.stage !== 'dev') {
        return res
          .status(401)
          .send(`ticket ${ticket} is already at ${iepMap[ticket].stage} stage`);
      }
      const iepName = `${name}.${md5}.${type}`;
      fs.writeFileSync(`${modulePath}/${iepName}`, data);
      // Will probably split into SSR and CSR imports
      const alias = type === 'js' ? name : `${name}.${type}`;

      iepMap[ticket] = stamp({
        ...iep,
        map: ImportMap(alias, iepName, iep.map),
        status: 'open',
        files: [...(iep.files || []).filter((file) => file !== alias), alias],
      });

      return res.send(log('update', iepMap[ticket]));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  };

  const revert = (req, res) => {
    const { ticket } = req.params;
    const prodTicket = (iepMap.prod[0] || {}).ticket === ticket;
    if (prodTicket) {
      iepMap[ticket] = stamp({
        ...iepMap.prod.shift(),
        stage: 'qa',
        status: 'reverted',
      });
      const prod = iepMap.prod[0] || { status: 'un-stamped' };
      return res.send(
        log('revert', {
          [ticket]: iepMap[ticket],
          prod,
        })
      );
    }
    const iep = iepMap[ticket];
    if (iep) {
      if (iep.stage === 'qa') {
        iepMap[ticket] = stamp({
          ...iep,
          stage: 'dev',
          status: 'reverted',
        });
      }
      if (iep.stage === 'dev') {
        iepMap[ticket] = stamp({
          ...iep,
          status: 'closed',
        });
      }
      return res.send(log('revert', iepMap[ticket]));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  };

  const close = (req, res) => {
    const { ticket } = req.params;
    const iep = iepMap[ticket];
    if (iep) {
      iepMap[ticket] = stamp({
        ...iep,
        status: 'closed',
      });
      return res.send(log('close', iepMap[ticket]));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  };

  // promote a ticket through dev -> QA -> prod
  // considerations:
  // - a ticket can only be promoted if master is the ancestor of HEAD
  // - if the promotion is from QA to prod, the HEAD could be merged in to master
  // - git hooks can be integrated into the promotion checks to ensure that the
  //   build has completed cleanly.
  const promote = (req, res) => {
    const { ticket } = req.params;
    const { isAncestor, status, base } = git();
    if (!isAncestor || status) {
      return res.status(403).send(status);
    }

    const iep = iepMap[ticket];
    if (iep) {
      const stage = iep.stage === 'dev' ? 'qa' : 'prod';
      iepMap[ticket] = stamp({
        ...iep,
        base,
        stage,
      });
      if (stage === 'prod') {
        iepMap.prod.unshift(iepMap[ticket]);
        delete iepMap[ticket];
        goLive(iepMap.prod[0].map);
      }
      return res.send(log('promote', iepMap[ticket] || iepMap.prod[0]));
    }

    res.status(404).send(`unrecognized ticket ${ticket}`);
  };

  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validTicket = (ticket, stage) => {
    const iep = iepMap[ticket] || {};
    return (iep.stage === stage && iep.map) || iepMap.prod[0];
  };

  // Currently only CJS-require is supported for SSR dependencies.
  // On the plus side this makes it easy to override the require
  // on a ticket by ticket basis.
  const isOverride = (ticket) => (request) => {
    return (
      ticket.map &&
      !request.startsWith('/iep') &&
      !!ticket.map.imports[request.split('/').pop()]
    );
  };
  const resolveRequest = (ticket) => (request) => {
    const module = require(`../..${
      ticket.map.imports[request.split('/').pop()]
    }`);
    return module.default || module;
  };

  // this render function may become unnecessary when true
  // SSR import mapping is supported.
  const render = (ticket, body) => {
    const restoreOriginalModuleLoader = overrideRequire(
      isOverride(ticket),
      resolveRequest(ticket)
    );
    const app = require(appPath);
    const buffer = (app.default || app)(body);
    restoreOriginalModuleLoader();
    return buffer;
  };

  const resolve = async (req, res) => {
    const [_, stage = 'prod', ticket] =
      req.headers.referer.match(/\?(dev|qa|prod)\=([^=^?^#]+)/) || [];
    let src = fs.readFileSync(`${srcPath}/${req.params[0]}`, 'utf8');
    const iep = iepMap[ticket] || iepMap.prod[0] || { map: {} };
    if (iep && iep.stage === stage) {
      const map = iep.map.imports;
      if (map) {
        await init;
        const [imports] = parse(src);
        src = imports.reduce((acc, { s, e }) => {
          const importS = acc.substring(s, e);
          const [name] = split(importS);
          if (map[name]) {
            return acc.replace(importS, map[name]);
          }
          return acc;
        }, src);
      }
    }
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    res.send(src);
  };

  return {
    validTicket,
    // refactor these into m/w
    list,
    register,
    update,
    promote,
    close,
    render,
    resolve,
    revert,
  };
};
