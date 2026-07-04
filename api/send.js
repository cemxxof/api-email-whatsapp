const https = require('https');

module.exports = function(req, res) {
    // 1. Pastikan hanya menerima request POST
    if (req.method !== 'POST') {
        console.warn(`[ WARN ] Method ditolak: ${req.method}. Hanya menerima POST.`);
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 2. Ambil data dengan aman
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { to, subject, text, apiKey, from } = body || {};

        // === LOG: MENCATAT DATA MASUK ===
        console.log(`[ INFO ] Request masuk dari VPS!`);
        console.log(`[ INFO ] Pengirim (From): ${from}`);
        console.log(`[ INFO ] Tujuan (To): ${to}`);
        console.log(`[ INFO ] Subjek: ${subject}`);
        console.log(`[ INFO ] Isi Pesan: ${text ? text.substring(0, 30) + '...' : 'KOSONG'}`);

        if (!to || !apiKey || !from) {
            console.error(`[ ERROR ] Data API tidak lengkap. Ditolak oleh Vercel.`);
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

        console.log(`[ INFO ] Menghubungi server Resend...`);

        // 4. Kirim ke Resend menggunakan HTTP bawaan sistem
        const request = https.request(options, (response) => {
            let data = '';
            
            response.on('data', (chunk) => { data += chunk; });
            
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Jika sukses (Status 200)
                    if (response.statusCode === 200) {
                        // === LOG: MENCATAT SUKSES ===
                        console.log(`[ SUKSES ] Email berhasil diteruskan! ID Resend:`, parsed.id);
                        res.status(200).json({ success: true, data: parsed });
                    } else {
                        // Jika Resend menolak (Limit/Salah API Key)
                        // === LOG: MENCATAT GAGAL DARI RESEND ===
                        console.warn(`[ GAGAL ] Resend menolak pengiriman. Status: ${response.statusCode}`, parsed);
                        res.status(response.statusCode).json({ success: false, message: parsed.message || 'Ditolak Resend', error: parsed });
                    }
                } catch (e) {
                    console.error(`[ ERROR ] Gagal membaca respon dari Resend: ${e.message}`);
                    res.status(500).json({ success: false, message: 'Gagal membaca respon Resend' });
                }
            });
        });

        // 5. Tangkap jika Vercel gagal nyambung ke Resend
        request.on('error', (error) => {
            console.error(`[ ERROR ] Koneksi Vercel ke Resend terputus:`, error.message);
            res.status(500).json({ success: false, message: 'Koneksi ke Resend putus: ' + error.message });
        });

        // Eksekusi
        request.write(payload);
        request.end();

    } catch (error) {
        // Tangkap error sistem Vercel agar tidak muncul error 500 misterius
        console.error(`[ FATAL ] Sistem Vercel Crash:`, error.message);
        return res.status(500).json({ success: false, message: 'System Error', detail: error.message });
    }
};
