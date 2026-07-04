async function sendViaRelay(nomor) {
    const accounts = await accCol.find({}).toArray();
    
    if (accounts.length === 0) {
        sysLog("GAGAL", "Tidak ada akun email di database!", cRed);
        return false;
    }

    for (let i = 0; i < accounts.length; i++) {
        let acc = accounts[i];
        
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
                timeout: 60000, // FIX: Memberikan waktu 60 detik agar tidak "Timeout 10000ms"
                validateStatus: () => true // FIX: Mencegah axios panik jika Vercel mengembalikan error 500
            });

            // Logika baru untuk mendeteksi kesuksesan
            const isSuccess = response.status === 200 && response.data && response.data.success === true;
            
            if (isSuccess) {
                sysLog("SUKSES", `Pesan berhasil terkirim via ${acc.senderEmail}`, cGreen);
                return true; 
            } else {
                // Mengambil pesan error dari respons Vercel/Resend
                const errorData = response.data && response.data.error ? response.data.error.message : (response.data ? response.data.message : `HTTP Status ${response.status}`);
                sysLog("ROLLING", `Email ${acc.senderEmail} ditolak: ${errorData}`, cYellow);
            }
            
        } catch (err) {
            // Menangkap error jika benar-benar putus koneksi / timeout lebih dari 60 detik
            sysLog("ROLLING", `Email ${acc.senderEmail} error koneksi/timeout: ${err.message}`, cRed);
        }
    }
    
    sysLog("GAGAL", `Semua akun email telah dicoba dan tidak ada yang berhasil untuk nomor ${nomor}.`, cRed);
    return false;
}
