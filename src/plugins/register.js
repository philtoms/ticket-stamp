import ImportMap from '../utils/import-map';
import log from '../utils/log';

// tickets could be registered directly with IEP. In this workflow, ticket registration
// would be a distinct step before developer registration and would typically be performed
// by the ticket / workflow manager.
// An alternative is to integrate the IEP service with the ticket service.
// This alpha just accepts a unique ticket number
export default (iepMap, stamp) => async (req, res) => {
  try {
    const { ticket, base } = req.body;
    const prod = await iepMap.get('prod');
    const prodTicket = prod && prod.find((entry) => entry.ticket === ticket);
    if (prodTicket) {
      return res.status(200).send(prodTicket);
    }
    // don't overwrite existing ticket work
    // - use update to do that
    const iep = await iepMap.get(ticket);
    const stamped =
      iep ||
      stamp({
        ticket,
        stage: 'dev',
        status: 'open',
        base,
        map: ImportMap(ticket, null, prod[0]),
        cache: {},
      });
    iepMap.set(ticket, stamped);
    return res.status(iep ? 200 : 201).send(log('register', stamped));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
