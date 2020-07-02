import se from 'serialize-error';
import service from './service';

export default (serverEntry) => (ticket, body) => {
  return new Promise((resolve, reject) => {
    const { worker, requestId } = service(ticket);
    worker.send({ ticket, serverEntry, body, requestId });
    worker.on('message', ({ responseId, buffer, err }) => {
      if (err) {
        reject(se.deserializeError(JSON.parse(err)));
      }
      if (requestId === responseId) resolve(buffer);
    });
  });
};
