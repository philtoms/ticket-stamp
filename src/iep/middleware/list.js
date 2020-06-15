export default (iepMap) => (req, res) => {
  const { stage } = req.query;
  res.send(
    Object.entries(iepMap)
      .filter(([ticket]) => !stage || ticket.startsWith(stage))
      .reduce(
        (acc, [ticket, data]) => ({
          ...acc,
          [ticket.split('/').pop()]: data,
        }),
        {}
      )
  );
};
