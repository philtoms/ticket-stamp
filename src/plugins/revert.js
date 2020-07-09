import stamp from '../utils/stamp';

export default ({ iepMap }) => async (req, res, next) => {
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
    return next({ status: 200, payload: stamped, message: stamped });
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
    return next({ status: 200, payload: stamped, message: stamped });
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};
