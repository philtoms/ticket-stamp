export default ({ iep: { log } }, iepMap) => async (req, res) => {
  try {
    const {
      params: { ticket },
    } = req;

    await iepMap.remove(ticket);
    const prod = (await iepMap.get('prod')).filter(
      (entry) => entry.ticket !== ticket
    );
    iepMap.set('prod', prod);
    log.info('removed', ticket);
    return res.status(200).send(ticket);
  } catch (err) {
    log.error(err);
    res.status(500).send('Server error');
  }
};
