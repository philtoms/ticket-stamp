import log from '../utils/log';

export default (iepMap) => async (req, res) => {
  try {
    const {
      params: { ticket },
    } = req;

    await iepMap.remove(ticket);
    const prod = (await iepMap.get('prod')).filter(
      (entry) => entry.ticket !== ticket
    );
    iepMap.set('prod', prod);
    return res.send(log('removed', ticket));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
