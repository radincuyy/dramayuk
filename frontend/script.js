// Modern Streaming Platform - Auto Play Focus
class StreamingApp {
    constructor() {
        this.API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api' 
            : '/api';
        this.currentMovie = null;
        this.favorites = new FavoritesManager();
        this.player = new VideoPlayer();
        this.ui = new UIManager();
        
        // All movies management
        this.allMovies = [];
        this.currentPage = 1;
        this.hasMoreMovies = true;
        this.isLoadingMore = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupSearch();
        await this.loadInitialContent();
        this.ui.hideLoading();
    }

    setupEventListeners() {
        // Desktop Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.navigateToPage(page);
            });
        });

        // Mobile Navigation
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.navigateToPage(page);
                this.closeMobileMenu(); // Close mobile menu after navigation
            });
        });

        // Mobile Menu Toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const mobileNav = document.getElementById('mobile-nav');
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            
            if (mobileNav && mobileNav.classList.contains('active') && 
                !mobileNav.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Hero play button
        document.getElementById('hero-play')?.addEventListener('click', () => {
            this.playFeaturedMovie();
        });

        // Hero explore button
        document.getElementById('hero-explore')?.addEventListener('click', () => {
            this.scrollToMovies();
        });

        // Modal close
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Search clear button
        document.getElementById('search-clear')?.addEventListener('click', () => {
            this.clearSearch();
        });

        // Share button
        document.getElementById('modal-share')?.addEventListener('click', () => {
            this.shareMovie();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Filter buttons removed - no longer needed

        // All movies page controls
        document.getElementById('load-more-btn')?.addEventListener('click', () => {
            this.loadMoreAllMovies();
        });

        // Scroll effects
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Resize handler for responsive adjustments
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Touch events for mobile carousel
        this.setupTouchEvents();

        // Scroll to top button
        document.getElementById('scroll-top')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('href').substring(1);
                
                // Update active nav
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                this.showPage(targetPage);
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('global-search');
        const mobileSearchInput = document.getElementById('mobile-search');
        const searchClear = document.getElementById('search-clear');
        
        // Setup desktop search
        if (searchInput) {
            searchInput.addEventListener('input', debounce(async (e) => {
                const query = e.target.value.trim();
                
                // Sync with mobile search
                if (mobileSearchInput) {
                    mobileSearchInput.value = query;
                }
                
                // Show/hide clear button
                if (query) {
                    searchClear.style.display = 'block';
                    // Izinkan search mulai dari 1 huruf
                    if (query.length >= 1) {
                        await this.performSearch(query);
                    }
                } else {
                    searchClear.style.display = 'none';
                    this.navigateToPage('home');
                }
            }, 300));
        }
        
        // Setup mobile search
        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', debounce(async (e) => {
                const query = e.target.value.trim();
                
                // Sync with desktop search
                if (searchInput) {
                    searchInput.value = query;
                }
                
                // Show/hide clear button
                if (query) {
                    searchClear.style.display = 'block';
                    // Izinkan search mulai dari 1 huruf
                    if (query.length >= 1) {
                        await this.performSearch(query);
                        // Close mobile menu after search
                        this.closeMobileMenu();
                    }
                } else {
                    searchClear.style.display = 'none';
                    this.navigateToPage('home');
                }
            }, 300));
        }
        
        // Setup clear button
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    async loadInitialContent() {
        this.ui.showLoading();
        
        try {
            // Load featured movies
            await this.loadFeaturedMovies();
            
            // Load genre sections
            await this.loadGenreSections();

            // Load favorites
            this.loadFavoriteMovies();
            
        } catch (error) {
            console.error('Error loading initial content:', error);
            this.ui.showToast('Gagal memuat konten. Periksa koneksi internet Anda.', 'error');
            this.displaySampleMovies();
        } finally {
            this.ui.hideLoading();
        }
    }

    async loadFeaturedMovies() {
        try {
            console.log('Loading featured movies...');
            
            // Test server health first
            const healthResponse = await fetch(`${this.API_BASE}/health`);
            if (!healthResponse.ok) {
                throw new Error('Server tidak dapat diakses');
            }
            
            const response = await fetch(`${this.API_BASE}/latest`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const movies = data.movies || data; // Handle both formats
            console.log('Featured movies loaded:', movies.length);
            
            if (movies && movies.length > 0) {
                this.displayFeaturedMovies(movies);
                this.setHeroBackground(movies[0]);
            } else {
                throw new Error('No movies returned from API');
            }
            
        } catch (error) {
            console.error('Error loading featured movies:', error);
            this.ui.showToast('Gagal memuat film dari server, menampilkan contoh', 'error');
            this.displaySampleMovies();
        }
    }

    async loadMoreMovies() {
        try {
            // Try to get page 2, fallback to page 1 with different movies
            const response = await fetch(`${this.API_BASE}/latest/2`);
            let movies;
            
            if (!response.ok) {
                // Fallback: get page 1 and slice differently
                const response2 = await fetch(`${this.API_BASE}/latest`);
                const allMovies = await response2.json();
                movies = allMovies.slice(5); // Skip first 5 movies
            } else {
                movies = await response.json();
            }

            this.displayMoreMovies(movies);

        } catch (error) {
            console.error('Error loading more movies:', error);
        }
    }

    displayFeaturedMovies(movies) {
        const track = document.getElementById('featured-track');
        if (!track) {
            console.error('Featured track element not found');
            return;
        }

        if (!movies || movies.length === 0) {
            console.error('No movies to display');
            track.innerHTML = '<div style="color: white; padding: 2rem;">Tidak ada film untuk ditampilkan</div>';
            return;
        }

        try {
            track.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
            this.setupCarouselControls('featured');
            console.log('Featured movies displayed successfully');
        } catch (error) {
            console.error('Error displaying featured movies:', error);
            track.innerHTML = '<div style="color: white; padding: 2rem;">Error menampilkan film</div>';
        }
    }

    async loadGenreSections() {
        try {
            console.log('🏷️ Loading genre sections with optimized strategy...');
            
            // Strategi Optimized: Gunakan Latest API + All Movies API untuk coverage yang efisien
            const allMovies = [];
            
            // 1. Ambil dari Latest API (data lengkap, terbatas jumlah)
            console.log('📺 Fetching from Latest API...');
            const latestResponse = await fetch(`${this.API_BASE}/latest`);
            if (latestResponse.ok) {
                const latestMovies = await latestResponse.json();
                allMovies.push(...latestMovies);
                console.log(`✅ Latest API: ${latestMovies.length} movies`);
            }
            
            // 2. Ambil dari All Movies API (variasi theater)
            console.log('🎬 Fetching from All Movies API...');
            const allMoviesResponse = await fetch(`${this.API_BASE}/all-movies?page=1`);
            if (allMoviesResponse.ok) {
                const allMoviesData = await allMoviesResponse.json();
                const additionalMovies = allMoviesData.movies || allMoviesData;
                allMovies.push(...additionalMovies);
                console.log(`✅ All Movies API: ${additionalMovies.length} movies`);
            }
            
            // 3. Skip automatic search supplementation to avoid spam logs
            console.log('✅ Using existing movie data for genre sections');
            
            // Remove duplicates berdasarkan bookId
            const uniqueMovies = allMovies.filter((movie, index, self) => 
                index === self.findIndex(m => m.bookId === movie.bookId)
            );
            
            console.log(`📊 Total unique movies: ${uniqueMovies.length}`);
            
            // Kelompokkan berdasarkan genre
            const genreGroups = this.groupMoviesByGenre(uniqueMovies);
            
            console.log(`🏷️ Created ${genreGroups.length} genre groups:`, 
                genreGroups.map(g => `${g.genre} (${g.movies.length})`));
            
            // Tampilkan genre sections
            this.displayGenreSections(genreGroups);
            
        } catch (error) {
            console.error('Error loading genre sections:', error);
            this.displaySampleGenres();
        }
    }

    groupMoviesByGenre(movies) {
        const genreMap = new Map();
        
        // Daftar genre prioritas untuk ditampilkan lebih dulu
        const priorityGenres = ['Romance', 'Drama', 'Comedy', 'Action', 'Thriller', 'Fantasy', 'Historical', 'Modern'];
        
        movies.forEach(movie => {
            if (movie.genre) {
                // Split genre dan bersihkan
                const genres = movie.genre.split(',').map(g => g.trim()).filter(g => g.length > 0);
                
                genres.forEach(genre => {
                    // Normalisasi nama genre
                    const normalizedGenre = this.normalizeGenreName(genre);
                    
                    if (!genreMap.has(normalizedGenre)) {
                        genreMap.set(normalizedGenre, []);
                    }
                    
                    // Tambahkan movie ke genre jika belum ada
                    const genreMovies = genreMap.get(normalizedGenre);
                    if (!genreMovies.find(m => m.bookId === movie.bookId)) {
                        genreMap.get(normalizedGenre).push(movie);
                    }
                });
            }
        });
        
        // Convert ke array dan sort berdasarkan prioritas dan jumlah film
        const genreArray = Array.from(genreMap.entries())
            .map(([genre, movies]) => ({ genre, movies }))
            .filter(group => group.movies.length >= 1) // Minimal 1 film per genre
            .sort((a, b) => {
                // Prioritas genre tertentu
                const aPriority = priorityGenres.indexOf(a.genre);
                const bPriority = priorityGenres.indexOf(b.genre);
                
                if (aPriority !== -1 && bPriority !== -1) {
                    return aPriority - bPriority;
                } else if (aPriority !== -1) {
                    return -1;
                } else if (bPriority !== -1) {
                    return 1;
                } else {
                    return b.movies.length - a.movies.length;
                }
            });
        
        return genreArray.slice(0, 8); // Ambil 8 genre teratas
    }

    normalizeGenreName(genre) {
        // Normalisasi nama genre untuk konsistensi
        const genreMap = {
            'romance': 'Romance',
            'romantic': 'Romance',
            'love': 'Romance',
            'drama': 'Drama',
            'comedy': 'Comedy',
            'funny': 'Comedy',
            'humor': 'Comedy',
            'action': 'Action',
            'thriller': 'Thriller',
            'suspense': 'Thriller',
            'fantasy': 'Fantasy',
            'magic': 'Fantasy',
            'historical': 'Historical',
            'history': 'Historical',
            'period': 'Historical',
            'modern': 'Modern',
            'contemporary': 'Modern',
            'family': 'Family',
            'school': 'School',
            'office': 'Office',
            'business': 'Business',
            'medical': 'Medical',
            'crime': 'Crime',
            'mystery': 'Mystery'
        };
        
        const normalized = genre.toLowerCase().trim();
        return genreMap[normalized] || genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
    }

    displayGenreSections(genreGroups) {
        const container = document.getElementById('genre-sections');
        if (!container) return;

        if (genreGroups.length === 0) {
            container.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-tags"></i> Genre</h2>
                    <p>Jelajahi drama berdasarkan genre favorit Anda</p>
                </div>
                <div style="color: var(--text-secondary); text-align: center; padding: 2rem;">
                    <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Sedang memuat genre...</p>
                </div>
            `;
            return;
        }

        // Header untuk section genre
        const genreHeader = `
            <div class="section-header">
                <h2><i class="fas fa-tags"></i> Jelajahi berdasarkan Genre</h2>
                <p>Temukan drama favorit Anda dari berbagai genre pilihan</p>
            </div>
        `;

        // Generate genre sections
        const genreSections = genreGroups.map((group, index) => {
            const genreIcon = this.getGenreIcon(group.genre);
            return `
                <div class="genre-section" data-genre="${group.genre}">
                    <div class="genre-header">
                        <div class="genre-title">
                            <i class="${genreIcon}"></i>
                            <h3>${group.genre}</h3>
                            <span class="genre-count">${group.movies.length} drama</span>
                        </div>
                        <button class="genre-view-all" data-genre="${group.genre}">
                            <span>Lihat Semua</span>
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                    <div class="movie-carousel" id="genre-${index}-carousel">
                        <div class="carousel-container">
                            <button class="carousel-btn prev" id="genre-${index}-prev">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <div class="carousel-track" id="genre-${index}-track">
                                ${group.movies.slice(0, 12).map(movie => this.createMovieCard(movie)).join('')}
                            </div>
                            <button class="carousel-btn next" id="genre-${index}-next">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = genreHeader + genreSections;

        // Setup carousel controls untuk setiap genre
        genreGroups.forEach((group, index) => {
            this.setupCarouselControls(`genre-${index}`);
        });

        // Setup event listeners untuk tombol "Lihat Semua"
        container.querySelectorAll('.genre-view-all').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genre = e.currentTarget.dataset.genre;
                this.showGenreMovies(genre, genreGroups);
            });
        });
    }

    getGenreIcon(genre) {
        const iconMap = {
            'Romance': 'fas fa-heart',
            'Drama': 'fas fa-theater-masks',
            'Comedy': 'fas fa-laugh',
            'Action': 'fas fa-fist-raised',
            'Thriller': 'fas fa-bolt',
            'Fantasy': 'fas fa-magic',
            'Historical': 'fas fa-crown',
            'Modern': 'fas fa-city',
            'Family': 'fas fa-home',
            'School': 'fas fa-graduation-cap',
            'Office': 'fas fa-briefcase',
            'Business': 'fas fa-chart-line',
            'Medical': 'fas fa-user-md',
            'Crime': 'fas fa-mask',
            'Mystery': 'fas fa-search'
        };
        
        return iconMap[genre] || 'fas fa-film';
    }

    showGenreMovies(genre, genreGroups) {
        const genreData = genreGroups.find(g => g.genre === genre);
        if (!genreData) return;

        // Simulate search results untuk genre
        this.currentSearchQuery = `Genre: ${genre}`;
        this.currentSearchResults = genreData.movies;
        
        // Update search title
        document.getElementById('search-title').innerHTML = `<i class="fas fa-tags"></i> Genre: ${genre}`;
        document.getElementById('search-subtitle').textContent = `Menampilkan ${genreData.movies.length} drama dalam genre ${genre}`;
        
        // Display movies
        this.displaySearchResults(genreData.movies);
        
        // Show search results page
        this.showPage('search-results');
    }

    displaySampleGenres() {
        const sampleGenres = [
            {
                genre: 'Drama',
                movies: [
                    {
                        bookId: 'sample1',
                        title: 'Drama Contoh 1',
                        chapterCount: 50,
                        poster: 'https://via.placeholder.com/220x320/1a1a1a/ffffff?text=Drama+1',
                        description: 'Contoh drama genre Drama.',
                        rating: 4.5,
                        year: 2024,
                        quality: 'HD',
                        genre: 'Drama'
                    }
                ]
            },
            {
                genre: 'Romance',
                movies: [
                    {
                        bookId: 'sample2',
                        title: 'Romance Contoh 1',
                        chapterCount: 30,
                        poster: 'https://via.placeholder.com/220x320/1a1a1a/ffffff?text=Romance+1',
                        description: 'Contoh drama genre Romance.',
                        rating: 4.2,
                        year: 2024,
                        quality: 'HD',
                        genre: 'Romance'
                    }
                ]
            }
        ];
        
        this.displayGenreSections(sampleGenres);
    }

    createMovieCard(movie) {
        try {
            const isFavorite = this.favorites.isFavorite(movie.bookId);
            
            // Escape JSON untuk menghindari error
            const movieDataEscaped = JSON.stringify(movie).replace(/'/g, '&#39;');
            
            return `
                <div class="movie-card" data-movie-id="${movie.bookId}" data-movie='${movieDataEscaped}'>
                    <div class="movie-poster-container">
                        <img src="${movie.poster || 'https://via.placeholder.com/220x320/1a1a1a/ffffff?text=No+Image'}" 
                             alt="${movie.title || 'Film'}" class="movie-poster" 
                             onerror="this.src='https://via.placeholder.com/220x320/1a1a1a/ffffff?text=No+Image'">
                        <div class="play-overlay">
                            <div class="play-button">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                        ${movie.isNew ? '<div class="badge new-badge">BARU</div>' : ''}
                        ${movie.quality ? `<div class="badge quality-badge">${movie.quality}</div>` : ''}
                    </div>
                    <div class="movie-info">
                        <div class="movie-header">
                            <div class="movie-title">${movie.title || 'Judul Tidak Tersedia'}</div>
                            <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                                    data-movie-id="${movie.bookId}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                        <div class="movie-meta">
                            ${movie.rating > 0 ? `<span class="rating">★ ${movie.rating}</span>` : ''}
                            <span class="year">${movie.year || new Date().getFullYear()}</span>
                            ${movie.quality ? `<span class="quality">${movie.quality}</span>` : ''}
                            <span class="episodes">${movie.chapterCount || 1} Ep</span>
                        </div>
                        ${movie.genre ? `<div class="movie-genre">${movie.genre}</div>` : ''}
                        <div class="movie-description">${movie.description || 'Deskripsi tidak tersedia'}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating movie card:', error, movie);
            return `
                <div class="movie-card">
                    <div style="padding: 1rem; color: white;">
                        Error loading movie: ${movie.title || 'Unknown'}
                    </div>
                </div>
            `;
        }
    }

    setupCarouselControls(trackId) {
        const track = document.getElementById(`${trackId}-track`);
        const prevBtn = document.getElementById(`${trackId}-prev`);
        const nextBtn = document.getElementById(`${trackId}-next`);
        
        if (!track) return;

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                track.scrollBy({ left: -300, behavior: 'smooth' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                track.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }

        // Movie card click events - LANGSUNG PLAY VIDEO
        track.addEventListener('click', (e) => {
            const movieCard = e.target.closest('.movie-card');
            const favoriteBtn = e.target.closest('.favorite-btn');
            const playButton = e.target.closest('.play-button');

            if (favoriteBtn) {
                e.stopPropagation();
                this.toggleFavorite(favoriteBtn.dataset.movieId);
            } else if (playButton || movieCard) {
                e.stopPropagation();
                // LANGSUNG PLAY VIDEO EPISODE 1
                this.playMovieDirectly(movieCard.dataset.movieId);
            }
        });
    }

    // FUNGSI UTAMA: PLAY MOVIE LANGSUNG
    async playMovieDirectly(movieId) {
        try {
            this.ui.showLoading();
            
            const movie = await this.getMovieDetails(movieId);
            this.currentMovie = movie;
            
            this.populateModal(movie);
            
            // Show modal
            const modal = document.getElementById('video-modal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // LANGSUNG PLAY EPISODE 1 TANPA DELAY
            this.playEpisodeDirectly(1);
            
        } catch (error) {
            console.error('Error playing movie directly:', error);
            this.ui.showToast('Gagal memuat film', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async getMovieDetails(movieId) {
        const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
        if (movieCard) {
            const movieData = JSON.parse(movieCard.dataset.movie.replace(/&#39;/g, "'"));
            return movieData;
        }
        
        throw new Error('Movie not found');
    }

    populateModal(movie) {
        document.getElementById('modal-title').textContent = movie.title;
        document.getElementById('modal-description').textContent = movie.description;
        document.getElementById('modal-rating').textContent = `★ ${movie.rating || 0}`;
        document.getElementById('modal-year').textContent = movie.year || new Date().getFullYear();
        document.getElementById('modal-quality').textContent = movie.quality || 'HD';
        document.getElementById('modal-duration').textContent = movie.duration || '45 min';
        document.getElementById('modal-genre').textContent = movie.genre || 'Drama';
        document.getElementById('modal-poster').src = movie.poster;
        document.getElementById('episode-info').textContent = `Total: ${movie.chapterCount} Episode`;

        // Populate episode selector
        const episodeSelect = document.getElementById('episode-select');
        episodeSelect.innerHTML = '';
        for (let i = 1; i <= movie.chapterCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Episode ${i}`;
            episodeSelect.appendChild(option);
        }

        // Setup play button
        const playBtn = document.getElementById('play-episode-btn');
        playBtn.onclick = () => this.playEpisodeDirectly();

        // Setup episode selector - AUTO PLAY SAAT GANTI EPISODE
        episodeSelect.onchange = () => {
            const selectedEpisode = parseInt(episodeSelect.value);
            this.playEpisodeDirectly(selectedEpisode);
        };

        // Setup episode navigation buttons
        const prevBtn = document.getElementById('prev-episode-btn');
        const nextBtn = document.getElementById('next-episode-btn');
        
        if (prevBtn) prevBtn.onclick = () => this.playPreviousEpisode();
        if (nextBtn) nextBtn.onclick = () => this.playNextEpisode();

        // Setup favorite button
        const favoriteBtn = document.getElementById('modal-favorite');
        const isFavorite = this.favorites.isFavorite(movie.bookId);
        favoriteBtn.className = `action-btn favorite-btn ${isFavorite ? 'active' : ''}`;
        favoriteBtn.onclick = () => this.toggleFavorite(movie.bookId);

        // Update navigation buttons state
        this.updateEpisodeNavigation(1, movie.chapterCount);
    }

    // FUNGSI UTAMA: PLAY EPISODE LANGSUNG DENGAN AUTO-PLAY
    async playEpisodeDirectly(episodeNumber = null) {
        if (!this.currentMovie) return;

        const episodeIndex = episodeNumber || document.getElementById('episode-select').value;
        const playBtn = document.getElementById('play-episode-btn');
        const videoLoading = document.getElementById('video-loading');
        
        try {
            // Update episode selector if episode number provided
            if (episodeNumber) {
                document.getElementById('episode-select').value = episodeNumber;
            }

            // Show loading state
            playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Memuat...</span>';
            playBtn.disabled = true;
            videoLoading.style.display = 'flex';

            // Update loading text
            const loadingText = videoLoading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = `Memuat Episode ${episodeIndex}...`;
            }

            const response = await fetch(`${this.API_BASE}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: this.currentMovie.bookId,
                    index: parseInt(episodeIndex)
                })
            });

            if (!response.ok) throw new Error('Failed to get stream');

            const streamData = await response.json();
            
            if (streamData.url) {
                // LANGSUNG LOAD DAN AUTO-PLAY VIDEO
                await this.player.loadAndAutoPlay(streamData.url);
                
                // Update current episode display
                this.updateCurrentEpisodeDisplay(episodeIndex);
                
                // Show success message
                this.ui.showToast(`Episode ${episodeIndex} sedang diputar`, 'success');
            } else {
                throw new Error('No stream URL');
            }

        } catch (error) {
            console.error('Error playing episode:', error);
            this.ui.showToast('Gagal memuat video. Coba lagi nanti.', 'error');
        } finally {
            playBtn.innerHTML = '<i class="fas fa-play"></i> <span>Putar Episode</span>';
            playBtn.disabled = false;
            videoLoading.style.display = 'none';
        }
    }

    updateCurrentEpisodeDisplay(episodeNumber) {
        const currentEpisodeElement = document.getElementById('current-episode');
        if (currentEpisodeElement) {
            currentEpisodeElement.style.display = 'block';
            currentEpisodeElement.innerHTML = `
                <i class="fas fa-play-circle"></i> Sedang Memutar: Episode ${episodeNumber}
            `;
        }

        // Update navigation buttons
        if (this.currentMovie) {
            this.updateEpisodeNavigation(episodeNumber, this.currentMovie.chapterCount);
        }
    }

    updateEpisodeNavigation(currentEpisode, totalEpisodes) {
        const prevBtn = document.getElementById('prev-episode-btn');
        const nextBtn = document.getElementById('next-episode-btn');

        if (prevBtn) {
            prevBtn.disabled = currentEpisode <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentEpisode >= totalEpisodes;
        }
    }

    playPreviousEpisode() {
        const episodeSelect = document.getElementById('episode-select');
        const currentEpisode = parseInt(episodeSelect.value);
        
        if (currentEpisode > 1) {
            this.playEpisodeDirectly(currentEpisode - 1);
        }
    }

    playNextEpisode() {
        const episodeSelect = document.getElementById('episode-select');
        const currentEpisode = parseInt(episodeSelect.value);
        
        if (this.currentMovie && currentEpisode < this.currentMovie.chapterCount) {
            this.playEpisodeDirectly(currentEpisode + 1);
        }
    }

    closeModal() {
        const modal = document.getElementById('video-modal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.player.pause();
        this.currentMovie = null;
    }

    toggleFavorite(movieId) {
        const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
        if (!movieCard) return;

        const movie = JSON.parse(movieCard.dataset.movie.replace(/&#39;/g, "'"));

        if (this.favorites.isFavorite(movieId)) {
            this.favorites.remove(movieId);
            this.ui.showToast('Dihapus dari favorit', 'success');
        } else {
            this.favorites.add(movie);
            this.ui.showToast('Ditambahkan ke favorit', 'success');
        }

        // Update UI
        this.updateFavoriteButtons(movieId);
        
        // Refresh favorites page if currently active
        if (document.querySelector('.page.active').id === 'favorites') {
            this.loadFavoriteMovies();
        }
    }

    updateFavoriteButtons(movieId) {
        const buttons = document.querySelectorAll(`[data-movie-id="${movieId}"] .favorite-btn`);
        const modalBtn = document.getElementById('modal-favorite');
        const isFavorite = this.favorites.isFavorite(movieId);
        
        buttons.forEach(btn => {
            btn.classList.toggle('active', isFavorite);
        });
        
        if (modalBtn) {
            modalBtn.classList.toggle('active', isFavorite);
        }
    }

    loadFavoriteMovies() {
        const container = document.getElementById('favorites-movies');
        const statsContainer = document.getElementById('favorites-stats');
        
        if (!container) return;

        const favoriteMovies = this.favorites.getAll();
        
        // Update stats
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <h3>${favoriteMovies.length}</h3>
                    <p>Total Favorit</p>
                </div>
                <div class="stat-item">
                    <h3>${Math.floor(Math.random() * 20) + 5}</h3>
                    <p>Terakhir Ditonton</p>
                </div>
                <div class="stat-item">
                    <h3>${Math.floor(Math.random() * 50) + 10}</h3>
                    <p>Jam Menonton</p>
                </div>
            `;
        }
        
        if (favoriteMovies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>Belum ada film favorit</h3>
                    <p>Tambahkan film ke favorit dengan menekan tombol ❤️ pada film yang Anda suka</p>
                </div>
            `;
        } else {
            container.innerHTML = favoriteMovies.map(movie => this.createMovieCard(movie)).join('');
            this.setupMovieCardEvents(container);
        }
    }

    setupMovieCardEvents(container) {
        container.addEventListener('click', (e) => {
            const movieCard = e.target.closest('.movie-card');
            const favoriteBtn = e.target.closest('.favorite-btn');
            const playButton = e.target.closest('.play-button');

            if (favoriteBtn) {
                e.stopPropagation();
                this.toggleFavorite(favoriteBtn.dataset.movieId);
            } else if (playButton || movieCard) {
                e.stopPropagation();
                // LANGSUNG PLAY VIDEO
                this.playMovieDirectly(movieCard.dataset.movieId);
            }
        });
    }

    async performSearch(query) {
        try {
            this.ui.showLoading();
            
            // Gunakan enhanced search untuk hasil yang lebih banyak
            const response = await fetch(`${this.API_BASE}/search-enhanced`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    keyword: query,
                    page: 1,
                    limit: 100 // Ambil lebih banyak hasil
                })
            });

            if (!response.ok) {
                // Fallback ke search biasa jika enhanced search gagal
                console.warn('Enhanced search failed, falling back to regular search');
                const fallbackResponse = await fetch(`${this.API_BASE}/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keyword: query, enhanced: true })
                });
                
                if (!fallbackResponse.ok) throw new Error('Search failed');
                
                const results = await fallbackResponse.json();
                this.searchResults = results;
                this.displaySearchResults(results, query);
            } else {
                const data = await response.json();
                this.searchResults = data.results || data;
                this.searchPagination = {
                    currentPage: data.currentPage || 1,
                    totalPages: data.totalPages || 1,
                    totalResults: data.totalResults || this.searchResults.length,
                    hasMore: data.hasMore || false
                };
                this.displaySearchResults(this.searchResults, query);
            }
            
            this.navigateToPage('search-results');

        } catch (error) {
            console.error('Search error:', error);
            this.ui.showToast('Gagal melakukan pencarian', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    displaySearchResults(results, query) {
        const totalResults = this.searchPagination?.totalResults || results.length;
        const currentPage = this.searchPagination?.currentPage || 1;
        const totalPages = this.searchPagination?.totalPages || 1;
        
        document.getElementById('search-title').innerHTML = `<i class="fas fa-search"></i> Hasil Pencarian: "${query}"`;
        
        // Update subtitle dengan informasi pagination
        let subtitle = `Ditemukan ${totalResults} drama`;
        if (totalPages > 1) {
            subtitle += ` (Halaman ${currentPage} dari ${totalPages})`;
        }
        document.getElementById('search-subtitle').textContent = subtitle;
        
        const container = document.getElementById('search-movies');
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Tidak ada hasil ditemukan</h3>
                    <p>Coba kata kunci yang berbeda atau periksa ejaan Anda</p>
                    <div class="search-tips">
                        <h4>💡 Tips Pencarian:</h4>
                        <ul>
                            <li>Gunakan 1-2 huruf untuk pencarian luas (contoh: "a", "love")</li>
                            <li>Coba kata kunci genre (romance, drama, comedy)</li>
                            <li>Gunakan nama karakter atau tema (ceo, boss, contract)</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = results.map(movie => this.createMovieCard(movie)).join('');
            this.setupMovieCardEvents(container);
            
            // Tambahkan info sumber hasil jika ada
            if (results.some(r => r.source)) {
                this.addSearchSourceInfo(container, results);
            }
        }

        // Filter buttons removed - no longer needed
    }

    addSearchSourceInfo(container, results) {
        const sources = {};
        results.forEach(result => {
            if (result.source) {
                const sourceType = result.source.split('-')[0];
                sources[sourceType] = (sources[sourceType] || 0) + 1;
            }
        });
        
        if (Object.keys(sources).length > 1) {
            const sourceInfo = document.createElement('div');
            sourceInfo.className = 'search-source-info';
            sourceInfo.innerHTML = `
                <div class="source-info-header">
                    <i class="fas fa-info-circle"></i>
                    <span>Sumber Hasil Pencarian:</span>
                </div>
                <div class="source-breakdown">
                    ${Object.entries(sources).map(([source, count]) => `
                        <span class="source-tag">${this.getSourceLabel(source)}: ${count}</span>
                    `).join('')}
                </div>
            `;
            
            container.insertBefore(sourceInfo, container.firstChild);
        }
    }

    getSourceLabel(source) {
        const labels = {
            'direct': 'Pencarian Langsung',
            'variation': 'Variasi Kata',
            'latest': 'Database Terbaru',
            'substring': 'Pencarian Sebagian'
        };
        return labels[source] || source;
    }

    // filterSearchResults function removed - no longer needed

    clearSearch() {
        const searchInput = document.getElementById('global-search');
        const mobileSearchInput = document.getElementById('mobile-search');
        const searchClear = document.getElementById('search-clear');
        
        // Clear both search inputs
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        if (searchClear) searchClear.style.display = 'none';
        
        this.navigateToPage('home');
    }

    // Mobile Navigation Functions
    toggleMobileMenu() {
        const mobileNav = document.getElementById('mobile-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mobileNav && mobileMenuToggle) {
            const isActive = mobileNav.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileNav = document.getElementById('mobile-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mobileNav && mobileMenuToggle) {
            mobileNav.classList.add('active');
            mobileMenuToggle.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    closeMobileMenu() {
        const mobileNav = document.getElementById('mobile-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (mobileNav && mobileMenuToggle) {
            mobileNav.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
        }
    }

    // Responsive behavior handlers
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }
        
        // Adjust carousel on resize
        this.adjustCarousels();
    }

    adjustCarousels() {
        // Recalculate carousel positions on resize
        document.querySelectorAll('.carousel-track').forEach(track => {
            track.scrollLeft = 0; // Reset scroll position
        });
    }

    setupTouchEvents() {
        // Add touch support for carousels
        document.querySelectorAll('.carousel-track').forEach(track => {
            let isDown = false;
            let startX;
            let scrollLeft;

            track.addEventListener('mousedown', (e) => {
                if (window.innerWidth > 768) return; // Only on mobile
                isDown = true;
                track.classList.add('active');
                startX = e.pageX - track.offsetLeft;
                scrollLeft = track.scrollLeft;
            });

            track.addEventListener('mouseleave', () => {
                isDown = false;
                track.classList.remove('active');
            });

            track.addEventListener('mouseup', () => {
                isDown = false;
                track.classList.remove('active');
            });

            track.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - track.offsetLeft;
                const walk = (x - startX) * 2;
                track.scrollLeft = scrollLeft - walk;
            });

            // Touch events
            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX - track.offsetLeft;
                scrollLeft = track.scrollLeft;
            });

            track.addEventListener('touchmove', (e) => {
                if (!startX) return;
                const x = e.touches[0].pageX - track.offsetLeft;
                const walk = (x - startX) * 2;
                track.scrollLeft = scrollLeft - walk;
            });
        });
    }

    // Enhanced error handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const errorMessage = this.getErrorMessage(error);
        this.ui.showToast(errorMessage, 'error');
        
        // Hide loading states
        this.ui.hideLoading();
    }

    getErrorMessage(error) {
        if (error.message.includes('fetch')) {
            return 'Koneksi internet bermasalah. Silakan coba lagi.';
        } else if (error.message.includes('timeout')) {
            return 'Permintaan timeout. Silakan coba lagi.';
        } else {
            return 'Terjadi kesalahan. Silakan coba lagi.';
        }
    }

    shareMovie() {
        if (!this.currentMovie) return;
        
        if (navigator.share) {
            navigator.share({
                title: this.currentMovie.title,
                text: this.currentMovie.description,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const url = `${window.location.origin}?movie=${this.currentMovie.bookId}`;
            navigator.clipboard.writeText(url).then(() => {
                this.ui.showToast('Link berhasil disalin!', 'success');
            });
        }
    }

    playFeaturedMovie() {
        // Get first movie from featured carousel
        const firstMovie = document.querySelector('.movie-card');
        if (firstMovie) {
            this.playMovieDirectly(firstMovie.dataset.movieId);
        } else {
            this.scrollToMovies();
        }
    }

    scrollToMovies() {
        const moviesSection = document.querySelector('.section-header');
        if (moviesSection) {
            moviesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    navigateToPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Load page-specific content
        if (pageId === 'favorites') {
            this.loadFavoriteMovies();
        } else if (pageId === 'all-movies') {
            this.loadAllMoviesPage();
        }

        // Update navigation (both desktop and mobile)
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Update desktop navigation
        const activeDesktopLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
        if (activeDesktopLink) {
            activeDesktopLink.classList.add('active');
        }
        
        // Update mobile navigation
        const activeMobileLink = document.querySelector(`.mobile-nav-link[href="#${pageId}"]`);
        if (activeMobileLink) {
            activeMobileLink.classList.add('active');
        }
    }

    showPage(pageId) {
        this.navigateToPage(pageId);
    }

    handleKeyboardShortcuts(e) {
        // ESC to close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('video-modal');
            if (modal && modal.classList.contains('active')) {
                this.closeModal();
            }
        }

        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('global-search').focus();
        }

        // Arrow keys for episode navigation (only when modal is open)
        const modal = document.getElementById('video-modal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.playPreviousEpisode();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.playNextEpisode();
            }
        }

        // Number keys for navigation
        if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.metaKey) {
            const pages = ['home', 'all-movies', 'favorites'];
            const pageIndex = parseInt(e.key) - 1;
            if (pages[pageIndex]) {
                this.navigateToPage(pages[pageIndex]);
            }
        }
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        const scrollTop = document.getElementById('scroll-top');
        
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
            scrollTop.style.display = 'flex';
        } else {
            navbar.classList.remove('scrolled');
            scrollTop.style.display = 'none';
        }
    }

    setHeroBackground(movie) {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && movie.poster) {
            heroSection.style.backgroundImage = `
                linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), 
                url('${movie.poster}')
            `;
        }
    }

    // ALL MOVIES PAGE METHODS
    async loadAllMoviesPage() {
        if (this.allMovies.length === 0) {
            await this.loadInitialAllMovies();
        } else {
            this.displayAllMovies();
        }
    }

    async loadInitialAllMovies() {
        try {
            this.ui.showLoading();
            this.currentPage = 1;
            this.allMovies = [];
            
            // Langsung gunakan all-movies dengan pagination agresif
            const response = await fetch(`${this.API_BASE}/all-movies?page=1`);
            
            if (!response.ok) throw new Error('Failed to fetch all movies');
            
            const data = await response.json();
            this.allMovies = data.movies || [];
            this.hasMoreMovies = data.hasMore;
            this.currentPage = 1;
            
            console.log(`Loaded ${this.allMovies.length} movies from pages ${data.startPage}-${data.startPage + data.pagesChecked - 1}`);
            
            this.displayAllMovies();
            this.updateMoviesCount();
            
            if (this.allMovies.length > 0) {
                this.ui.showToast(`${this.allMovies.length} drama berhasil dimuat`, 'success');
            }
            
        } catch (error) {
            console.error('Error loading all movies:', error);
            this.ui.showToast('Gagal memuat semua drama', 'error');
            // Load sample movies as fallback
            this.loadSampleAllMovies();
        } finally {
            this.ui.hideLoading();
        }
    }

    async loadMoreMovies() {
        if (this.isLoadingMore || !this.hasMoreMovies) return;
        
        try {
            this.isLoadingMore = true;
            const loadMoreBtn = document.getElementById('load-more-btn');
            const loadingMore = document.getElementById('loading-more');
            
            loadMoreBtn.style.display = 'none';
            loadingMore.style.display = 'flex';
            
            this.currentPage++;
            
            // Gunakan all-movies dengan pagination agresif
            const response = await fetch(`${this.API_BASE}/all-movies?page=${this.currentPage}`);
            
            if (!response.ok) throw new Error('Failed to fetch more movies');
            
            const data = await response.json();
            const newMovies = data.movies || [];
            
            // Filter out duplicates
            const uniqueNewMovies = newMovies.filter(newMovie => 
                !this.allMovies.some(existingMovie => existingMovie.bookId === newMovie.bookId)
            );
            
            if (uniqueNewMovies.length > 0) {
                this.allMovies = [...this.allMovies, ...uniqueNewMovies];
                this.hasMoreMovies = data.hasMore && uniqueNewMovies.length >= 5; // Continue if got decent amount
                this.displayAllMovies();
                this.updateMoviesCount();
                
                this.ui.showToast(`${uniqueNewMovies.length} drama baru dimuat`, 'success');
            } else {
                // Jika tidak ada drama baru, coba lagi dengan strategi berbeda
                if (this.currentPage <= 10) { // Max 10 attempts
                    setTimeout(() => this.loadMoreMovies(), 1000);
                    return;
                } else {
                    this.hasMoreMovies = false;
                    this.ui.showToast('Semua drama telah dimuat', 'info');
                }
            }
            
        } catch (error) {
            console.error('Error loading more movies:', error);
            this.ui.showToast('Gagal memuat drama tambahan', 'error');
        } finally {
            this.isLoadingMore = false;
            const loadMoreBtn = document.getElementById('load-more-btn');
            const loadingMore = document.getElementById('loading-more');
            
            loadingMore.style.display = 'none';
            if (this.hasMoreMovies) {
                loadMoreBtn.style.display = 'inline-flex';
            } else {
                loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> <span>Semua Drama Telah Dimuat</span>';
                loadMoreBtn.disabled = true;
                loadMoreBtn.style.display = 'inline-flex';
            }
        }
    }

    displayAllMovies() {
        const container = document.getElementById('all-movies-grid');
        if (!container) return;

        if (this.allMovies.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>Tidak ada drama ditemukan</h3>
                    <p>Coba muat ulang halaman atau periksa koneksi internet</p>
                </div>
            `;
            return;
        }

        // Tampilkan semua drama tanpa sorting (urutan asli dari API)
        container.innerHTML = this.allMovies.map(movie => this.createMovieCard(movie)).join('');
        this.setupMovieCardEvents(container);
    }



    updateMoviesCount() {
        const countElement = document.getElementById('movies-count');
        if (countElement) {
            const total = this.allMovies.length;
            if (this.hasMoreMovies) {
                countElement.textContent = `${total} drama dimuat (masih ada lagi)`;
            } else {
                countElement.textContent = `${total} drama tersedia`;
            }
        }
    }

    loadSampleAllMovies() {
        const sampleMovies = [];
        const genres = ['Drama, Romance', 'Action, Thriller', 'Comedy, Family', 'Mystery, Crime', 'Fantasy, Adventure'];
        const qualities = ['HD', '4K', 'FHD'];
        
        // Generate 50 sample movies
        for (let i = 1; i <= 50; i++) {
            sampleMovies.push({
                bookId: `sample${i}`,
                title: `Drama Contoh ${i}`,
                chapterCount: Math.floor(Math.random() * 80) + 20,
                poster: `https://via.placeholder.com/220x320/1a1a1a/ffffff?text=Drama+${i}`,
                description: `Ini adalah contoh drama ke-${i} untuk testing website streaming dengan berbagai genre menarik.`,
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
                year: 2024,
                quality: qualities[Math.floor(Math.random() * qualities.length)],
                genre: genres[Math.floor(Math.random() * genres.length)],
                isNew: Math.random() > 0.7,
                isPopular: Math.random() > 0.8
            });
        }
        
        this.allMovies = sampleMovies;
        this.hasMoreMovies = false;
        this.displayAllMovies();
        this.updateMoviesCount();
        
        this.ui.showToast('Menampilkan data contoh (50 drama)', 'info');
    }

    displaySampleMovies() {
        const sampleMovies = [
            {
                bookId: 'sample1',
                title: 'Drama Contoh 1',
                chapterCount: 50,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRyYW1hIDE8L3RleHQ+PC9zdmc+',
                description: 'Ini adalah contoh drama untuk testing website streaming.',
                rating: 4.5,
                year: 2024,
                quality: 'HD',
                genre: 'Drama, Romance'
            },
            {
                bookId: 'sample2',
                title: 'Drama Contoh 2',
                chapterCount: 30,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRyYW1hIDI8L3RleHQ+PC9zdmc+',
                description: 'Drama contoh kedua untuk testing fitur streaming.',
                rating: 4.2,
                year: 2024,
                quality: 'HD',
                genre: 'Action, Thriller'
            }
        ];
        
        this.displayFeaturedMovies(sampleMovies);
        // displayMoreMovies removed - function doesn't exist
    }
}

// Favorites Manager
class FavoritesManager {
    constructor() {
        this.storageKey = 'dramayuk-favorites';
    }

    getAll() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    add(movie) {
        const favorites = this.getAll();
        if (!favorites.find(f => f.bookId === movie.bookId)) {
            favorites.push(movie);
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        }
    }

    remove(movieId) {
        const favorites = this.getAll().filter(f => f.bookId !== movieId);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
    }

    isFavorite(movieId) {
        return this.getAll().some(f => f.bookId === movieId);
    }
}

// Video Player dengan AUTO-PLAY
class VideoPlayer {
    constructor() {
        this.video = document.getElementById('video-player');
        this.setupControls();
    }

    setupControls() {
        if (!this.video) return;

        this.video.addEventListener('loadstart', () => {
            console.log('Video loading started');
        });

        this.video.addEventListener('canplay', () => {
            console.log('Video ready to play');
        });

        this.video.addEventListener('loadeddata', () => {
            console.log('Video data loaded');
        });

        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
        });

        // Auto-hide loading when video starts playing
        this.video.addEventListener('playing', () => {
            const videoLoading = document.getElementById('video-loading');
            if (videoLoading) {
                videoLoading.style.display = 'none';
            }
            console.log('Video is now playing');
        });
    }

    // FUNGSI UTAMA: LOAD DAN AUTO-PLAY VIDEO
    async loadAndAutoPlay(url) {
        return new Promise((resolve, reject) => {
            if (!this.video) {
                reject(new Error('Video element not found'));
                return;
            }

            console.log('Loading video:', url);
            this.video.src = url;
            this.video.load();

            // Function to attempt auto-play
            const attemptAutoPlay = () => {
                this.video.play()
                    .then(() => {
                        console.log('✅ Video auto-play berhasil!');
                        resolve();
                    })
                    .catch((error) => {
                        console.warn('⚠️ Auto-play gagal (browser policy):', error.message);
                        // Auto-play failed, but video is loaded and ready
                        resolve();
                    });
            };

            // Try to play when video can play
            const onCanPlay = () => {
                console.log('Video can play, attempting auto-play...');
                attemptAutoPlay();
            };

            // Listen for canplay event
            this.video.addEventListener('canplay', onCanPlay, { once: true });

            // Fallback: try to play after a short delay
            setTimeout(() => {
                if (this.video.readyState >= 2) { // HAVE_CURRENT_DATA
                    console.log('Fallback: attempting auto-play...');
                    attemptAutoPlay();
                }
            }, 1000);

            // Handle errors
            this.video.addEventListener('error', (e) => {
                console.error('Video loading error:', e);
                reject(new Error('Video loading failed'));
            }, { once: true });

            // Timeout fallback
            setTimeout(() => {
                if (this.video.readyState === 0) {
                    reject(new Error('Video loading timeout'));
                }
            }, 10000);
        });
    }

    play() {
        if (this.video) {
            return this.video.play();
        }
    }

    pause() {
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }
    }
}

// UI Manager
class UIManager {
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new StreamingApp();
});