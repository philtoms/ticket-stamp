import fs from 'fs';
import overrideRequire from 'override-require';

import ImportMap, { goLive } from '../utils/import-map';
import git from '../utils/git';
import log from '../utils/log';

const iepMap = {};

const stamp = (data) => ({
  ...data,
  user: process.env.USER,
  timestamp: Date().toString(),
});

export default (modulePath, appPath) => {
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
    // don't overwrite existing ticket work
    // - use update to do that
    const devTicket = `dev/${ticket}`;
    const newTicket = !iepMap[devTicket];
    iepMap[devTicket] =
      iepMap[devTicket] ||
      stamp({
        ticket,
        stage: 'dev',
        status: 'open',
        base,
        map: ImportMap(ticket),
      });

    return res
      .status(newTicket ? 201 : 200)
      .send(log('register', iepMap[devTicket]));
  };

  const update = (req, res) => {
    const { ticket } = req.params;
    const { name, type } = req.body;
    const { md5, data } = req.files.file;
    const devTicket = `dev/${ticket}`;
    const iep = iepMap[devTicket];
    if (iep) {
      const iepName = `${name}.${md5}.${type}`;
      fs.writeFileSync(`${modulePath}/${iepName}`, data);
      // Will probably split into SSR and CSR imports
      const alias = type === 'js' ? name : `${name}.${type}`;

      iepMap[devTicket] = stamp({
        ...iep,
        map: ImportMap(alias, iepName, iep.map),
        files: [...(iep.files || []).filter((file) => file !== alias), alias],
      });

      return res.send(log('update', iepMap[devTicket]));
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
    const devTicket = `dev/${ticket}`;
    const qaTicket = `qa/${ticket}`;
    const { isAncestor, status, base } = git();

    if (iepMap[devTicket] && !iepMap[qaTicket]) {
      if (isAncestor && !status) {
        return res.status(401).send(status);
      }
      iepMap[qaTicket] = stamp({
        ...iepMap[devTicket],
        base,
        stage: 'qa',
      });
      return res.send(log(iepMap[qaTicket]));
    }

    if (iepMap[qaTicket]) {
      if (isAncestor) {
        return res.status(403).send(status);
      }
      iepMap.prod = stamp({
        ...iepMap[qaTicket],
        base,
        stage: 'prod',
      });
      iepMap[qaTicket].status = 'closed';
      iepMap[devTicket].status = 'closed';
      goLive(iepMap.prod.map);
      return res.send(log('promote', iepMap.prod));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  };

  // export a ticketed map to the application. Use prod until the ticket
  // is ready
  const validTicket = (qa, dev) => {
    if (qa) return iepMap[`qa/${qa}`] || iepMap.prod;
    return iepMap[`dev/${dev}`] || iepMap.prod;
  };

  // Currently only CJS-require is supported for SSR dependencies.
  // On the plus side this makes it easy to override the require
  // on a ticket by ticket basis.
  const isOverride = (ticket) => (request) => {
    return (
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

  return {
    validTicket,
    // refactor these into m/w
    list,
    register,
    update,
    promote,
    render,
  };
};
