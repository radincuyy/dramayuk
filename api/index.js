// Vercel serverless function - single entry point
import express from 'express';
import cors from 'cors';

// Import API functions
import { getLatestMovies, getAllMoviesWithVariation } from '../backend/api/latest.js';
import { searchMovies } from '../backend/api/search.js';
import { getStreamLink } from '../backend/api/stream.js';
import { enhancedSearch } from '../backend/api/enhanced-search.js';

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'DramaYuk API is running on Vercel'
    });
});

// Latest movies
app.get('/latest', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        console.log(`API /latest called with page: ${page}`);
        
        const movies = await getLatestMovies(page);
        console.log(`Returning ${movies.length} movies for page ${page}`);
        
        res.json(movies);
    } catch (error) {
        console.error('Error in /api/latest:', error);
        res.status(500).json({ error: 'Gagal mengambil data film terbaru' });
    }
});

// Search movies
app.post('/search', async (req, res) => {
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
        
        res.json(movies);
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ error: 'Gagal mencari film' });
    }
});

// Stream link
app.post('/stream', async (req, res) => {
    try {
        const { bookId, index } = req.body;
        if (!bookId || !index) {
            return res.status(400).json({ error: 'bookId dan index diperlukan' });
        }
        
        const streamData = await getStreamLink(bookId, index);
        res.json(streamData);
    } catch (error) {
        console.error('Error in /api/stream:', error);
        res.status(500).json({ error: 'Gagal mengambil link streaming' });
    }
});

// All movies
app.get('/all-movies', async (req, res) => {
    try {
        const requestedPage = parseInt(req.query.page) || 1;
        
        console.log(`API Request: Getting movies for page ${requestedPage}`);
        
        const movies = await getAllMoviesWithVariation(requestedPage);
        
        console.log(`API Response: Got ${movies.length} unique movies`);
        
        res.json({
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
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint tidak ditemukan', path: req.path });
});

// Export for Vercel
export default app;