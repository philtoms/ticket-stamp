import ImportMap from '../utils/import-map';
import stamp from '../utils/stamp';
import log from '../utils/log';

// tickets could be registered directly with IEP. In this workflow, ticket registration
// would be a distinct step before developer registration and would typically be performed
// by the ticket / workflow manager.
// An alternative is to integrate the IEP service with the ticket service.
// This alpha just accepts a unique ticket number
export default (iepMap) => async (req, res) => {
  try {
    const {
      body: { ticket, base },
      stamp: { user },
    } = req;

    const prod = await iepMap.get('prod');
    const prodTicket = prod && prod.find((entry) => entry.ticket === ticket);
    // don't overwrite existing ticket work
    // - use update to do that
    if (prodTicket) {
      return res.status(200).send(prodTicket);
    }
    const iep = await iepMap.get(ticket);
    const stamped =
      iep ||
      stamp({
        user,
        ticket,
        stage: 'dev',
        status: 'registered',
        base,
        map: ImportMap((prod[0] || {}).map || { imports: {} }, ticket),
      });
    iepMap.set(ticket, stamped);
    return res.status(iep ? 200 : 201).send(log('register', stamped));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
