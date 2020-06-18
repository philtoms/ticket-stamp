export default (iepMap) => async (req, res) => {
  try {
    const { stage } = req.query;
    const tickets = await iepMap.getAll();
    res.send(
      tickets
        .filter(([ticket]) => !stage || ticket.startsWith(stage))
        .reduce(
          (acc, [ticket, data]) => ({
            ...acc,
            [ticket.split('/').pop()]: data,
          }),
          {}
        )
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
