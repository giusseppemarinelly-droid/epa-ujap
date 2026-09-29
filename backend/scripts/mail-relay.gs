// Relay de correo de Epa. No corre en el backend: se pega en un proyecto de
// script.google.com y se publica como web app (Ejecutar como: Yo, Acceso:
// Cualquier usuario). El backend le hace POST con MAIL_RELAY_URL y
// MAIL_RELAY_SECRET, y el correo sale desde la cuenta de Gmail dueña del
// script (límite de Google: 100 destinatarios al día).

// Debe ser idéntico a MAIL_RELAY_SECRET en Render.
const SECRET = 'PEGA_AQUI_TU_CLAVE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return reply({ ok: false, error: 'unauthorized' });
    if (typeof data.to !== 'string' || !/^[^\s@,;]+@[^\s@,;]+$/.test(data.to)) {
      return reply({ ok: false, error: 'invalid recipient' });
    }
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.text,
      htmlBody: data.html,
      name: 'Epa',
    });
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

// Correr esto una vez a mano desde el editor para autorizar el permiso de
// enviar correos (y probar que llega).
function testSend() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Prueba relay Epa', 'Si te llegó esto, el relay funciona.');
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
