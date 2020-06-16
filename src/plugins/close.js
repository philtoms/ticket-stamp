import log from '../utils/log';

export default (iepMap, stamp) => (req, res) => {
  const { ticket } = req.params;
  const iep = iepMap[ticket];
  if (iep) {
    iepMap[ticket] = stamp({
      ...iep,
      status: 'closed',
    });
    return res.send(log('close', iepMap[ticket]));
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};
