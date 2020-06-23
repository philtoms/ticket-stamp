import stamp from '../utils/stamp';
import log from '../utils/log';

export default (iepMap) => async (req, res) => {
  try {
    const {
      params: { ticket },
      stamp: { user, stage },
    } = req;

    const prod = await iepMap.get('prod');
    if (prod.find((entry) => entry.ticket === ticket)) {
      // when reverting from prod, ALWAYS revert from the head
      const stamped = stamp({
        ...JSON.parse(JSON.stringify(prod[0])),
        user,
        ticket,
        stage: stage || 'qa',
        status: 'reverted',
      });
      iepMap.set(
        'prod',
        prod.filter((entry) => entry.ticket !== ticket)
      );
      iepMap.set(ticket, stamped);
      return res.send(
        log('revert', {
          [ticket]: stamped,
        })
      );
    }

    const iep = await iepMap.get(ticket);
    if (iep) {
      const stamped = stamp({
        ...iep,
        user,
        stage: 'dev',
        status: 'reverted',
      });
      iepMap.set(ticket, stamped);
      return res.send(log('revert', stamped));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    log.error(err);
    res.status(500).send('Server error');
  }
};
