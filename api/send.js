import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { to, subject, text, apiKey, from } = req.body;

  if (!apiKey || !from) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
  }

  try {
    const resend = new Resend(apiKey);
    
    await resend.emails.send({
      from: from,
      to: to,
      subject: subject,
      text: text
    });

    console.log(`[SUKSES] Pesan berhasil terkirim via ${from}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(`[LIMIT] Email ${from} gagal mengirim (Limit/Error): ${error.message}`);
    return res.status(429).json({ success: false, error: error.message });
  }
}
