async function sendViaRelay(nomor) {
    const accounts = await accCol.find({}).toArray();
    
    for (let i = 0; i < accounts.length; i++) {
        let acc = accounts[i];
        try {
            const response = await axios.post(VERCEL_API_URL, {
                to: "android@support.whatsapp.com", 
                subject: `Pregunta sobre WhatsApp 'Login not available' : ${nomor}`,
                text: `Hola Soporte de WhatsApp, me gustaría apelar sobre el problema de registro de mi cuenta. Mi número (${nomor}) actualmente muestra 'Login not available'. ¿Podrían revisar y ajudar a resolver esto? Gracias.`,
                apiKey: acc.apiKey, 
                from: acc.senderEmail
            });
            
            // LOG RESPONS MENTAH: Ini akan membantu kita melihat apa yang sebenarnya terjadi
            sysLog("DEBUG", `Respons Vercel [${acc.senderEmail}]: ${JSON.stringify(response.data)}`, cGray);
            
            // Cek sukses di level API (termasuk jika Resend menolak dengan success: false)
            if (response.data && response.data.success === true) {
                sysLog("SUKSES", `Pesan berhasil terkirim via ${acc.senderEmail}`, cGreen);
                return true; 
            } else {
                throw new Error(response.data.message || "Gagal di sisi API");
            }
            
        } catch (err) {
            sysLog("ROLLING", `Email ${acc.senderEmail} gagal: ${err.message}`, cRed);
            // Kode akan lanjut ke akun berikutnya karena error tertangkap di catch
        }
    }
    
    sysLog("GAGAL", `Semua akun email telah dicoba dan gagal. Nomor ${nomor} tidak terkirim.`, cRed);
    return false;
}
