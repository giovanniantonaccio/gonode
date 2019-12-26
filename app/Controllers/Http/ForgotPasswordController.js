'use strict';

const subDays = require('date-fns/subDays');
const isBefore = require('date-fns/isBefore');
const crypto = require('crypto');

const User = use('App/Models/User');
const Mail = use('Mail');

class ForgotPasswordController {
  async store({ request, response }) {
    try {
      const { email, redirect_url } = request.only(['email', 'redirect_url']);

      const user = await User.findByOrFail('email', email);

      user.token = crypto.randomBytes(10).toString('hex');
      user.token_created_at = new Date();

      await user.save();

      await Mail.send(
        ['emails.forgot_password', 'emails.forgot_password-text'],
        {
          email: user.email,
          token: user.token,
          link: `${redirect_url}?token=${user.token}`,
        },
        message => {
          message.subject('Recuperação de Senha');
          message.to(user.email);
          message.from('suporte@gonode.com', 'Equipe GoNode');
        }
      );
    } catch (err) {
      return response.status(err.status).send({
        error: { message: 'Algo não deu certo, esse e-mail existe?' },
      });
    }
  }

  async update({ request, response }) {
    try {
      const { token, password } = request.all();

      const user = await User.findByOrFail('token', token);

      const tokenExpired = isBefore(
        user.token_created_at,
        subDays(new Date(), 2)
      );

      if (tokenExpired) {
        return response.status(401).send({
          error: { message: 'O token de recuperação está expirado' },
        });
      }

      user.token = null;
      user.token_created_at = null;
      user.password = password;

      await user.save();
    } catch (err) {
      return response.status(err.status).send({
        error: { message: 'Algo deu errado ao resetar sua senha' },
      });
    }
  }
}

module.exports = ForgotPasswordController;
