export default (ctx, mw) => async (req, res, next) => {
  try {
    await mw(req, res, (response) => {
      if (response) {
        const { status, message } = response;
        if (!status && message) {
          throw response;
        }
        req[ctx] = {
          ...req[ctx],
          ...response,
        };
      }
    });
    next();
  } catch (err) {
    next({
      message: err.stack,
      payload: err.stack,
      status: 500,
    });
  }
};
