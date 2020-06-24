import { restart } from '../plugins/iep/service';

export default (data, restartRequired = false) => {
  if (restartRequired && data.stage === 'dev') restart(data.ticket);
  return {
    user: process.env.USER,
    ...data,
  };
};
