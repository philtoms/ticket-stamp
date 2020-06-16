import ImportMap from '../utils/import-map';
import log from '../utils/log';

// tickets could be registered directly with IEP. In this workflow, ticket registration
// would be a distinct step before developer registration and would typically be performed
// by the ticket / workflow manager.
// An alternative is to integrate the IEP service with the ticket service.
// This alpha just accepts a unique ticket number
export default (iepMap, stamp) => (req, res) => {
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
