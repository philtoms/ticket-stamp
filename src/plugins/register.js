import ImportMap from '../utils/import-map';
import stamp from '../utils/stamp';

// tickets could be registered directly with IEP. In this workflow, ticket registration
// would be a distinct step before developer registration and would typically be performed
// by the ticket / workflow manager.
// An alternative is to integrate the IEP service with the ticket service.
// This alpha just accepts a unique ticket number
export default ({ iepMap }) => async (req, res, next) => {
  const {
    body: { ticket, base },
    stamp: { user, id },
  } = req;

  const prod = await iepMap.get('prod');
  const prodTicket = prod && prod.find((entry) => entry.ticket === ticket);
  // don't overwrite existing ticket work
  // - use update to do that
  if (prodTicket) {
    return next({ payload: `unchanged ticket ${ticket}` });
  }
  const iep = await iepMap.get(ticket);
  if (iep) {
    return next({ payload: `unchanged ticket ${ticket}` });
  }
  const stamped = stamp({
    id,
    user,
    ticket,
    stage: 'dev',
    status: 'registered',
    base,
    map: ImportMap((prod[0] || {}).map || { imports: {} }, ticket),
  });
  iepMap.set(ticket, stamped);
  next({ status: 201, message: stamped });
};
