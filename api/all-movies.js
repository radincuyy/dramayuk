import { getAllMoviesWithVariation } from '../backend/api/latest.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const requestedPage = parseInt(req.query.page) || 1;
        
        console.log(`API Request: Getting movies for page ${requestedPage}`);
        
        const movies = await getAllMoviesWithVariation(requestedPage);
        
        console.log(`API Response: Got ${movies.length} unique movies`);
        
        res.status(200).json({
            movies: movies,
            currentPage: requestedPage,
            hasMore: movies.length >= 15,
            totalLoaded: movies.length,
            strategy: 'variation'
        });
    } catch (error) {
        console.error('Error in /api/all-movies:', error);
        res.status(500).json({ error: 'Gagal mengambil semua film' });
    }
}