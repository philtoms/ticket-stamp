import { restart } from '../plugins/iep/service';

export default (data) => {
  // restart service to generate new import-map on next request
  restart(data.ticket);
  return {
    user: process.env.USER,
    ...data,
  };
};
