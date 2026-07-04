const https = require('https');

module.exports = function(req, res) {
    // 1. Pastikan hanya menerima request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 2. Ambil data dengan aman
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { to, subject, text, apiKey, from } = body || {};

        if (!to || !apiKey || !from) {
            return res.status(400).json({ success: false, message: 'Data API tidak lengkap' });
        }

        // 3. Susun data untuk Resend
        const payload = JSON.stringify({
            from: from,
            to: to,
            subject: subject,
            text: text
        });

        const options = {
            hostname: 'api.resend.com',
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        // 4. Kirim ke Resend menggunakan HTTP bawaan sistem
        const request = https.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => { data += chunk; });
            
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Jika sukses (Status 200)
                    if (response.statusCode === 200) {
                        res.status(200).json({ success: true, data: parsed });
                    } else {
                        // Jika Resend menolak (Limit/Salah API Key)
                        res.status(response.statusCode).json({ success: false, message: parsed.message || 'Ditolak Resend', error: parsed });
                    }
                } catch (e) {
                    res.status(500).json({ success: false, message: 'Gagal membaca respon Resend' });
                }
            });
        });

        // 5. Tangkap jika Vercel gagal nyambung ke Resend
        request.on('error', (error) => {
            res.status(500).json({ success: false, message: 'Koneksi ke Resend putus: ' + error.message });
        });

        // Eksekusi
        request.write(payload);
        request.end();

    } catch (error) {
        // Tangkap error sistem Vercel agar tidak muncul error 500 misterius
        return res.status(500).json({ success: false, message: 'System Error', detail: error.message });
    }
};
        
