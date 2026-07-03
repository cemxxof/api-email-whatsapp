import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Menerima paket data lengkap dari Telegram, termasuk 'from' dan 'apiKey'
  const { to, subject, text, apiKey, from } = req.body;

  if (!apiKey || !from) {
    return res.status(400).json({ success: false, message: 'API Key atau Email Pengirim (from) tidak lengkap.' });
  }

  try {
    const resend = new Resend(apiKey);
    
    const data = await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      text: text
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    // Mengirim status 429 agar bot Telegram tahu akun ini limit/error
    return res.status(429).json({ success: false, error: error.message });
  }
}
