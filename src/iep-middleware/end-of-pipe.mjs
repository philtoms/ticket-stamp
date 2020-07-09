export default (ctx) => (req, res, next) => {
  const { status = 200, message = '', payload = message } = req[ctx];

  res.status(status).send(payload);

  next({ status, message });
};
