// /api/gemini.js

export default async function handler(req, res) {

    if (req.method !== 'POST') return res.status(405).end();
    
    const prompt = req.body.prompt;
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Google Gemini APIへfetchで接続し、レスポンスを返す処理を実装
    
    }
