import log from '../utils/log';

export default (iepMap, stamp) => async (req, res) => {
  try {
    const { ticket } = req.params;
    const iep = await iepMap.get(ticket);
    if (iep) {
      const stamped = stamp({
        ...iep,
        status: 'closed',
      });

      iepMap.set(ticket, stamped);
      return res.send(log('close', stamped));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
