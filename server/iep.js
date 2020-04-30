import fs from 'fs';
import ImportMap, { goLive } from '../utils/import-map';
import git from '../utils/git';
import log from '../utils/log';

const iepMap = {};

const stamp = (data) => ({
  ...data,
  user: process.env.USER,
  timestamp: Date().toString(),
});

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

const generateMap = ({ md5, name, data, map }) => {
  const [fileName, fileType] = name.split('.');
  const iepName = `${fileName}.${md5}.${fileType}`;
  fs.writeFileSync(`./modules/${iepName}`, data);
  return ImportMap(fileName, iepName, map);
};

// tickets could be registered directly with IEP. In this workflow, ticket registration
// would be a distinct step before developer registration and would typically be performed
// the ticket / workflow manager.
// An alternative is to integrate the IEP service with the ticket service.
const fakeTickets = 'AUSA-200,AUSA-201';
const register = (req, res) => {
  const { ticket, base } = req.body;
  if (fakeTickets.includes(ticket)) {
    // don't overwrite existing ticket work
    // - use update to do that
    const devTicket = `dev/${ticket}`;
    iepMap[devTicket] =
      iepMap[devTicket] ||
      stamp({
        ticket,
        stage: 'dev',
        base,
        map: ImportMap(ticket),
      });
    return res.send(log('register', iepMap[devTicket]));
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};

const update = (req, res) => {
  const { ticket } = req.params;
  const devTicket = `dev/${ticket}`;
  if (iepMap[devTicket]) {
    iepMap[devTicket] = stamp(
      Object.values(req.files).reduce(
        (acc, file) => ({
          ...acc,
          map: generateMap(file),
          files: [...(acc.files || []), file.name.split('.').shift()],
        }),
        iepMap[devTicket]
      )
    );
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
  const { canPromote, status, base } = git();
  if (!canPromote) {
    return res.status(401).send(status);
  }

  if (iepMap[devTicket] && !iepMap[qaTicket]) {
    iepMap[qaTicket] = stamp({
      ...iepMap[devTicket],
      base,
      stage: 'qa',
    });
    return res.send(log(iepMap[qaTicket]));
  }

  if (iepMap[qaTicket]) {
    iepMap.prod = stamp({
      ...iepMap[qaTicket],
      base,
      stage: 'prod',
    });
    delete iepMap[qaTicket];
    delete iepMap[devTicket];
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

export default {
  validTicket,
  // refactor these into m/w
  list,
  register,
  update,
  promote,
};
