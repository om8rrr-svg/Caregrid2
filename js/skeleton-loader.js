/**
 * Enhanced Skeleton Loading Manager for CareGrid
 * Provides consistent skeleton loading states across all pages
 */

class SkeletonLoader {
  constructor() {
    this.loadingStates = new Map();
    this.observers = new Map();
    this.init();
  }

  init() {
    // Ensure skeleton CSS is loaded
    this.loadSkeletonCSS();
    
    // Set up intersection observer for fade-in animations
    this.setupIntersectionObserver();
  }

  loadSkeletonCSS() {
    if (!document.getElementById('skeleton-loading-css')) {
      const link = document.createElement('link');
      link.id = 'skeleton-loading-css';
      link.rel = 'stylesheet';
      link.href = '/css/skeleton-loading.css';
      document.head.appendChild(link);
    }
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('skeleton-fade-in');
            this.fadeInObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
    }
  }

  /**
   * Show skeleton loading for a container
   * @param {string|HTMLElement} container - Container element or selector
   * @param {string} type - Type of skeleton (cards, form, table, stats, search)
   * @param {Object} options - Configuration options
   */
  show(container, type = 'cards', options = {}) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const config = {
      count: 3,
      animate: true,
      ...options
    };

    // Store original content
    if (!this.loadingStates.has(element)) {
      this.loadingStates.set(element, {
        originalContent: element.innerHTML,
        originalClasses: element.className
      });
    }

    // Generate skeleton HTML based on type
    const skeletonHTML = this.generateSkeleton(type, config);
    
    // Add loading class and set skeleton content
    element.classList.add('skeleton-loading');
    element.innerHTML = skeletonHTML;
    
    // Add screen reader text
    this.addScreenReaderText(element, `Loading ${type}...`);
  }

  /**
   * Hide skeleton loading and restore content
   * @param {string|HTMLElement} container - Container element or selector
   * @param {string} newContent - Optional new content to display
   */
  hide(container, newContent = null) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;

    const state = this.loadingStates.get(element);
    if (!state) return;

    // Remove loading class
    element.classList.remove('skeleton-loading');
    
    // Restore content
    const contentToShow = newContent || state.originalContent;
    element.innerHTML = contentToShow;
    
    // Add fade-in animation if supported
    if (this.fadeInObserver && contentToShow !== state.originalContent) {
      this.fadeInObserver.observe(element);
    }
    
    // Clean up state
    this.loadingStates.delete(element);
  }

  /**
   * Generate skeleton HTML based on type
   * @param {string} type - Skeleton type
   * @param {Object} config - Configuration
   * @returns {string} Skeleton HTML
   */
  generateSkeleton(type, config) {
    switch (type) {
      case 'cards':
        return this.generateCardsSkeleton(config.count);
      case 'form':
        return this.generateFormSkeleton(config);
      case 'table':
        return this.generateTableSkeleton(config);
      case 'stats':
        return this.generateStatsSkeleton(config.count || 4);
      case 'search':
        return this.generateSearchSkeleton(config.count);
      case 'profile':
        return this.generateProfileSkeleton();
      case 'list':
        return this.generateListSkeleton(config.count);
      case 'dashboard':
        return this.generateDashboardSkeleton();
      default:
        return this.generateGenericSkeleton(config);
    }
  }

  generateCardsSkeleton(count = 3) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-image"></div>
        <div class="skeleton-header">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
        </div>
        <div class="skeleton-text medium"></div>
        <div class="skeleton-text small"></div>
        <div class="skeleton-button"></div>
      </div>
    `).join('');
  }

  generateFormSkeleton(config) {
    const fields = config.fields || ['input', 'input', 'textarea', 'button'];
    return `
      <div class="skeleton-form" aria-hidden="true">
        ${fields.map(field => {
          switch (field) {
            case 'input':
              return '<div class="skeleton-label"></div><div class="skeleton-input"></div>';
            case 'textarea':
              return '<div class="skeleton-label"></div><div class="skeleton-input" style="height: 120px;"></div>';
            case 'button':
              return '<div class="skeleton-button large" style="margin-top: 20px;"></div>';
            default:
              return '<div class="skeleton-input"></div>';
          }
        }).join('')}
      </div>
    `;
  }

  generateTableSkeleton(config) {
    const rows = config.rows || 5;
    const cols = config.cols || 4;
    return `
      <table class="skeleton-table" aria-hidden="true">
        ${Array(rows).fill(0).map(() => `
          <tr class="skeleton-row">
            ${Array(cols).fill(0).map(() => '<td><div class="skeleton-cell"></div></td>').join('')}
          </tr>
        `).join('')}
      </table>
    `;
  }

  generateStatsSkeleton(count = 4) {
    return `
      <div class="skeleton-stats" aria-hidden="true">
        ${Array(count).fill(0).map(() => `
          <div class="skeleton-stat">
            <div class="skeleton-stat-value"></div>
            <div class="skeleton-stat-label"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  generateSearchSkeleton(count = 5) {
    return `
      <div class="skeleton-search-results" aria-hidden="true">
        ${Array(count).fill(0).map(() => `
          <div class="skeleton-search-item">
            <div class="skeleton-search-image"></div>
            <div class="skeleton-search-content">
              <div class="skeleton-search-title"></div>
              <div class="skeleton-search-description"></div>
              <div class="skeleton-search-meta"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  generateProfileSkeleton() {
    return `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div style="flex: 1;">
            <div class="skeleton-title"></div>
            <div class="skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-text full"></div>
        <div class="skeleton-text large"></div>
        <div class="skeleton-text medium"></div>
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <div class="skeleton-button"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    `;
  }

  generateListSkeleton(count = 5) {
    return `
      <ul class="skeleton-list" aria-hidden="true">
        ${Array(count).fill(0).map(() => `
          <li class="skeleton-list-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-primary"></div>
              <div class="skeleton-secondary"></div>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  generateDashboardSkeleton() {
    return `
      <div aria-hidden="true">
        ${this.generateStatsSkeleton(4)}
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 30px;">
          <div class="skeleton-card">
            <div class="skeleton-title" style="margin-bottom: 20px;"></div>
            ${this.generateTableSkeleton({ rows: 5, cols: 3 })}
          </div>
          <div class="skeleton-card">
            <div class="skeleton-title" style="margin-bottom: 20px;"></div>
            ${this.generateListSkeleton(4)}
          </div>
        </div>
      </div>
    `;
  }

  generateGenericSkeleton(config) {
    const lines = config.lines || 3;
    return `
      <div aria-hidden="true">
        ${Array(lines).fill(0).map((_, i) => {
          const width = i === lines - 1 ? 'small' : (i % 2 === 0 ? 'large' : 'medium');
          return `<div class="skeleton-text ${width}"></div>`;
        }).join('')}
      </div>
    `;
  }

  addScreenReaderText(element, text) {
    const srText = document.createElement('span');
    srText.className = 'skeleton-sr-text';
    srText.textContent = text;
    srText.setAttribute('aria-live', 'polite');
    element.appendChild(srText);
  }

  /**
   * Show skeleton for specific page elements
   */
  showForAuth() {
    this.show('#authContainer', 'form', {
      fields: ['input', 'input', 'button']
    });
  }

  showForBooking() {
    this.show('#clinicGrid', 'cards', { count: 6 });
    this.show('#bookingForm', 'form', {
      fields: ['input', 'input', 'textarea', 'button']
    });
  }

  showForDashboard() {
    this.show('#statsRow', 'stats', { count: 4 });
    this.show('#recentBookings', 'table', { rows: 5, cols: 4 });
  }

  showForSearch() {
    this.show('#searchResults', 'search', { count: 8 });
  }

  showForProfile() {
    this.show('#profileContainer', 'profile');
  }

  /**
   * Utility method to show loading for multiple elements
   * @param {Array} elements - Array of {selector, type, options}
   */
  showMultiple(elements) {
    elements.forEach(({ selector, type, options }) => {
      this.show(selector, type, options);
    });
  }

  /**
   * Hide loading for multiple elements
   * @param {Array} selectors - Array of selectors
   */
  hideMultiple(selectors) {
    selectors.forEach(selector => {
      this.hide(selector);
    });
  }

  /**
   * Check if element is currently showing skeleton
   * @param {string|HTMLElement} container
   * @returns {boolean}
   */
  isLoading(container) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    return element && this.loadingStates.has(element);
  }

  /**
   * Clear all skeleton loading states
   */
  clearAll() {
    this.loadingStates.forEach((state, element) => {
      this.hide(element);
    });
  }
}

// Create global instance
window.skeletonLoader = new SkeletonLoader();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkeletonLoader;
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Skeleton Loader initialized');
  });
} else {
  console.log('Skeleton Loader initialized');
}

// Utility functions for backward compatibility
window.showSkeletonLoading = (container, type, options) => {
  window.skeletonLoader.show(container, type, options);
};

window.hideSkeletonLoading = (container, newContent) => {
  window.skeletonLoader.hide(container, newContent);
};

window.createSkeletonCard = () => {
  return window.skeletonLoader.generateCardsSkeleton(1);
};

window.hideSkeletonAndShowContent = (container, content) => {
  window.skeletonLoader.hide(container, content);
};