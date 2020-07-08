export default ({ iepMap }) => async (req, res, next) => {
  const { stage } = req.query;
  const tickets = await iepMap.getAll();
  next({
    payload: Object.entries(tickets)
      .filter(([ticket]) => !stage || ticket.startsWith(stage))
      .reduce(
        (acc, [ticket, data]) => ({
          ...acc,
          [ticket.split('/').pop()]: data,
        }),
        {}
      ),
  });
};
