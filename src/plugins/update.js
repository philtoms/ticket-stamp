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
          .send(`ticket ${ticket} is already at ${iep.stage} stage`);
      }
      const iepName = `${name}.${md5}.${type}`;
      const iepPath = `${stampDir}/${iepName}`;
      fs.writeFileSync(iepPath, data);
      // Will probably split into SSR and CSR imports
      const alias = type === 'js' ? name : `${name}.${type}`;

      const stamped = stamp(
        {
          ...iep,
          map: ImportMap(iep.map, alias, iepPath),
          status: 'updated',
          files: [...(iep.files || []).filter((file) => file !== alias), alias],
        },
        true // restart worker to generate new import-map on next request
      );
      iepMap.set(ticket, stamped);
      return res.send(log('update', stamped));
    }
    res.status(404).send(`unrecognized ticket ${ticket}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
