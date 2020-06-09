import urlencode from 'urlencode';

process.on('message', ({ iep, appPath, body }) => {
  const params = urlencode(JSON.stringify(iep));
  import(`${appPath}?__iep=${params}`).then((app) =>
    process.send({ buffer: (app.default || app)(body) })
  );
});
