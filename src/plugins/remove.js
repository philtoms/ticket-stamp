export default ({ iepMap }) => async (req, res, next) => {
  const {
    params: { ticket },
  } = req;

  await iepMap.remove(ticket);
  const prod = (await iepMap.get('prod')).filter(
    (entry) => entry.ticket !== ticket
  );
  iepMap.set('prod', prod);
  next({ status: 200, payload: ticket, message: ticket });
};
