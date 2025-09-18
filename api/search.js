import { searchMovies } from '../backend/api/search.js';
import { enhancedSearch } from '../backend/api/enhanced-search.js';

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
        const { keyword, enhanced = false } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword diperlukan' });
        }
        
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length === 0) {
            return res.status(400).json({ error: 'Keyword tidak boleh kosong' });
        }
        
        console.log(`🔍 Search request: "${trimmedKeyword}" (${trimmedKeyword.length} characters) - Enhanced: ${enhanced}`);
        
        let movies;
        if (enhanced) {
            movies = await enhancedSearch(trimmedKeyword);
        } else {
            movies = await searchMovies(trimmedKeyword);
        }
        
        console.log(`✅ Search result: ${movies.length} movies found for "${trimmedKeyword}"`);
        
        res.status(200).json(movies);
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ error: 'Gagal mencari film' });
    }
}