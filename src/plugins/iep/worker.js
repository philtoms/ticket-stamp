import se from 'serialize-error';

process.on('message', ({ ticket, serverEntry, body, requestId }) => {
  if (requestId) {
    import(`${serverEntry}?__iep=${ticket}`)
      .then((app) =>
        process.send({
          responseId: requestId,
          buffer: (app.default || app)(body),
        })
      )
      .catch((err) => {
        process.send({
          responseId: requestId,
          err: JSON.stringify(se.serializeError(err)),
        });
      });
  }
});
