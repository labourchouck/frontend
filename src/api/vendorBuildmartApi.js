import { apiRequest } from './http.js'

/**
 * Fetch products uploaded by the logged-in vendor.
 * GET /api/v1/vendor/buildmart/products
 */
export async function getVendorBuildmartProducts() {
  const data = await apiRequest('/vendor/buildmart/products');
  return data;
}

/**
 * Fetch details of a specific product uploaded by the vendor.
 * GET /api/v1/vendor/buildmart/products/:id
 */
export async function getVendorBuildmartProductById(id) {
  const data = await apiRequest(`/vendor/buildmart/products/${id}`);
  return data;
}

/**
 * Upload a new product for admin review.
 * POST /api/v1/vendor/buildmart/products
 * @param {object} payload - The product data to upload.
 */
export async function createVendorBuildmartProduct(payload) {
  const data = await apiRequest('/vendor/buildmart/products', {
    method: 'POST',
    body: payload,
  });
  return data;
}

/**
 * Update a vendor's product (e.g., after it was REJECTED).
 * PUT /api/v1/vendor/buildmart/products/:id
 * @param {string} id - The product ID.
 * @param {object} payload - The updated product data.
 */
export async function updateVendorBuildmartProduct(id, payload) {
  const data = await apiRequest(`/vendor/buildmart/products/${id}`, {
    method: 'PUT',
    body: payload,
  });
  return data;
}

/**
 * Delete a product uploaded by the vendor.
 * DELETE /api/v1/vendor/buildmart/products/:id
 */
export async function deleteVendorBuildmartProduct(id) {
  const data = await apiRequest(`/vendor/buildmart/products/${id}`, {
    method: 'DELETE',
  });
  return data;
}
