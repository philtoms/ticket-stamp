import urlencode from 'urlencode';

process.on('message', ({ iep, entry, body }) => {
  const params = urlencode(JSON.stringify(iep));
  import(`${entry}?__iep=${params}`).then((app) =>
    process.send({ buffer: (app.default || app)(body) })
  );
});
