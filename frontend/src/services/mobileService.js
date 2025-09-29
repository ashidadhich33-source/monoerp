/**
 * Mobile optimization service
 */
class MobileService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isMobile = this.detectMobile();
    this.isPWA = this.detectPWA();
    this.setupEventListeners();
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  detectPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOfflineStatus();
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // PWA installed
    window.addEventListener('appinstalled', () => {
      this.hideInstallPrompt();
      this.trackEvent('pwa_installed');
    });

    // Touch gestures
    this.setupTouchGestures();
  }

  handleOnlineStatus() {
    // Sync offline data when back online
    this.syncOfflineData();
    this.showToast('Connection restored', 'success');
  }

  handleOfflineStatus() {
    this.showToast('You are offline. Some features may be limited.', 'warning');
    this.enableOfflineMode();
  }

  async syncOfflineData() {
    try {
      const offlineData = await this.getOfflineData();
      if (offlineData.length > 0) {
        // Sync with server
        for (const data of offlineData) {
          await this.syncDataItem(data);
        }
        await this.clearOfflineData();
        this.showToast('Offline data synced successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  enableOfflineMode() {
    // Enable offline features
    document.body.classList.add('offline-mode');
  }

  disableOfflineMode() {
    document.body.classList.remove('offline-mode');
  }

  setupTouchGestures() {
    let startX, startY, startTime;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    });

    document.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Swipe detection
      if (deltaTime < 300) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 50) {
            this.handleSwipe('right');
          } else if (deltaX < -50) {
            this.handleSwipe('left');
          }
        } else {
          if (deltaY > 50) {
            this.handleSwipe('down');
          } else if (deltaY < -50) {
            this.handleSwipe('up');
          }
        }
      }

      // Reset
      startX = startY = null;
    });
  }

  handleSwipe(direction) {
    // Handle swipe gestures
    switch (direction) {
      case 'left':
        this.handleSwipeLeft();
        break;
      case 'right':
        this.handleSwipeRight();
        break;
      case 'up':
        this.handleSwipeUp();
        break;
      case 'down':
        this.handleSwipeDown();
        break;
    }
  }

  handleSwipeLeft() {
    // Navigate to next page or close modal
    const modal = document.querySelector('.modal');
    if (modal) {
      this.closeModal();
    }
  }

  handleSwipeRight() {
    // Navigate to previous page or open menu
    const menuButton = document.querySelector('.menu-button');
    if (menuButton) {
      menuButton.click();
    }
  }

  handleSwipeUp() {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleSwipeDown() {
    // Refresh page
    if (this.isOnline) {
      window.location.reload();
    }
  }

  showInstallPrompt() {
    if (this.deferredPrompt && !this.isPWA) {
      const installBanner = document.createElement('div');
      installBanner.className = 'install-banner';
      installBanner.innerHTML = `
        <div class="install-banner-content">
          <div class="install-banner-text">
            <h3>Install App</h3>
            <p>Install this app on your device for a better experience</p>
          </div>
          <div class="install-banner-actions">
            <button class="install-button" onclick="mobileService.installPWA()">Install</button>
            <button class="dismiss-button" onclick="mobileService.hideInstallPrompt()">Dismiss</button>
          </div>
        </div>
      `;
      document.body.appendChild(installBanner);
    }
  }

  hideInstallPrompt() {
    const installBanner = document.querySelector('.install-banner');
    if (installBanner) {
      installBanner.remove();
    }
  }

  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.trackEvent('pwa_install_prompt', { outcome });
      this.deferredPrompt = null;
    }
  }

  optimizeForMobile() {
    // Add mobile-specific optimizations
    if (this.isMobile) {
      // Add mobile class to body
      document.body.classList.add('mobile-device');
      
      // Optimize touch targets
      this.optimizeTouchTargets();
      
      // Add mobile-specific CSS
      this.addMobileStyles();
      
      // Optimize images
      this.optimizeImages();
      
      // Add pull-to-refresh
      this.addPullToRefresh();
    }
  }

  optimizeTouchTargets() {
    // Ensure touch targets are at least 44px
    const touchElements = document.querySelectorAll('button, a, input, select, textarea');
    touchElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.height < 44 || rect.width < 44) {
        element.style.minHeight = '44px';
        element.style.minWidth = '44px';
      }
    });
  }

  addMobileStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-device {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      .mobile-device input, .mobile-device textarea {
        -webkit-user-select: text;
        -khtml-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      .install-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #007bff;
        color: white;
        padding: 16px;
        z-index: 1000;
        transform: translateY(100%);
        animation: slideUp 0.3s ease-out forwards;
      }
      
      @keyframes slideUp {
        to { transform: translateY(0); }
      }
      
      .install-banner-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 100%;
      }
      
      .install-banner-text h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
      }
      
      .install-banner-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
      
      .install-banner-actions {
        display: flex;
        gap: 8px;
      }
      
      .install-button, .dismiss-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
      }
      
      .install-button {
        background: white;
        color: #007bff;
      }
      
      .dismiss-button {
        background: transparent;
        color: white;
        border: 1px solid white;
      }
      
      .offline-mode {
        opacity: 0.7;
      }
      
      .offline-mode::before {
        content: "Offline Mode";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ffc107;
        color: #000;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        z-index: 1001;
      }
    `;
    document.head.appendChild(style);
  }

  optimizeImages() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => {
      imageObserver.observe(img);
    });
  }

  addPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (isPulling) {
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
          e.preventDefault();
          this.showPullToRefreshIndicator(pullDistance);
        }
      }
    });

    document.addEventListener('touchend', () => {
      if (isPulling) {
        const pullDistance = currentY - startY;
        if (pullDistance > 100) {
          this.handlePullToRefresh();
        }
        this.hidePullToRefreshIndicator();
        isPulling = false;
      }
    });
  }

  showPullToRefreshIndicator(distance) {
    // Show pull to refresh indicator
    const indicator = document.querySelector('.pull-to-refresh') || this.createPullToRefreshIndicator();
    const opacity = Math.min(distance / 100, 1);
    indicator.style.opacity = opacity;
    indicator.style.transform = `translateY(${Math.min(distance, 100)}px)`;
  }

  hidePullToRefreshIndicator() {
    const indicator = document.querySelector('.pull-to-refresh');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(-50px)';
    }
  }

  createPullToRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh';
    indicator.innerHTML = `
      <div class="pull-to-refresh-content">
        <div class="pull-to-refresh-icon">↻</div>
        <div class="pull-to-refresh-text">Pull to refresh</div>
      </div>
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  handlePullToRefresh() {
    if (this.isOnline) {
      window.location.reload();
    } else {
      this.showToast('Cannot refresh while offline', 'warning');
    }
  }

  // Offline data management
  async getOfflineData() {
    try {
      const data = localStorage.getItem('offlineData');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  }

  async saveOfflineData(data) {
    try {
      const existingData = await this.getOfflineData();
      existingData.push({
        ...data,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      });
      localStorage.setItem('offlineData', JSON.stringify(existingData));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  async clearOfflineData() {
    localStorage.removeItem('offlineData');
  }

  async syncDataItem(data) {
    // Sync individual data item with server
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync data item:', error);
      // Re-save to offline storage
      await this.saveOfflineData(data);
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  trackEvent(eventName, data = {}) {
    // Track events for analytics
    console.log('Event tracked:', eventName, data);
  }

  // Performance optimizations
  optimizePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 100);
    });

    // Throttle resize events
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }

  handleScroll() {
    // Handle scroll optimizations
    const scrollTop = window.pageYOffset;
    const header = document.querySelector('.header');
    
    if (header) {
      if (scrollTop > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  }

  handleResize() {
    // Handle resize optimizations
    this.optimizeTouchTargets();
  }
}

// Initialize mobile service
const mobileService = new MobileService();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  mobileService.optimizeForMobile();
  mobileService.optimizePerformance();
});

export default mobileService;