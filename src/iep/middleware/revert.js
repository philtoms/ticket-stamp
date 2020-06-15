import log from '../../utils/log';

export default (iepMap, stamp) => (req, res) => {
  const { ticket } = req.params;
  const prodTicket = (iepMap.prod[0] || {}).ticket === ticket;
  if (prodTicket) {
    iepMap[ticket] = stamp({
      ...iepMap.prod.shift(),
      stage: 'qa',
      status: 'reverted',
    });
    const prod = iepMap.prod[0] || { status: 'un-stamped' };
    return res.send(
      log('revert', {
        [ticket]: iepMap[ticket],
        prod,
      })
    );
  }
  const iep = iepMap[ticket];
  if (iep) {
    if (iep.stage === 'qa') {
      iepMap[ticket] = stamp({
        ...iep,
        stage: 'dev',
        status: 'reverted',
      });
    }
    if (iep.stage === 'dev') {
      iepMap[ticket] = stamp({
        ...iep,
        status: 'closed',
      });
    }
    return res.send(log('revert', iepMap[ticket]));
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};
