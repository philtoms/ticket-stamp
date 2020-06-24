import service from './service';

export default (entry) => (ticket, body) => {
  return new Promise((resolve) => {
    const { worker, requestId } = service(ticket);
    worker.send({ ticket, entry, body, requestId });
    worker.on('message', ({ responseId, buffer }) => {
      if (requestId === responseId) resolve(buffer);
    });
  });
};
