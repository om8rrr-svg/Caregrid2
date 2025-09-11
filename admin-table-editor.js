/**
 * Supabase Clinics Table Editor
 * Handles null JSONB sections in the clinics database
 */

class SupabaseTableEditor {
    constructor() {
        this.supabase = null;
        this.clinics = [];
        this.currentClinic = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase client
            this.supabase = supabase.createClient(
                'https://vzjqrbicwhyawtsjnplt.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds'
            );

            await this.loadData();
            this.setupEventListeners();
            this.generateHoursEditor();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAlert('Failed to initialize table editor', 'danger');
        }
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClinic();
        });

        // Modal close on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadData() {
        try {
            const { data, error } = await this.supabase
                .from('clinics')
                .select('*')
                .order('name');

            if (error) throw error;

            this.clinics = data || [];
            this.updateStats();
            this.renderTable();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showAlert('Failed to load clinic data', 'danger');
        }
    }

    updateStats() {
        const total = this.clinics.length;
        const nullOpeningHours = this.clinics.filter(c => !c.opening_hours).length;
        const nullContact = this.clinics.filter(c => !c.contact || Object.keys(c.contact || {}).length === 0).length;
        const nullLocation = this.clinics.filter(c => !c.location || Object.keys(c.location || {}).length === 0).length;

        document.getElementById('totalClinics').textContent = total;
        document.getElementById('nullOpeningHours').textContent = nullOpeningHours;
        document.getElementById('nullContact').textContent = nullContact;
        document.getElementById('nullLocation').textContent = nullLocation;
    }

    renderTable() {
        const container = document.getElementById('tableContainer');

        if (this.clinics.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-database fa-2x"></i>
                    <p>No clinics found in database</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="clinics-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Contact</th>
                        <th>Opening Hours</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clinics.map(clinic => this.renderTableRow(clinic)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderTableRow(clinic) {
        const locationStatus = this.getJsonbStatus(clinic.location);
        const contactStatus = this.getJsonbStatus(clinic.contact);
        const hoursStatus = this.getJsonbStatus(clinic.opening_hours);

        return `
            <tr>
                <td>
                    <strong>${this.escapeHtml(clinic.name)}</strong>
                    <br>
                    <small class="text-muted">${clinic.id}</small>
                </td>
                <td>
                    <span class="badge badge-primary">${this.escapeHtml(clinic.type)}</span>
                </td>
                <td>
                    ${locationStatus.html}
                </td>
                <td>
                    ${contactStatus.html}
                </td>
                <td>
                    ${hoursStatus.html}
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="tableEditor.editClinic('${clinic.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            </tr>
        `;
    }

    getJsonbStatus(jsonbField) {
        if (!jsonbField || Object.keys(jsonbField).length === 0) {
            return {
                isNull: true,
                html: '<span class="null-indicator"><i class="fas fa-exclamation-triangle"></i> NULL</span>'
            };
        }

        const preview = this.createJsonbPreview(jsonbField);
        return {
            isNull: false,
            html: `<div class="jsonb-preview" title="${this.escapeHtml(JSON.stringify(jsonbField, null, 2))}">${preview}</div>`
        };
    }

    createJsonbPreview(jsonbField) {
        if (!jsonbField) return 'NULL';

        const keys = Object.keys(jsonbField);
        if (keys.length === 0) return 'Empty';

        // Create a meaningful preview based on the field type
        if (jsonbField.address || jsonbField.city) {
            return `${jsonbField.address || ''}, ${jsonbField.city || ''}`;
        }

        if (jsonbField.phone || jsonbField.email) {
            return `${jsonbField.phone || ''} ${jsonbField.email || ''}`;
        }

        if (jsonbField.Monday || jsonbField.monday) {
            const dayCount = keys.filter(k => k.toLowerCase().includes('day') || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(k.toLowerCase().substring(0, 3))).length;
            return `${dayCount} days configured`;
        }

        return `${keys.length} fields`;
    }

    editClinic(clinicId) {
        const clinic = this.clinics.find(c => c.id === clinicId);
        if (!clinic) {
            this.showAlert('Clinic not found', 'danger');
            return;
        }

        this.currentClinic = clinic;
        this.populateEditForm(clinic);
        this.showModal();
    }

    populateEditForm(clinic) {
        // Basic fields
        document.getElementById('clinicId').value = clinic.id;
        document.getElementById('clinicName').value = clinic.name || '';
        document.getElementById('clinicType').value = clinic.type || 'GP';

        // Location fields
        const location = clinic.location || {};
        document.getElementById('locationAddress').value = location.address || '';
        document.getElementById('locationCity').value = location.city || '';
        document.getElementById('locationPostcode').value = location.postcode || '';

        if (location.coordinates && Array.isArray(location.coordinates)) {
            document.getElementById('locationLat').value = location.coordinates[1] || '';
            document.getElementById('locationLng').value = location.coordinates[0] || '';
        } else {
            document.getElementById('locationLat').value = '';
            document.getElementById('locationLng').value = '';
        }

        // Contact fields
        const contact = clinic.contact || {};
        document.getElementById('contactPhone').value = contact.phone || '';
        document.getElementById('contactEmail').value = contact.email || '';
        document.getElementById('contactWebsite').value = contact.website || '';

        // Opening hours
        this.populateHours(clinic.opening_hours || {});
    }

    generateHoursEditor() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const hoursGrid = document.getElementById('hoursGrid');

        hoursGrid.innerHTML = days.map(day => `
            <div class="day-hours">
                <h4>${day}</h4>
                <div class="time-inputs">
                    <input type="time" id="${day.toLowerCase()}Open" class="form-control" placeholder="Open">
                    <span>to</span>
                    <input type="time" id="${day.toLowerCase()}Close" class="form-control" placeholder="Close">
                </div>
                <div class="closed-checkbox">
                    <label>
                        <input type="checkbox" id="${day.toLowerCase()}Closed" onchange="tableEditor.toggleDayClosed('${day.toLowerCase()}')">
                        Closed
                    </label>
                </div>
            </div>
        `).join('');
    }

    populateHours(hours) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const dayData = hours[day] || hours[day.charAt(0).toUpperCase() + day.slice(1)] || {};
            const openInput = document.getElementById(`${day}Open`);
            const closeInput = document.getElementById(`${day}Close`);
            const closedCheckbox = document.getElementById(`${day}Closed`);

            if (dayData.closed || dayData.isClosed) {
                closedCheckbox.checked = true;
                openInput.disabled = true;
                closeInput.disabled = true;
                openInput.value = '';
                closeInput.value = '';
            } else {
                closedCheckbox.checked = false;
                openInput.disabled = false;
                closeInput.disabled = false;
                openInput.value = dayData.open || dayData.opening || '';
                closeInput.value = dayData.close || dayData.closing || '';
            }
        });
    }

    toggleDayClosed(day) {
        const openInput = document.getElementById(`${day}Open`);
        const closeInput = document.getElementById(`${day}Close`);
        const closedCheckbox = document.getElementById(`${day}Closed`);

        if (closedCheckbox.checked) {
            openInput.disabled = true;
            closeInput.disabled = true;
            openInput.value = '';
            closeInput.value = '';
        } else {
            openInput.disabled = false;
            closeInput.disabled = false;
        }
    }

    async saveClinic() {
        try {
            const clinicId = document.getElementById('clinicId').value;

            // Collect form data
            const updateData = {
                name: document.getElementById('clinicName').value,
                type: document.getElementById('clinicType').value,
                location: this.collectLocationData(),
                contact: this.collectContactData(),
                opening_hours: this.collectHoursData(),
                updated_at: new Date().toISOString()
            };

            // Remove empty objects
            if (Object.keys(updateData.location).length === 0) {
                updateData.location = null;
            }
            if (Object.keys(updateData.contact).length === 0) {
                updateData.contact = null;
            }
            if (Object.keys(updateData.opening_hours).length === 0) {
                updateData.opening_hours = null;
            }

            const { error } = await this.supabase
                .from('clinics')
                .update(updateData)
                .eq('id', clinicId);

            if (error) throw error;

            this.showAlert('Clinic updated successfully!', 'success');
            this.closeModal();
            await this.loadData(); // Refresh the table
        } catch (error) {
            console.error('Error saving clinic:', error);
            this.showAlert('Failed to save clinic: ' + error.message, 'danger');
        }
    }

    collectLocationData() {
        const location = {};

        const address = document.getElementById('locationAddress').value.trim();
        const city = document.getElementById('locationCity').value.trim();
        const postcode = document.getElementById('locationPostcode').value.trim();
        const lat = parseFloat(document.getElementById('locationLat').value);
        const lng = parseFloat(document.getElementById('locationLng').value);

        if (address) location.address = address;
        if (city) location.city = city;
        if (postcode) location.postcode = postcode;

        if (!isNaN(lat) && !isNaN(lng)) {
            location.coordinates = [lng, lat]; // GeoJSON format: [longitude, latitude]
        }

        return location;
    }

    collectContactData() {
        const contact = {};

        const phone = document.getElementById('contactPhone').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const website = document.getElementById('contactWebsite').value.trim();

        if (phone) contact.phone = phone;
        if (email) contact.email = email;
        if (website) contact.website = website;

        return contact;
    }

    collectHoursData() {
        const hours = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
            const openInput = document.getElementById(`${day}Open`);
            const closeInput = document.getElementById(`${day}Close`);
            const closedCheckbox = document.getElementById(`${day}Closed`);

            if (closedCheckbox.checked) {
                hours[day] = { closed: true };
            } else if (openInput.value && closeInput.value) {
                hours[day] = {
                    open: openInput.value,
                    close: closeInput.value,
                    closed: false
                };
            }
        });

        return hours;
    }

    showModal() {
        document.getElementById('editModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentClinic = null;
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();

        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${this.escapeHtml(message)}
            </div>
        `;

        alertContainer.innerHTML = alertHTML;

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async refreshData() {
        this.showAlert('Refreshing data...', 'info');
        await this.loadData();
    }
}

// Global functions for HTML onclick handlers
function refreshData() {
    tableEditor.refreshData();
}

function closeModal() {
    tableEditor.closeModal();
}

// Initialize the table editor
let tableEditor;
document.addEventListener('DOMContentLoaded', () => {
    tableEditor = new SupabaseTableEditor();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseTableEditor;
}
