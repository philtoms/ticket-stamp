import { restart } from 'iep';

export default (data) => {
  // restart service to generate new import-map on next request
  restart(data.ticket);
  return {
    user: process.env.USER,
    ...data,
  };
};
