import stamp from '../utils/stamp';
import log from '../utils/log';

export default (iepMap) => async (req, res) => {
  try {
    const {
      params: { ticket },
      stamp: { user, stage },
    } = req;

    let prod = (await iepMap.get('prod')) || [{}];
    let iep = prod.find((entry) => entry.ticket === ticket);

    if (iep) {
      // when reverting from prod, ALWAYS revert from the head
      const stamped = stamp({
        ...prod[0],
        user,
        ticket,
        stage: stage || 'qa',
        status: 'reverted',
      });
      prod = prod.filter((entry) => entry.ticket !== ticket);
      const prodTicket = prod[0] || { status: 'un-stamped' };
      iepMap.set('prod', prod);
      iepMap.set(ticket, stamped);
      return res.send(
        log('revert', {
          [ticket]: stamped,
          prod: prodTicket,
        })
      );
    }

    iep = await iepMap.get(ticket);
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
