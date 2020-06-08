import fs from 'fs';
import { fork } from 'child_process';

import ImportMap, { goLive } from '../utils/import-map';
import git from '../utils/git';
import log from '../utils/log';
import resolveSrc from './resolve-src';

const iepMap = { prod: [] };
const serviceMap = {};

const stamp = (data) => {
  restartWorker(data.ticket, data.stage);
  return {
    ...data,
    user: process.env.USER,
    timestamp: Date().toString(),
  };
};

const restartWorker = (ticket, stage) => {
  if (serviceMap[ticket]) {
    serviceMap[ticket].kill();
    delete serviceMap[ticket];
  }
  if (stage === 'dev') {
    serviceMap[ticket] = fork('./src/iep/worker.js');
  }
};

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
        cache: {},
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
    return (iep.stage === stage && iep) || iepMap.prod[0];
  };

  // this render function may become unnecessary when true
  // SSR import mapping is supported.
  const render = async (iep, body) => {
    return new Promise((resolve) => {
      serviceMap[iep.ticket].send({ iep, appPath, body });
      serviceMap[iep.ticket].on('message', ({ buffer }) => {
        if (buffer) resolve(buffer);
      });
    });
  };
  const resolve = (req, res, next) => {
    const path = `${srcPath}/${req.params[0]}`;
    fs.access(path, fs.F_OK, async (err) => {
      if (err) {
        console.log(path);
        return next();
      }
      const [_, stage = 'prod', ticket] =
        req.headers.referer.match(/\?(dev|qa|prod)\=([^=^?^#]+)/) || [];
      let src = fs.readFileSync(path, 'utf8');
      const iep = iepMap[ticket] || iepMap.prod[0] || { map: {} };
      if (iep && iep.stage === stage) {
        resolveSrc(src, path, iep.map).then((src) => {
          res.setHeader(
            'Content-Type',
            'application/javascript; charset=UTF-8'
          );
          res.send(src);
        });
      }
    });
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
