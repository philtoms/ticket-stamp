import cookieParser from 'cookie-parser';

export default () => {
  const parse = cookieParser();
  return (req) => {
    if (!req.cookies) parse(req, null, () => {});
    const [stage, ticket] = (req.cookies.iep || '').split('=');
    return { stage, ticket };
  };
};
