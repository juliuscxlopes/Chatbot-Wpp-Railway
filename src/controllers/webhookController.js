// controllers/webhookController.js
//const sendSalesMessage = require('../whatsapp/sendSalesMessage');
//const sendExitMessage = require('../whatsapp/sendExitMessage');
const sendGreetingMessage = require('../whatsapp/sendGreetingMessage');
const sendMenuPrincipal = require('../whatsapp/sendMenuPrincipal');
//const sendSupportMessage = require('../whatsapp/sendSupportMessage');
const sendCNPJMessage = require('../whatsapp/sendCNPJMessage');
const sendEmailMessage = require('../whatsapp/sendEmailMessage');
const { processContactMessage } = require('./controller'); // Verifique o caminho

const handleWebhook = async (req, res, next) => {
  const { type } = req.processedData;

  if (type === 'message') {
    const { contact, text } = req.processedData;
    const normalizedText = text.toLowerCase().trim();

    console.log('Received message:', { contact, text });

    try {
      switch (contact.step) {
        case '':  // Se o step estiver vazio, inicia a conversa com a saudação
          await sendGreetingMessage(contact.phoneNumber);
          contact.step = 'getCNPJ';  // Define o próximo passo
          console.log('Step updated to getCNPJ', contact.step);
          await sendCNPJMessage(contact.phoneNumber);
          contact.step = 'awaitCNPJ';  // Define o próximo passo
          break;
        case 'getEmail':
          await sendEmailMessage(contact.phoneNumber);
          contact.step = 'awaitEMAIL';  // Define o próximo passo
          break;
        default:
          console.log('Default case for message handling');
          await sendGreetingMessage(contact.phoneNumber);
          await sendMenuPrincipal(contact.phoneNumber);
          break;
      }

      // Chama processContactMessage apenas quando o step é 'awaitCNPJ' ou 'awaitEMAIL'
      if (contact.step === 'awaitCNPJ' || contact.step === 'awaitEMAIL') {
        await processContactMessage(contact, normalizedText);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  } else if (type === 'status') {
    const { id, status } = req.processedData;
    console.log(`Message ID: ${id}, Status: ${status}`);
  }

  res.sendStatus(200);
};

module.exports = { handleWebhook };
