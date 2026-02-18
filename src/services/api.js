/**
 * API Service for Property Estimator
 * Handles all API calls to the backend
 * 
 * Note: Property calculations are now performed client-side.
 * This service only handles database operations (save, get, delete).
 */

import { calculatePropertyInvestment } from './calculationService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}, getAccessToken) {
  const token = await getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Calculate property investment returns (CLIENT-SIDE)
 * This now performs calculations locally instead of calling the backend
 */
export async function calculateProperty(data) {
  // Perform calculation client-side
  return calculatePropertyInvestment(data);
}

/**
 * Save a property calculation
 */
export async function saveProperty(data, getAccessToken) {
  return apiRequest('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  }, getAccessToken);
}

/**
 * Get all saved properties
 */
export async function getProperties(getAccessToken) {
  return apiRequest('/properties', {
    method: 'GET',
  }, getAccessToken);
}

/**
 * Get a single property by ID
 */
export async function getProperty(propertyId, getAccessToken) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'GET',
  }, getAccessToken);
}

/**
 * Delete a property
 */
export async function deleteProperty(propertyId, getAccessToken) {
  return apiRequest(`/properties/${propertyId}`, {
    method: 'DELETE',
  }, getAccessToken);
}
