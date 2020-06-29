import service from './service';

export default (serverEntry) => (ticket, body) => {
  return new Promise((resolve) => {
    const { worker, requestId } = service(ticket);
    worker.send({ ticket, serverEntry, body, requestId });
    worker.on('message', ({ responseId, buffer }) => {
      if (requestId === responseId) resolve(buffer);
    });
  });
};
