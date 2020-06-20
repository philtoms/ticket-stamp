process.on('message', ({ ticket, entry, body, requestId }) => {
  import(`${entry}?__iep=${ticket}`).then((app) =>
    process.send({ responseId: requestId, buffer: (app.default || app)(body) })
  );
});
