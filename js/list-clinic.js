import { fetchJson } from './api-base.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('listClinicForm');
  const success = document.getElementById('listClinicSuccess');
  const fail = document.getElementById('listClinicFail');
  if (success) success.style.display = 'none';
  if (fail) fail.style.display = 'none';

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (success) success.style.display = 'none';
    if (fail) fail.style.display = 'none';

    const data = Object.fromEntries(new FormData(form).entries());
    const btn = form.querySelector('button[type="submit"]');
    btn?.setAttribute('disabled', 'disabled');

    try {
      await fetchJson('/api/clinics/apply', { method: 'POST', body: data });
      form.reset();
      if (success) success.style.display = 'block';
      success?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      if (fail) {
        fail.textContent = 'Submission failed. Please try again later.';
        fail.style.display = 'block';
      }
    } finally {
      btn?.removeAttribute('disabled');
    }
  });
});