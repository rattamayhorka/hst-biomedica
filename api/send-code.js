import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // 1. Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    // 2. Enviar mensaje por el Bot de Telegram
    const telRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔐 BÚNKER 2FA\n\nTu código de acceso es: ${code}\nExpira en 3 minutos.`
      })
    });

    if (!telRes.ok) {
      return res.status(500).json({ error: 'Error al enviar mensaje por Telegram' });
    }

    // 3. Ofuscar el código para el cliente usando una firma simple basada en tiempo (sin librerías pesadas)
    const expires = Date.now() + 3 * 60 * 1000; // 3 minutos
    const dataToSign = `${code}.${expires}`;
    const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(dataToSign).digest('hex');
    const tempToken = `${hash}.${expires}`;

    return res.status(200).json({ success: true, tempToken });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}