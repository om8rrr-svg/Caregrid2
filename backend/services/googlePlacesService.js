const axios = require('axios');

/**
 * Google Places API Service
 * Fetches real Google ratings and reviews for clinics
 */
class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Search for a place by name and address
   * @param {string} name - Clinic name
   * @param {string} address - Clinic address
   * @returns {Promise<Object|null>} Place data or null if not found
   */
  async findPlace(name, address) {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const query = `${name} ${address}`;
      const response = await axios.get(`${this.baseUrl}/findplacefromtext/json`, {
        params: {
          input: query,
          inputtype: 'textquery',
          fields: 'place_id,name,rating,user_ratings_total,formatted_address',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.candidates.length > 0) {
        return response.data.candidates[0];
      }

      return null;
    } catch (error) {
      console.error('Error finding place:', error.message);
      return null;
    }
  }

  /**
   * Get detailed place information including reviews
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object|null>} Detailed place data or null if not found
   */
  async getPlaceDetails(placeId) {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'place_id,name,rating,user_ratings_total,reviews,formatted_address,formatted_phone_number,website',
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      return null;
    } catch (error) {
      console.error('Error getting place details:', error.message);
      return null;
    }
  }

  /**
   * Get Google ratings and reviews for a clinic
   * @param {Object} clinic - Clinic object with name and address
   * @returns {Promise<Object>} Google ratings data
   */
  async getClinicGoogleData(clinic) {
    try {
      // First, find the place
      const place = await this.findPlace(clinic.name, clinic.address);
      
      if (!place || !place.place_id) {
        return {
          googleRating: null,
          googleReviewCount: null,
          googleReviews: [],
          googlePlaceId: null
        };
      }

      // Get detailed information
      const details = await this.getPlaceDetails(place.place_id);
      
      if (!details) {
        return {
          googleRating: place.rating || null,
          googleReviewCount: place.user_ratings_total || null,
          googleReviews: [],
          googlePlaceId: place.place_id
        };
      }

      return {
        googleRating: details.rating || null,
        googleReviewCount: details.user_ratings_total || null,
        googleReviews: details.reviews || [],
        googlePlaceId: details.place_id,
        googleWebsite: details.website || null,
        googlePhone: details.formatted_phone_number || null
      };
    } catch (error) {
      console.error('Error getting Google data for clinic:', clinic.name, error.message);
      return {
        googleRating: null,
        googleReviewCount: null,
        googleReviews: [],
        googlePlaceId: null
      };
    }
  }

  /**
   * Batch process multiple clinics to get Google data
   * @param {Array} clinics - Array of clinic objects
   * @returns {Promise<Array>} Array of clinics with Google data
   */
  async enrichClinicsWithGoogleData(clinics) {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured, skipping Google data enrichment');
      return clinics.map(clinic => ({
        ...clinic,
        googleRating: null,
        googleReviewCount: null,
        googleReviews: []
      }));
    }

    const enrichedClinics = [];
    
    for (const clinic of clinics) {
      const googleData = await this.getClinicGoogleData(clinic);
      enrichedClinics.push({
        ...clinic,
        ...googleData
      });
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return enrichedClinics;
  }

  /**
   * Get combined rating (local + Google)
   * @param {number} localRating - Local database rating
   * @param {number} localReviewCount - Local review count
   * @param {number} googleRating - Google rating
   * @param {number} googleReviewCount - Google review count
   * @returns {Object} Combined rating data
   */
  getCombinedRating(localRating, localReviewCount, googleRating, googleReviewCount) {
    // If no Google data, use local data
    if (!googleRating || !googleReviewCount) {
      return {
        combinedRating: localRating || 0,
        combinedReviewCount: localReviewCount || 0,
        source: 'local'
      };
    }

    // If no local data, use Google data
    if (!localRating || !localReviewCount) {
      return {
        combinedRating: googleRating,
        combinedReviewCount: googleReviewCount,
        source: 'google'
      };
    }

    // Combine both ratings with weighted average
    const totalReviews = localReviewCount + googleReviewCount;
    const weightedRating = (
      (localRating * localReviewCount) + (googleRating * googleReviewCount)
    ) / totalReviews;

    return {
      combinedRating: Math.round(weightedRating * 10) / 10, // Round to 1 decimal
      combinedReviewCount: totalReviews,
      source: 'combined'
    };
  }
}

module.exports = new GooglePlacesService();