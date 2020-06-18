import fs from 'fs';
import ImportMap from '../utils/import-map';
import log from '../utils/log';
import stamp from '../utils/stamp';

export default (iepMap, stampDir) => async (req, res) => {
  try {
    const { ticket } = req.params;
    const { name, type } = req.body;
    const { md5, data } = req.files.file;
    const iep = await iepMap.get(ticket);
    if (iep) {
      if (iep.stage !== 'dev') {
        return res
          .status(401)
          .send(`ticket ${ticket} is already at ${iepMap[ticket].stage} stage`);
      }
      const iepName = `${name}.${md5}.${type}`;
      fs.writeFileSync(`${stampDir}/${iepName}`, data);
      // Will probably split into SSR and CSR imports
      const alias = type === 'js' ? name : `${name}.${type}`;

      const stamped = stamp({
        ...iep,
        map: ImportMap(alias, iepName, iep.map),
        status: 'updated',
        files: [...(iep.files || []).filter((file) => file !== alias), alias],
      });
      iepMap.set(ticket, stamped);
      return res.send(log('update', stamped));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
