import { getLatestMovies } from '../backend/api/latest.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const page = parseInt(req.query.page) || 1;
        console.log(`API /latest called with page: ${page}`);
        
        const movies = await getLatestMovies(page);
        console.log(`Returning ${movies.length} movies for page ${page}`);
        
        res.status(200).json(movies);
    } catch (error) {
        console.error('Error in /api/latest:', error);
        res.status(500).json({ error: 'Gagal mengambil data film terbaru' });
    }
}