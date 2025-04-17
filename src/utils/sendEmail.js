const nodemailer = require('nodemailer');

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // Ex: 'Gmail', 'Outlook'
  auth: {
    user: process.env.EMAIL_USER, // Seu endereço de e-mail
    pass: process.env.EMAIL_PASS, // Sua senha de e-mail ou senha de aplicativo (para Gmail)
  },
  // Outras configurações específicas do serviço de e-mail, se necessário
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Remetente
      to, // Destinatário(s)
      subject, // Assunto do e-mail
      html, // Corpo do e-mail em HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado:', info.messageId);
    return info; // Retorna as informações do envio (opcional)
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error; // Rejeita a promise em caso de erro
  }
};

module.exports = sendEmail;