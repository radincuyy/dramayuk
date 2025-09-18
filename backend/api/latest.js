import axios from 'axios';
import { token } from './get-token.js';

export async function getLatestMovies(pageNo = 1) {
    return getLatestMoviesFromChannel(43, pageNo);
}

export async function getLatestMoviesFromChannel(channelId = 43, pageNo = 1) {
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
            index: pageNo, // Ubah index sesuai pageNo
            channelId: channelId
        };

        const response = await axios.post(url, data, { headers });
        const movies = response.data.data.newTheaterList?.records || [];

        // Format data sesuai dengan struktur asli API
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
            channelId: channelId,
            pageSource: pageNo // Track which page this came from
        }));

    } catch (error) {
        console.error(`Error fetching movies from channel ${channelId}, page ${pageNo}:`, error);
        return []; // Return empty array instead of throwing
    }
}

// Fungsi baru untuk mendapatkan lebih banyak drama dengan strategi berbeda
export async function getAllMoviesWithVariation(requestedPage = 1) {
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

        const allMovies = [];
        
        // Strategi: Ambil dari banyak variasi untuk mendapatkan lebih banyak drama
        const variations = [
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage, index: 1, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage, index: 2, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 1, index: 1, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 1, index: 2, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 2, index: 1, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 2, index: 2, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 3, index: 1, channelId: 43 },
            { newChannelStyle: 1, isNeedRank: 1, pageNo: requestedPage + 3, index: 2, channelId: 43 }
        ];

        for (const variation of variations) {
            try {
                const response = await axios.post(url, variation, { headers });
                const movies = response.data.data.newTheaterList?.records || [];
                
                if (movies.length > 0) {
                    const formattedMovies = movies.map(movie => ({
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
                        source: `p${variation.pageNo}_i${variation.index}_c${variation.channelId}`
                    }));
                    
                    allMovies.push(...formattedMovies);
                }
            } catch (error) {
                console.error(`Error with variation ${JSON.stringify(variation)}:`, error);
            }
        }

        // Remove duplicates berdasarkan bookId
        const uniqueMovies = allMovies.filter((movie, index, self) => 
            index === self.findIndex(m => m.bookId === movie.bookId)
        );

        console.log(`getAllMoviesWithVariation: ${allMovies.length} total, ${uniqueMovies.length} unique`);
        return uniqueMovies;

    } catch (error) {
        console.error('Error in getAllMoviesWithVariation:', error);
        return [];
    }
}