import { getStreamLink } from '../backend/api/stream.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { bookId, index } = req.body;
        if (!bookId || !index) {
            return res.status(400).json({ error: 'bookId dan index diperlukan' });
        }
        
        const streamData = await getStreamLink(bookId, index);
        res.status(200).json(streamData);
    } catch (error) {
        console.error('Error in /api/stream:', error);
        res.status(500).json({ error: 'Gagal mengambil link streaming' });
    }
}