import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { inputCode, tempToken } = req.body;

  if (!inputCode || !tempToken) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const [hash, expires] = tempToken.split('.');

    // 1. Verificar si ya expiró el tiempo (3 minutos)
    if (Date.now() > parseInt(expires)) {
      return res.status(401).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // 2. Reconstruir el hash con el código que metió el usuario para comparar
    const dataToSign = `${inputCode}.${expires}`;
    const expectedHash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(dataToSign).digest('hex');

    // 3. Si los hashes coinciden, el código introducido es correcto
    if (hash === expectedHash) {
      return res.status(200).json({ success: true, sessionToken: 'activa' });
    } else {
      return res.status(400).json({ error: 'Código incorrecto. Verifica tu Telegram.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al validar el código' });
  }
}