import urlencode from 'urlencode';

process.on('message', ({ iep, entry, body, requestId }) => {
  const params = urlencode(JSON.stringify(iep));
  import(`${entry}?__iep=${params}`).then((app) =>
    process.send({ responseId: requestId, buffer: (app.default || app)(body) })
  );
});
