import { useEffect, useState } from 'react'
import {
  fetchLandingBanners,
  fetchLandingLabourCatalogue,
  fetchLandingMartCategories,
  fetchLandingMartProducts,
} from '../api/landingApi.js'

const BRANDED = /tata|astral|havells|acc|asian|ultratech|supreme|dulux|godrej|birla|jsw|finolex/i

function normaliseGroups(payload) {
  const groups = payload?.data?.groups ?? payload?.groups ?? []
  return groups
    .map((g) => {
      const categories = (g.categories ?? []).map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        subtitle: c.subtitle || '',
        imageUrl: c.imageUrl || '',
        services: (c.services ?? []).map((s) => ({
          _id: s._id,
          name: s.name,
          basePrice: Number(s.basePrice) || 0,
          iconUrl: s.iconUrl || '',
        })),
      }))
      const services = categories.flatMap((c) => c.services)
      const prices = services.map((s) => s.basePrice).filter((p) => p > 0)
      return {
        _id: g._id,
        name: g.name,
        slug: g.slug,
        description: g.description || '',
        imageUrl: g.imageUrl || categories.find((c) => c.imageUrl)?.imageUrl || '',
        sortOrder: g.sortOrder ?? 0,
        categories,
        serviceCount: services.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
      }
    })
    .filter((g) => g.serviceCount > 0 || g.categories.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

function normaliseMartCategories(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : payload?.data?.items ?? []
  return list
    .filter((c) => c && c.active !== false)
    .map((c) => ({
      id: c.id,
      name: c.label || c.name || c.id,
      icon: c.icon || c.image || '',
      image: c.image || c.icon || '',
    }))
}

function normaliseProducts(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : payload?.data?.items ?? []
  const withImages = list.filter((p) => Array.isArray(p.images) && p.images[0])
  const ranked = [...withImages].sort((a, b) => {
    const aBrand = BRANDED.test(a.brand || '') ? 0 : 1
    const bBrand = BRANDED.test(b.brand || '') ? 0 : 1
    return aBrand - bBrand
  })
  return ranked.map((p) => ({
    id: p.id,
    name: String(p.name || '').trim(),
    brand: String(p.brand || '').trim(),
    categoryId: p.categoryId,
    image: p.images[0],
    priceLabel: p.priceLabel || '',
    availability: p.availability || 'in_stock',
    supplier: p.supplier || {},
    shortDescription: p.shortDescription || '',
  }))
}

function normaliseBanners(payload) {
  const list = payload?.data?.banners ?? payload?.banners ?? []
  return list.filter((b) => b?.imageUrl).map((b) => ({ id: b._id, imageUrl: b.imageUrl, targetUrl: b.targetUrl || '' }))
}

/**
 * Loads every public dataset the landing page renders. Each request fails
 * independently so one slow endpoint never blanks the whole page.
 */
export function useLandingData() {
  const [state, setState] = useState({
    loading: true,
    groups: [],
    martCategories: [],
    products: [],
    banners: [],
  })

  useEffect(() => {
    let alive = true
    Promise.allSettled([
      fetchLandingLabourCatalogue(),
      fetchLandingMartCategories(),
      fetchLandingMartProducts(),
      fetchLandingBanners(),
    ]).then(([cat, martCats, products, banners]) => {
      if (!alive) return
      setState({
        loading: false,
        groups: cat.status === 'fulfilled' ? normaliseGroups(cat.value) : [],
        martCategories: martCats.status === 'fulfilled' ? normaliseMartCategories(martCats.value) : [],
        products: products.status === 'fulfilled' ? normaliseProducts(products.value) : [],
        banners: banners.status === 'fulfilled' ? normaliseBanners(banners.value) : [],
      })
    })
    return () => {
      alive = false
    }
  }, [])

  return state
}
