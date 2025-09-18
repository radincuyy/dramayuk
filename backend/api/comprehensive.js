import axios from 'axios';
import { token } from './get-token.js';
import { getAllMoviesWithVariation } from './latest.js';
import { searchMovies } from './search.js';

// Strategi komprehensif untuk mendapatkan sebanyak mungkin drama
export async function getAllDramasComprehensive() {
    try {
        console.log('🚀 Starting comprehensive drama collection...');
        
        const allDramas = new Map(); // Gunakan Map untuk avoid duplicates
        
        // 1. Ambil dari Latest API dengan berbagai variasi
        console.log('📺 Collecting from Theater API...');
        const theaterDramas = await getAllMoviesWithVariation(1);
        theaterDramas.forEach(drama => {
            allDramas.set(drama.bookId, { ...drama, source: 'theater' });
        });
        console.log(`✅ Theater API: ${theaterDramas.length} dramas`);
        
        // 2. Ambil dari Search API dengan keyword populer
        console.log('🔍 Collecting from Search API...');
        const searchKeywords = [
            // Genre keywords
            'romance', 'drama', 'comedy', 'action', 'thriller', 'fantasy',
            'historical', 'modern', 'family', 'school', 'office', 'medical',
            
            // Popular themes
            'love', 'marriage', 'ceo', 'boss', 'contract', 'fake', 'rich',
            'poor', 'revenge', 'secret', 'hidden', 'identity', 'twin',
            'substitute', 'arranged', 'forced', 'divorce', 'ex', 'husband',
            'wife', 'pregnant', 'baby', 'child', 'daughter', 'son',
            
            // Common words
            'the', 'my', 'his', 'her', 'our', 'you', 'me', 'i', 'we',
            'and', 'or', 'but', 'with', 'for', 'to', 'from', 'in', 'on',
            
            // Single letters (sometimes work)
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
            'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
        ];
        
        let searchCount = 0;
        for (const keyword of searchKeywords) {
            try {
                const searchResults = await searchMovies(keyword);
                searchResults.forEach(drama => {
                    if (!allDramas.has(drama.bookId)) {
                        allDramas.set(drama.bookId, { ...drama, source: 'search', keyword });
                        searchCount++;
                    }
                });
                
                // Rate limiting - jangan terlalu cepat
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Search failed for keyword "${keyword}":`, error.message);
            }
        }
        console.log(`✅ Search API: ${searchCount} new dramas`);
        
        // 3. Ambil dari berbagai channel ID jika memungkinkan
        console.log('📡 Trying different channels...');
        const channelIds = [43, 44, 45, 46, 47, 48, 49, 50]; // Coba berbagai channel
        let channelCount = 0;
        
        for (const channelId of channelIds) {
            try {
                const channelDramas = await getLatestMoviesFromChannel(channelId, 1);
                channelDramas.forEach(drama => {
                    if (!allDramas.has(drama.bookId)) {
                        allDramas.set(drama.bookId, { ...drama, source: `channel-${channelId}` });
                        channelCount++;
                    }
                });
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Channel ${channelId} failed:`, error.message);
            }
        }
        console.log(`✅ Different Channels: ${channelCount} new dramas`);
        
        const finalDramas = Array.from(allDramas.values());
        console.log(`🎉 Total Comprehensive Collection: ${finalDramas.length} unique dramas`);
        
        return finalDramas;
        
    } catch (error) {
        console.error('❌ Error in comprehensive collection:', error);
        return [];
    }
}

// Fungsi helper untuk channel yang berbeda
async function getLatestMoviesFromChannel(channelId, pageNo = 1) {
    try {
        const gettoken = await token();
        const url = "https://sapi.dramaboxdb.com/drama-box/he001/theater";

        const headers = {
            "User-Agent": "okhttp/4.10.0",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
            "tn": `Bearer ${gettoken.token}`,
            "version": "430",
            "vn": "4.3.0",
            "cid": "DRA1000042",
            "package-name": "com.storymatrix.drama",
            "apn": "1",
            "device-id": gettoken.deviceid,
            "language": "in",
            "current-language": "in",
            "p": "43",
            "time-zone": "+0800",
            "content-type": "application/json; charset=UTF-8"
        };

        const data = {
            newChannelStyle: 1,
            isNeedRank: 1,
            pageNo: pageNo,
            index: 1,
            channelId: channelId
        };

        const response = await axios.post(url, data, { headers });
        const movies = response.data.data.newTheaterList?.records || [];

        return movies.map(movie => ({
            bookId: movie.bookId,
            title: movie.bookName,
            chapterCount: movie.chapterCount,
            poster: movie.coverWap,
            description: movie.introduction,
            rating: movie.score || 0,
            genre: movie.tags ? movie.tags.join(', ') : 'Drama',
            playCount: movie.playCount,
            year: new Date().getFullYear(),
            quality: 'HD',
            duration: '45 min',
            isNew: movie.corner?.name === 'Terbaru',
            isPopular: movie.rankVo?.rankType === 3,
            corner: movie.corner,
            rankVo: movie.rankVo,
            channelId: channelId
        }));

    } catch (error) {
        console.error(`Error fetching from channel ${channelId}:`, error);
        return [];
    }
}

// Fungsi untuk mendapatkan drama berdasarkan genre spesifik
export async function getDramasByGenre(genre) {
    try {
        console.log(`🎭 Searching dramas for genre: ${genre}`);
        
        // Keywords yang relevan untuk genre tertentu
        const genreKeywords = {
            'romance': ['romance', 'love', 'romantic', 'dating', 'marriage', 'wedding', 'couple'],
            'drama': ['drama', 'family', 'life', 'story', 'emotional', 'tears'],
            'comedy': ['comedy', 'funny', 'humor', 'laugh', 'comic', 'fun'],
            'action': ['action', 'fight', 'battle', 'war', 'combat', 'hero'],
            'thriller': ['thriller', 'suspense', 'mystery', 'crime', 'detective'],
            'fantasy': ['fantasy', 'magic', 'supernatural', 'fairy', 'myth'],
            'historical': ['historical', 'period', 'ancient', 'dynasty', 'emperor'],
            'modern': ['modern', 'contemporary', 'current', 'today', 'now']
        };
        
        const keywords = genreKeywords[genre.toLowerCase()] || [genre];
        const genreDramas = new Map();
        
        for (const keyword of keywords) {
            try {
                const results = await searchMovies(keyword);
                results.forEach(drama => {
                    // Filter berdasarkan genre yang sesuai
                    if (drama.genre.toLowerCase().includes(genre.toLowerCase())) {
                        genreDramas.set(drama.bookId, drama);
                    }
                });
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error searching for ${keyword}:`, error);
            }
        }
        
        const result = Array.from(genreDramas.values());
        console.log(`✅ Found ${result.length} dramas for genre ${genre}`);
        return result;
        
    } catch (error) {
        console.error(`Error getting dramas for genre ${genre}:`, error);
        return [];
    }
}