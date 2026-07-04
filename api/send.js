async function sendViaRelay(nomor) {
    const accounts = await accCol.find({}).toArray();
    
    for (let i = 0; i < accounts.length; i++) {
        let acc = accounts[i];
        
        // Gunakan try-catch agar jika satu akun error/limit, ia tidak menghentikan bot
        try {
            const response = await axios({
                method: 'post',
                url: VERCEL_API_URL,
                data: {
                    to: "android@support.whatsapp.com", 
                    subject: `Pregunta sobre WhatsApp 'Login not available' : ${nomor}`,
                    text: `Hola Soporte de WhatsApp, me gustaría apelar sobre el problema de registro de mi cuenta. Mi número (${nomor}) actualmente muestra 'Login not available'. ¿Podrían revisar y ajudar a resolver esto? Gracias.`,
                    apiKey: acc.apiKey, 
                    from: acc.senderEmail
                },
                validateStatus: function (status) {
                    return status < 500; // Hanya melempar error jika status >= 500 (Server Error)
                }
            });

            // Cek jika API Vercel mengembalikan success: true
            if (response.status === 200 && response.data && response.data.success === true) {
                sysLog("SUKSES", `Pesan berhasil terkirim via ${acc.senderEmail}`, cGreen);
                return true; 
            } else {
                // Jika status 200 tapi success false, anggap gagal (mungkin limit)
                const msg = response.data ? response.data.message : "No response data";
                sysLog("ROLLING", `Email ${acc.senderEmail} menolak (Limit/Error): ${msg}`, cYellow);
                // Lanjut ke akun berikutnya
            }
            
        } catch (err) {
            // Menangkap error koneksi (jika server down atau timeout)
            sysLog("ROLLING", `Email ${acc.senderEmail} error koneksi: ${err.message}`, cRed);
            // Lanjut ke akun berikutnya
        }
    }
    
    sysLog("GAGAL", `Semua akun email telah dicoba dan tidak ada yang berhasil untuk nomor ${nomor}.`, cRed);
    return false;
}
