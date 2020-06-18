import log from '../utils/log';

export default (iepMap, stamp) => async (req, res) => {
  try {
    const { ticket } = req.params;
    const prod = await iepMap.get('prod');
    if (prod) {
      if ((prod[0] || {}).ticket === ticket) {
        const stamped = stamp({
          ...prod.shift(),
          stage: 'qa',
          status: 'reverted',
        });
        const prodTicket = prod[0] || { status: 'un-stamped' };
        return res.send(
          log('revert', {
            [ticket]: stamped,
            prod: prodTicket,
          })
        );
      }
    }
    const iep = await iepMap.get(ticket);
    if (iep) {
      let stamped;
      if (iep.stage === 'qa') {
        stamped = stamp({
          ...iep,
          stage: 'dev',
          status: 'reverted',
        });
      }
      if (iep.stage === 'dev') {
        stamped = stamp({
          ...iep,
          status: 'closed',
        });
      }
      iepMap.set(ticket, stamped);
      return res.send(log('revert', stamped));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
