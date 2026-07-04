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
            
            // PERBAIKAN: Paksa bot membaca data Vercel. Jika gagal, lempar error agar pindah akun.
            if (response.data && response.data.success === false) {
                throw new Error("API Limit atau Ditolak");
            }

            sysLog("SUKSES", `Pesan berhasil terkirim via ${acc.senderEmail}`, cGreen);
            return true; // Jika sukses, hentikan perulangan
            
        } catch (err) {
            let nextAcc = accounts[i + 1] ? accounts[i + 1].senderEmail : "HABIS";
            sysLog("ROLLING", `Email ${acc.senderEmail} gagal/limit, lempar ke ${nextAcc}`, cYellow);
            // Kode akan otomatis lanjut ke putaran loop berikutnya (akun selanjutnya)
        }
    }
    
    sysLog("GAGAL", `Semua akun email telah limit! Nomor ${nomor} gagal diproses.`, cRed);
    return false;
}
