import stamp from '../utils/stamp';

export default ({ iep: { log } }, iepMap) => async (req, res) => {
  try {
    const {
      params: { ticket },
      stamp: { user, stage, id },
    } = req;

    const prod = await iepMap.get('prod');
    if (prod.find((entry) => entry.ticket === ticket)) {
      // when reverting from prod, ALWAYS revert from the head
      const stamped = stamp({
        ...JSON.parse(JSON.stringify(prod[0])),
        id,
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
      log.info('revert', {
        [ticket]: stamped,
      });
      return res.status(200).send(stamped);
    }

    const iep = await iepMap.get(ticket);
    if (iep) {
      const stamped = stamp({
        ...iep,
        id,
        user,
        stage: 'dev',
        status: 'reverted',
      });
      iepMap.set(ticket, stamped);
      log.info('revert', stamped);
      return res.status(200).send(stamped);
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    log.error(err);
    res.status(500).send('Server error');
  }
};
