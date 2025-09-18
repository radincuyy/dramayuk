// Simple Analytics for DramaYuk
class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Track page views
    trackPageView(page) {
        this.track('page_view', { page, timestamp: Date.now() });
    }

    // Track search queries
    trackSearch(keyword, resultCount) {
        this.track('search', { 
            keyword, 
            resultCount, 
            timestamp: Date.now() 
        });
    }

    // Track video plays
    trackVideoPlay(movieId, movieTitle) {
        this.track('video_play', { 
            movieId, 
            movieTitle, 
            timestamp: Date.now() 
        });
    }

    // Track API performance
    trackApiCall(endpoint, duration, success) {
        this.track('api_call', { 
            endpoint, 
            duration, 
            success, 
            timestamp: Date.now() 
        });
    }

    // Generic event tracking
    track(eventName, data) {
        const event = {
            sessionId: this.sessionId,
            event: eventName,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.events.push(event);
        
        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics:', event);
        }
        
        // Send to analytics service (optional)
        // this.sendToAnalytics(event);
    }

    // Get session summary
    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            eventCount: this.events.length,
            events: this.events
        };
    }

    // Performance monitoring
    measureApiCall(apiCall) {
        const startTime = performance.now();
        
        return apiCall().then(result => {
            const duration = performance.now() - startTime;
            this.trackApiCall(apiCall.name || 'unknown', duration, true);
            return result;
        }).catch(error => {
            const duration = performance.now() - startTime;
            this.trackApiCall(apiCall.name || 'unknown', duration, false);
            throw error;
        });
    }
}

// Initialize analytics
window.analytics = new Analytics();

// Track initial page load
window.analytics.trackPageView('home');