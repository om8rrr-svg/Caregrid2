import { fetchJson } from './api-base.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('listClinicForm');
  const success = document.querySelector('.form-step[data-step="success"]');
  const fail = document.getElementById('listClinicFail');
  
  // Hide success and fail messages by default
  if (success) success.style.display = 'none';
  if (fail) fail.style.display = 'none';

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous messages
    if (success) success.style.display = 'none';
    if (fail) fail.style.display = 'none';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const btn = form.querySelector('button[type="submit"]');
    
    // Disable button and show loading state
    if (btn) {
      btn.setAttribute('disabled', 'disabled');
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
      const originalText = btn.textContent;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      
      // Store original text for reset
      btn.dataset.originalText = originalText;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      await fetchJson('/api/clinics/apply', { 
        method: 'POST', 
        body: data,
        timeoutMs: 30000
      });
      
      clearTimeout(timeoutId);
      
      // Success: reset form and show success message
      form.reset();
      if (success) {
        success.style.display = 'block';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          if (success) success.style.display = 'none';
        }, 5000);
      }
      
    } catch (err) {
      console.error('Form submission error:', err);
      
      if (fail) {
        // Show appropriate error message based on error type
        if (err.message.includes('network_error') || err.message.includes('timeout')) {
          fail.textContent = 'Connection timeout. Please check your internet connection and try again.';
        } else if (err.message.includes('http_400')) {
          fail.textContent = 'Please check your form data and try again.';
        } else if (err.message.includes('http_500')) {
          fail.textContent = 'Server error. Please try again later.';
        } else {
          fail.textContent = 'Submission failed. Please try again later.';
        }
        
        fail.style.display = 'block';
        fail.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide error message after 8 seconds
        setTimeout(() => {
          if (fail) fail.style.display = 'none';
        }, 8000);
      }
      
    } finally {
      // Re-enable button and restore original state
      if (btn) {
        btn.removeAttribute('disabled');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = btn.dataset.originalText || 'Submit Application';
      }
    }
  });
});