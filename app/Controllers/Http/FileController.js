'use strict';

const File = use('App/Models/File');
const Helpers = use('Helpers');

class FileController {
  async show({ response, params }) {
    try {
      const file = await File.findOrFail(params.id);

      return response.download(Helpers.tmpPath(`uploads/${file.file}`));
    } catch (err) {
      return response
        .status(err.status)
        .send({ error: { message: 'Erro para mostrar o arquivo' } });
    }
  }

  async store({ request, response }) {
    try {
      if (!request.file('file'))
        return response
          .status(400)
          .send({ error: { message: 'Arquivo não enviado' } });

      const upload = request.file('file', { size: '2mb' });

      const fileName = `${Date.now()}.${upload.subtype}`;

      await upload.move(Helpers.tmpPath('uploads'), {
        name: fileName,
      });

      if (!upload.moved()) {
        throw upload.error();
      }

      const file = await File.create({
        file: fileName,
        name: upload.clientName,
        type: upload.type,
        subtype: upload.subtype,
      });

      return file;
    } catch (err) {
      return response
        .status(err.status)
        .send({ error: { message: 'Erro no upload de arquivo' } });
    }
  }
}

module.exports = FileController;
