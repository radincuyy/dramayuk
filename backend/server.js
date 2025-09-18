import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import fungsi API
import { getLatestMovies, getAllMoviesWithVariation } from './api/latest.js';
import { searchMovies } from './api/search.js';
import { getStreamLink } from './api/stream.js';
import { getAllDramasComprehensive, getDramasByGenre } from './api/comprehensive.js';
import { enhancedSearch, paginatedSearch } from './api/enhanced-search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors({
    origin: NODE_ENV === 'production' 
        ? ['https://dramayuk.vercel.app', 'https://*.vercel.app'] 
        : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.get('/api/latest', async (req, res) => {
    try {
        const movies = await getLatestMovies();
        res.json(movies);
    } catch (error) {
        console.error('Error in /api/latest:', error);
        res.status(500).json({ error: 'Gagal mengambil data film terbaru' });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { keyword, enhanced = false } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword diperlukan' });
        }
        
        // Trim keyword tapi izinkan 1 huruf
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length === 0) {
            return res.status(400).json({ error: 'Keyword tidak boleh kosong' });
        }
        
        console.log(`🔍 Search request: "${trimmedKeyword}" (${trimmedKeyword.length} characters) - Enhanced: ${enhanced}`);
        
        let movies;
        if (enhanced) {
            // Gunakan enhanced search untuk hasil lebih banyak
            movies = await enhancedSearch(trimmedKeyword);
        } else {
            // Gunakan search biasa
            movies = await searchMovies(trimmedKeyword);
        }
        
        console.log(`✅ Search result: ${movies.length} movies found for "${trimmedKeyword}"`);
        
        res.json(movies);
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ error: 'Gagal mencari film' });
    }
});

// Endpoint khusus untuk enhanced search dengan pagination
app.post('/api/search-enhanced', async (req, res) => {
    try {
        const { keyword, page = 1, limit = 50 } = req.body;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword diperlukan' });
        }
        
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword.length === 0) {
            return res.status(400).json({ error: 'Keyword tidak boleh kosong' });
        }
        
        console.log(`🚀 Enhanced search request: "${trimmedKeyword}" - Page: ${page}, Limit: ${limit}`);
        
        const result = await paginatedSearch(trimmedKeyword, page, limit);
        
        console.log(`✅ Enhanced search result: ${result.totalResults} total, ${result.results.length} on page ${page}`);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /api/search-enhanced:', error);
        res.status(500).json({ error: 'Gagal melakukan enhanced search' });
    }
});

app.post('/api/stream', async (req, res) => {
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

// Endpoint untuk mendapatkan film berdasarkan halaman
app.get('/api/latest/:page?', async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        console.log(`API /latest called with page: ${page}`);
        
        const movies = await getLatestMovies(page);
        console.log(`Returning ${movies.length} movies for page ${page}`);
        
        res.json(movies); // Return movies directly for compatibility
    } catch (error) {
        console.error('Error in /api/latest:', error);
        res.status(500).json({ error: 'Gagal mengambil data film terbaru' });
    }
});

// Endpoint untuk mendapatkan semua film dengan strategi variasi
app.get('/api/all-movies', async (req, res) => {
    try {
        const requestedPage = parseInt(req.query.page) || 1;
        
        console.log(`API Request: Getting movies for page ${requestedPage}`);
        
        // Gunakan fungsi baru yang lebih cerdas
        const movies = await getAllMoviesWithVariation(requestedPage);
        
        console.log(`API Response: Got ${movies.length} unique movies`);
        
        res.json({
            movies: movies,
            currentPage: requestedPage,
            hasMore: movies.length >= 15, // Masih ada data jika dapat minimal 15
            totalLoaded: movies.length,
            strategy: 'variation'
        });
    } catch (error) {
        console.error('Error in /api/all-movies:', error);
        res.status(500).json({ error: 'Gagal mengambil semua film' });
    }
});

// Endpoint untuk mendapatkan SEMUA drama dengan strategi komprehensif
app.get('/api/comprehensive-dramas', async (req, res) => {
    try {
        console.log('🚀 API Request: Getting comprehensive drama collection...');
        
        const dramas = await getAllDramasComprehensive();
        
        console.log(`✅ API Response: Got ${dramas.length} total unique dramas`);
        
        res.json({
            dramas: dramas,
            totalCount: dramas.length,
            strategy: 'comprehensive',
            sources: {
                theater: dramas.filter(d => d.source === 'theater').length,
                search: dramas.filter(d => d.source === 'search').length,
                channels: dramas.filter(d => d.source?.startsWith('channel-')).length
            }
        });
    } catch (error) {
        console.error('Error in /api/comprehensive-dramas:', error);
        res.status(500).json({ error: 'Gagal mengambil koleksi drama komprehensif' });
    }
});

// Endpoint untuk mendapatkan drama berdasarkan genre spesifik
app.get('/api/dramas-by-genre/:genre', async (req, res) => {
    try {
        const genre = req.params.genre;
        console.log(`🎭 API Request: Getting dramas for genre ${genre}`);
        
        const dramas = await getDramasByGenre(genre);
        
        console.log(`✅ API Response: Got ${dramas.length} dramas for genre ${genre}`);
        
        res.json({
            genre: genre,
            dramas: dramas,
            count: dramas.length
        });
    } catch (error) {
        console.error(`Error in /api/dramas-by-genre/${req.params.genre}:`, error);
        res.status(500).json({ error: `Gagal mengambil drama untuk genre ${req.params.genre}` });
    }
});



// Route untuk favicon
app.get('/favicon.ico', (_req, res) => {
    res.status(204).end(); // No content for favicon
});

// Route untuk halaman utama
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: NODE_ENV === 'development' ? err.message : 'Internal server error' 
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint tidak ditemukan' });
    } else {
        // Redirect ke index.html untuk SPA routing
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📱 Buka browser dan akses: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${NODE_ENV}`);
});

export default app;