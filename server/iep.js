import fs from 'fs';
import ImportMap, { goLive } from './import-map';
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
    log(
      Object.entries(iepMap)
        .filter(([ticket]) => !stage || ticket.startsWith(stage))
        .reduce(
          (acc, [ticket, data]) => ({
            ...acc,
            [ticket.split('/').pop()]: data,
          }),
          {}
        )
    )
  );
};

const generateMap = ({ md5, name, data, map }) => {
  const [fileName, fileType] = name.split('.');
  const iepName = `${fileName}.${md5}.${fileType}`;
  fs.writeFileSync(`./modules/${iepName}`, data);
  return ImportMap(fileName, iepName, map);
};

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
        map: ImportMap(ticket),
        stage: 'dev',
        base: base || (iepMap.prod && iepMap.prod.base),
      });
    return res.send(log(iepMap[devTicket]));
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
    return res.send(log(iepMap[devTicket]));
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};

// promote a ticket through dev -> QA -> prod
// - a ticket can only be promoted if master is the ancestor of HEAD
// If the promotion is from QA to prod, the HEAD can be merged in to master
// - this could be automated here.
const promote = (req, res) => {
  const { ticket } = req.params;
  const devTicket = `dev/${ticket}`;
  const qaTicket = `qa/${ticket}`;
  const { canPromote, status } = git();
  if (!canPromote) {
    return res.status(401).send(status);
  }

  if (iepMap[devTicket] && !iepMap[qaTicket]) {
    iepMap[qaTicket] = stamp({
      ...iepMap[devTicket],
      stage: 'qa',
    });
    return res.send(iepMap[qaTicket]);
  }

  if (iepMap[qaTicket]) {
    iepMap.prod = stamp({
      ...iepMap[qaTicket],
      stage: 'prod',
    });
    delete iepMap[qaTicket];
    goLive(iepMap.prod.map);
    return res.send(iepMap.prod);
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};

const validTicket = (qa, dev) => {
  if (qa) return iepMap[`qa/${qa}`] || iepMap.prod;
  return iepMap[`dev/${dev}`] || iepMap.prod;
};

export default {
  list,
  register,
  update,
  promote,
  validTicket,
};
