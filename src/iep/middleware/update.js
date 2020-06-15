import fs from 'fs';
import ImportMap from '../../utils/import-map';
import log from '../../utils/log';

export default (iepMap, stamp, stampedPath) => (req, res) => {
  const { ticket } = req.params;
  const { name, type } = req.body;
  const { md5, data } = req.files.file;
  const iep = iepMap[ticket];
  if (iep) {
    if (iep.stage !== 'dev') {
      return res
        .status(401)
        .send(`ticket ${ticket} is already at ${iepMap[ticket].stage} stage`);
    }
    const iepName = `${name}.${md5}.${type}`;
    fs.writeFileSync(`${stampedPath}/${iepName}`, data);
    // Will probably split into SSR and CSR imports
    const alias = type === 'js' ? name : `${name}.${type}`;

    iepMap[ticket] = stamp({
      ...iep,
      map: ImportMap(alias, iepName, iep.map),
      status: 'open',
      files: [...(iep.files || []).filter((file) => file !== alias), alias],
    });

    return res.send(log('update', iepMap[ticket]));
  }
  res.status(404).send(`unrecognized ticket ${ticket}`);
};
