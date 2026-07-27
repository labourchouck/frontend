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

/**
 * Fetch all product enquiries (leads) for the vendor.
 * GET /api/v1/vendor/buildmart/enquiries
 */
export async function getVendorBuildmartEnquiries({ page = 1, limit = 20, status = 'all' } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (status && status !== 'all') params.set('status', status)

  const data = await apiRequest(`/vendor/buildmart/enquiries?${params}`)
  return data?.data ?? data
}

/**
 * Update the status of a specific lead.
 * PATCH /api/v1/vendor/buildmart/enquiries/:id/status
 */
export async function updateVendorBuildmartEnquiryStatus(id, status) {
  const data = await apiRequest(`/vendor/buildmart/enquiries/${id}/status`, {
    method: 'PATCH',
    body: { status }
  });
  return data?.data?.lead ?? data?.lead ?? data;
}
