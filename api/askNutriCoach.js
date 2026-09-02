export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { prompt, clientName, clientDiet } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ reply: 'Error del sistema: Falta configurar la API Key en Vercel.' });
    }

    const systemInstruction = `
        Eres NutriCoach IA, el asistente virtual experto de Fitness Alianza Activa, creado por el coach Roberto.
        Estás hablando con el cliente: ${clientName}.
        
        PLAN NUTRICIONAL ACTUAL:
        - Alta Energía (Pierna): ${clientDiet?.tab1 ? clientDiet.tab1.join(' | ') : 'No especificado'}
        - Control y Recuperación: ${clientDiet?.tab2 ? clientDiet.tab2.join(' | ') : 'No especificado'}
        
        REGLAS ESTRICTAS:
        1. Precisión matemática: Alimentos en gramos (g) y pesados estrictamente en crudo.
        2. Huevos por unidad.
        3. Sé directo, rápido, motivador y responde exactamente a lo que el cliente te pregunta basándote en su plan.
    `;

    try {
        // Usamos gemini-1.5-flash asegurando la ruta estable
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${systemInstruction}\n\nPregunta del cliente: ${prompt}` }
                        ]
                    }
                ]
            })
        });

        const data = await geminiResponse.json();

        if (data.error) {
            console.error("Error de Gemini API:", data.error);
            return res.status(500).json({ reply: `Error de la API: ${data.error.message || 'Intenta de nuevo en unos segundos.'}` });
        }

        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta en este momento.';
        
        return res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return res.status(500).json({ reply: 'Ocurrió un error de conexión interno.' });
    }
}
