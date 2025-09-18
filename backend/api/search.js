import axios from 'axios';
import { token } from './get-token.js';

export async function searchMovies(keyword) {
    try {
        const gettoken = await token();
        const url = "https://sapi.dramaboxdb.com/drama-box/search/suggest";

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
            keyword: keyword
        };

        const response = await axios.post(url, data, { headers });
        const movies = response.data.data.suggestList;

        // Format data sesuai dengan struktur asli API
        return movies.map(movie => ({
            bookId: movie.bookId,
            title: movie.bookName,
            chapterCount: 50, // Default karena search API tidak return chapterCount
            poster: movie.cover,
            description: movie.introduction,
            rating: movie.score || 0,
            genre: movie.tagNames ? movie.tagNames.join(', ') : 'Drama',
            playCount: '0',
            year: new Date().getFullYear(),
            quality: 'HD',
            duration: '45 min',
            isNew: false,
            isPopular: false,
            protagonist: movie.protagonist
        }));

    } catch (error) {
        console.error('Error searching movies:', error);
        throw new Error('Gagal mencari film');
    }
}