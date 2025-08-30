/**
 * CareGrid Help Center JavaScript
 * Handles interactive features for the help center page
 */

// FAQ toggle functionality with accessibility support
function toggleFaq(element) {
    const answer = element.nextElementSibling;
    const isActive = element.classList.contains('active');
    const icon = element.querySelector('.faq-icon');
    
    // Close all other FAQs
    document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
        q.nextElementSibling.classList.remove('active');
        q.setAttribute('aria-expanded', 'false');
        const qIcon = q.querySelector('.faq-icon');
        if (qIcon) qIcon.textContent = '+';
    });
    
    // Toggle current FAQ
    if (!isActive) {
        element.classList.add('active');
        answer.classList.add('active');
        element.setAttribute('aria-expanded', 'true');
        if (icon) icon.textContent = '−';
        
        // Scroll into view for better UX
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }
}

// Handle keyboard navigation for FAQ
function handleFaqKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleFaq(event.target);
    }
}

// Search functionality
function initializeHelpSearch() {
    const searchInput = document.getElementById('helpSearch');
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
            
            if (searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm)) {
                item.style.display = 'block';
                // Highlight search terms
                if (searchTerm !== '') {
                    highlightSearchTerm(item, searchTerm);
                } else {
                    removeHighlight(item);
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show no results message if needed
        updateNoResultsMessage(searchTerm);
    });
}

// Highlight search terms in FAQ items
function highlightSearchTerm(item, term) {
    const question = item.querySelector('.faq-question span');
    const answer = item.querySelector('.faq-answer p');
    
    [question, answer].forEach(element => {
        if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
        }
        
        const regex = new RegExp(`(${term})`, 'gi');
        const highlightedText = element.dataset.originalText.replace(regex, '<mark>$1</mark>');
        element.innerHTML = highlightedText;
    });
}

// Remove search highlighting
function removeHighlight(item) {
    const question = item.querySelector('.faq-question span');
    const answer = item.querySelector('.faq-answer p');
    
    [question, answer].forEach(element => {
        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
        }
    });
}

// Update no results message
function updateNoResultsMessage(searchTerm) {
    let noResultsMsg = document.querySelector('.no-results-message');
    const visibleItems = document.querySelectorAll('.faq-item[style*="block"]').length;
    const allHidden = document.querySelectorAll('.faq-item[style*="none"]').length === document.querySelectorAll('.faq-item').length;
    
    if (searchTerm && allHidden) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <div class="no-results-content">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try different keywords or <a href="contact.html">contact our support team</a> for help.</p>
                </div>
            `;
            document.querySelector('.faq-section').appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Category filtering
function initializeCategoryFiltering() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const faqItems = document.querySelectorAll('.faq-item');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter FAQ items
            faqItems.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Clear search when filtering by category
            const searchInput = document.getElementById('helpSearch');
            if (searchInput && category !== 'all') {
                searchInput.value = '';
                // Remove any highlighting
                faqItems.forEach(item => removeHighlight(item));
            }
            
            // Update URL hash for bookmarking
            window.history.replaceState(null, null, `#category-${category}`);
        });
    });
    
    // Initialize category from URL hash
    const hash = window.location.hash;
    if (hash.startsWith('#category-')) {
        const category = hash.replace('#category-', '');
        const tab = document.querySelector(`[data-category="${category}"]`);
        if (tab) {
            tab.click();
        }
    }
}

// Live chat functionality (placeholder)
function openLiveChat() {
    // This would integrate with a live chat service like Intercom, Zendesk, etc.
    alert('Live chat feature would be integrated with a service like Intercom or Zendesk.');
    // Example integration:
    // if (window.Intercom) {
    //     window.Intercom('show');
    // }
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Track FAQ usage for analytics
function trackFaqInteraction(question) {
    // This would send analytics data to track which FAQs are most used
    if (typeof gtag !== 'undefined') {
        gtag('event', 'faq_interaction', {
            'event_category': 'help_center',
            'event_label': question,
            'value': 1
        });
    }
}

// Initialize help center functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeHelpSearch();
    initializeCategoryFiltering();
    initializeSmoothScrolling();
    
    // Add click tracking to FAQ questions
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const questionText = this.querySelector('span').textContent.trim();
            trackFaqInteraction(questionText);
        });
    });
    
    // Add keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        // Escape key closes all FAQs
        if (e.key === 'Escape') {
            document.querySelectorAll('.faq-question.active').forEach(q => {
                toggleFaq(q);
            });
        }
    });
    
    // Add loading animation fade-in
    const helpCenter = document.querySelector('.help-center');
    if (helpCenter) {
        helpCenter.style.opacity = '0';
        helpCenter.style.transition = 'opacity 0.3s ease-in-out';
        setTimeout(() => {
            helpCenter.style.opacity = '1';
        }, 100);
    }
});

// Export functions for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleFaq,
        handleFaqKeydown,
        openLiveChat,
        initializeHelpSearch,
        initializeCategoryFiltering
    };
}