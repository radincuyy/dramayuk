import { searchMovies } from './search.js';
import { getAllMoviesWithVariation } from './latest.js';

// Enhanced search yang menggabungkan multiple strategies
export async function enhancedSearch(keyword) {
    try {
        console.log(`🔍 Enhanced search for: "${keyword}"`);
        
        const allResults = new Map(); // Gunakan Map untuk avoid duplicates
        
        // 1. Direct search dengan keyword asli
        console.log('📍 Direct search...');
        try {
            const directResults = await searchMovies(keyword);
            directResults.forEach(movie => {
                allResults.set(movie.bookId, { ...movie, source: 'direct' });
            });
            console.log(`✅ Direct search: ${directResults.length} results`);
        } catch (error) {
            console.error('Direct search failed:', error);
        }
        
        // 2. Jika keyword pendek (1-2 huruf), coba variasi dengan kombinasi huruf populer
        if (keyword.length <= 2) {
            console.log('📍 Short keyword - trying variations...');
            const variations = generateKeywordVariations(keyword);
            
            for (const variation of variations.slice(0, 5)) { // Limit 5 variasi untuk performance
                try {
                    const varResults = await searchMovies(variation);
                    varResults.forEach(movie => {
                        if (!allResults.has(movie.bookId)) {
                            allResults.set(movie.bookId, { ...movie, source: `variation-${variation}` });
                        }
                    });
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Variation search failed for "${variation}":`, error);
                }
            }
        }
        
        // 3. Supplement dengan data dari Latest API yang match keyword

        try {
            const latestMovies = await getAllMoviesWithVariation(1);
            const matchingLatest = latestMovies.filter(movie => 
                movie.title.toLowerCase().includes(keyword.toLowerCase()) ||
                movie.genre.toLowerCase().includes(keyword.toLowerCase()) ||
                (movie.description && movie.description.toLowerCase().includes(keyword.toLowerCase()))
            );
            
            matchingLatest.forEach(movie => {
                if (!allResults.has(movie.bookId)) {
                    allResults.set(movie.bookId, { ...movie, source: 'latest-match' });
                }
            });

        } catch (error) {
            console.error('Latest API supplement failed:', error);
        }
        
        // 4. Jika masih sedikit hasil, coba search dengan substring
        const currentCount = allResults.size;
        if (currentCount < 20 && keyword.length >= 2) {

            const substrings = generateSubstrings(keyword);
            
            for (const substring of substrings.slice(0, 3)) {
                try {
                    const subResults = await searchMovies(substring);
                    subResults.forEach(movie => {
                        // Hanya tambahkan jika title/genre benar-benar relevan dengan keyword asli
                        if (!allResults.has(movie.bookId) && isRelevant(movie, keyword)) {
                            allResults.set(movie.bookId, { ...movie, source: `substring-${substring}` });
                        }
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Substring search failed for "${substring}":`, error);
                }
            }
        }
        
        const finalResults = Array.from(allResults.values());
        
        // Sort berdasarkan relevance
        const sortedResults = sortByRelevance(finalResults, keyword);
        
        console.log(`🎉 Enhanced search complete: ${sortedResults.length} total results`);
        
        return sortedResults;
        
    } catch (error) {
        console.error('Enhanced search failed:', error);
        // Fallback ke search biasa
        return await searchMovies(keyword);
    }
}

// Generate variasi keyword untuk search yang lebih luas
function generateKeywordVariations(keyword) {
    const variations = [];
    
    if (keyword.length === 1) {
        // Untuk 1 huruf, coba kombinasi dengan huruf populer
        const popularCombos = ['a', 'e', 'i', 'o', 'u', 'n', 't', 's', 'r', 'l'];
        popularCombos.forEach(combo => {
            if (combo !== keyword) {
                variations.push(keyword + combo);
                variations.push(combo + keyword);
            }
        });
        
        // Tambah juga kata-kata pendek yang mengandung huruf tersebut
        const shortWords = ['my', 'me', 'he', 'we', 'to', 'in', 'on', 'at', 'it', 'is'];
        shortWords.forEach(word => {
            if (word.includes(keyword.toLowerCase())) {
                variations.push(word);
            }
        });
    } else if (keyword.length === 2) {
        // Untuk 2 huruf, coba tambah huruf di depan/belakang
        const letters = ['a', 'e', 'i', 'o', 'u', 'n', 't', 's'];
        letters.forEach(letter => {
            variations.push(keyword + letter);
            variations.push(letter + keyword);
        });
    }
    
    return variations;
}

// Generate substring dari keyword
function generateSubstrings(keyword) {
    const substrings = [];
    
    if (keyword.length >= 3) {
        // Ambil substring dari kiri dan kanan
        for (let i = 1; i < keyword.length; i++) {
            substrings.push(keyword.substring(0, i)); // dari kiri
            substrings.push(keyword.substring(i)); // dari kanan
        }
    }
    
    return [...new Set(substrings)]; // Remove duplicates
}

// Check apakah movie relevan dengan keyword
function isRelevant(movie, keyword) {
    const keywordLower = keyword.toLowerCase();
    const title = movie.title.toLowerCase();
    const genre = movie.genre.toLowerCase();
    const description = (movie.description || '').toLowerCase();
    
    // Relevan jika keyword ada di title, genre, atau description
    return title.includes(keywordLower) || 
           genre.includes(keywordLower) || 
           description.includes(keywordLower);
}

// Sort hasil berdasarkan relevance dengan keyword
function sortByRelevance(results, keyword) {
    const keywordLower = keyword.toLowerCase();
    
    return results.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // Score berdasarkan posisi keyword di title
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        
        if (titleA.startsWith(keywordLower)) scoreA += 10;
        if (titleB.startsWith(keywordLower)) scoreB += 10;
        
        if (titleA.includes(keywordLower)) scoreA += 5;
        if (titleB.includes(keywordLower)) scoreB += 5;
        
        // Score berdasarkan genre match
        if (a.genre.toLowerCase().includes(keywordLower)) scoreA += 3;
        if (b.genre.toLowerCase().includes(keywordLower)) scoreB += 3;
        
        // Score berdasarkan rating
        scoreA += (a.rating || 0) * 0.1;
        scoreB += (b.rating || 0) * 0.1;
        
        return scoreB - scoreA; // Sort descending
    });
}

// Fungsi untuk search dengan pagination simulation
export async function paginatedSearch(keyword, page = 1, limit = 20) {
    try {
        const allResults = await enhancedSearch(keyword);
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = allResults.slice(startIndex, endIndex);
        
        return {
            results: paginatedResults,
            currentPage: page,
            totalResults: allResults.length,
            totalPages: Math.ceil(allResults.length / limit),
            hasMore: endIndex < allResults.length
        };
    } catch (error) {
        console.error('Paginated search failed:', error);
        throw error;
    }
}