// Simple process.message based pub-sub.
import { workers } from '../service';

const subscriberCache = {};
const subscribers = (entity) => subscriberCache[entity] || [];

export const publish = (entity, message) => {
  subscribers(entity).forEach((subscriber) => subscriber(message));
  workers().forEach((worker) => {
    worker.send({ entity, message });
  });
};

export const subscribe = (entity, subscriber, process) => {
  subscriberCache[entity] = [...subscribers(entity), subscriber];
  process.on('message', ({ entity, message }) => {
    subscribers(entity).forEach((subscriber) => subscriber(message));
  });
};
