const mongoose = require('mongoose');
const Vendor = require('../../models/vendorModal');
const Product = require('../../models/productModal');
const Address = require('../../models/addressModal');
const Module = require('../../models/moduleModal');

// Helper to resolve coordinates from headers or user profile
const resolveCoordinates = async (req) => {
  const headerLat = req.headers['x-latitude'];
  const headerLng = req.headers['x-longitude'];

  if (headerLat && headerLng) {
    const lat = parseFloat(headerLat);
    const lng = parseFloat(headerLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Fallback to user default address if user is authenticated
  if (req.user && req.user._id) {
    try {
      let userAddress = await Address.findOne({ user: req.user._id, isDefault: true });
      if (!userAddress) {
        userAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      }
      if (userAddress && userAddress.latitude != null && userAddress.longitude != null) {
        const lat = parseFloat(userAddress.latitude);
        const lng = parseFloat(userAddress.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    } catch (e) {
      console.warn('Could not resolve user address coordinates:', e.message);
    }
  }

  // Default fallback (e.g. Ahmedabad city center)
  return { lat: 23.0225, lng: 72.5714 };
};

// Helper to check if vendor is currently open
const isVendorOpen = (openTime, closeTime, timezone = 'Asia/Kolkata') => {
  if (!openTime || !closeTime) return true;
  try {
    const now = new Date();
    // Get current time in vendor's timezone
    const timeString = now.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (openTime <= closeTime) {
      return timeString >= openTime && timeString <= closeTime;
    } else {
      // Overnight hours (e.g. 18:00 to 02:00)
      return timeString >= openTime || timeString <= closeTime;
    }
  } catch (e) {
    return true;
  }
};

/**
 * GET /api/app/search/suggestions
 * Instant debounced typeahead autocomplete
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, moduleId } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        data: {
          dishes: [],
          stores: [],
          categories: []
        }
      });
    }

    const trimmedQuery = q.trim();
    const regex = new RegExp(trimmedQuery, 'i');
    const { lat, lng } = await resolveCoordinates(req);

    // 1. Find matching active vendors nearby
    const vendorQuery = {
      status: 1,
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { address: { $regex: regex } }
      ]
    };

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      vendorQuery.module = new mongoose.Types.ObjectId(moduleId);
    }

    const matchingVendors = await Vendor.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: vendorQuery
        }
      },
      { $limit: 4 },
      {
        $project: {
          name: 1,
          vendor_image: 1,
          address: 1,
          preparation_time_minute: 1,
          open_time: 1,
          close_time: 1,
          timezone: 1,
          distance: 1
        }
      }
    ]);

    const formattedStores = matchingVendors.map(v => ({
      _id: v._id,
      name: v.name,
      image: v.vendor_image,
      address: v.address,
      preparation_time: v.preparation_time_minute || 25,
      isOpen: isVendorOpen(v.open_time, v.close_time, v.timezone),
      distance_km: v.distance != null ? Math.round((v.distance / 1000) * 10) / 10 : null,
      type: 'store'
    }));

    // 2. Find matching active products
    const productQuery = {
      isActive: true,
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { category_name: { $regex: regex } },
        { tags: { $in: [regex] } }
      ]
    };

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      productQuery.module_id = new mongoose.Types.ObjectId(moduleId);
    }

    const matchingProducts = await Product.find(productQuery)
      .populate('vendor_id', 'name vendor_image open_time close_time timezone status location')
      .limit(6)
      .lean();

    // Filter out products whose vendor is inactive
    const activeProducts = matchingProducts.filter(p => p.vendor_id && p.vendor_id.status === 1);

    const formattedDishes = activeProducts.map(p => {
      // Calculate approximate distance if vendor has coordinates
      let distanceKm = null;
      if (p.vendor_id?.location?.coordinates && p.vendor_id.location.coordinates.length === 2) {
        const vLng = p.vendor_id.location.coordinates[0];
        const vLat = p.vendor_id.location.coordinates[1];
        const R = 6371; // km
        const dLat = (vLat - lat) * Math.PI / 180;
        const dLng = (vLng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distanceKm = Math.round(R * c * 10) / 10;
      }

      return {
        _id: p._id,
        name: p.name,
        image: p.image,
        main_price: p.main_price,
        special_price: p.special_price,
        dietary_type: p.dietary_type || 'none',
        category_name: p.category_name || '',
        vendor: {
          _id: p.vendor_id._id,
          name: p.vendor_id.name,
          isOpen: isVendorOpen(p.vendor_id.open_time, p.vendor_id.close_time, p.vendor_id.timezone),
          distance_km: distanceKm
        },
        type: 'dish'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        dishes: formattedDishes,
        stores: formattedStores,
        query: trimmedQuery
      }
    });
  } catch (err) {
    console.error('Error in getSearchSuggestions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch search suggestions',
      error: err.message
    });
  }
};

/**
 * GET /api/app/search/results
 * Full search page with rich sorting and filters
 */
exports.getSearchResults = async (req, res) => {
  try {
    const {
      q,
      moduleId,
      dietary, // 'veg' | 'non_veg' | 'vegan' | 'all'
      maxDeliveryTime, // in minutes
      hasOffers, // 'true' | 'false'
      openNow, // 'true' | 'false'
      sortBy = 'relevance' // 'relevance' | 'distance' | 'price_low' | 'price_high' | 'time' | 'rating'
    } = req.query;

    const trimmedQuery = (q || '').trim();
    const regex = trimmedQuery ? new RegExp(trimmedQuery, 'i') : null;
    const { lat, lng } = await resolveCoordinates(req);

    // 1. Fetch Vendors matching location & query
    const vendorQuery = { status: 1 };
    if (regex) {
      vendorQuery.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { address: { $regex: regex } }
      ];
    }
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      vendorQuery.module = new mongoose.Types.ObjectId(moduleId);
    }

    const vendorsAgg = await Vendor.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: vendorQuery
        }
      },
      {
        $lookup: {
          from: 'modules',
          localField: 'module',
          foreignField: '_id',
          as: 'module'
        }
      },
      { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } }
    ]);

    let vendors = vendorsAgg.map(v => {
      const isOpen = isVendorOpen(v.open_time, v.close_time, v.timezone);
      const distanceKm = v.distance != null ? Math.round((v.distance / 1000) * 10) / 10 : 1.5;
      const estimatedTime = (v.preparation_time_minute || 20) + Math.round(distanceKm * 3);

      return {
        _id: v._id,
        name: v.name,
        email: v.email,
        mobile_number: v.mobile_number,
        address: v.address,
        vendor_image: v.vendor_image,
        preparation_time_minute: v.preparation_time_minute || 20,
        estimated_delivery_time: estimatedTime,
        open_time: v.open_time,
        close_time: v.close_time,
        timezone: v.timezone,
        packaging_charge: v.packaging_charge || 0,
        delivery_charge: v.delivery_charge || 0,
        module: v.module,
        distance_meters: v.distance,
        distance_km: distanceKm,
        isOpen,
        rating: 4.3, // Mock / default baseline rating
        rating_count: 85
      };
    });

    // Apply vendor filters
    if (openNow === 'true') {
      vendors = vendors.filter(v => v.isOpen);
    }
    if (maxDeliveryTime && !isNaN(Number(maxDeliveryTime))) {
      vendors = vendors.filter(v => v.estimated_delivery_time <= Number(maxDeliveryTime));
    }

    // 2. Fetch Products matching query & filters
    const productQuery = { isActive: true };
    if (regex) {
      productQuery.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { category_name: { $regex: regex } },
        { tags: { $in: [regex] } }
      ];
    }
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      productQuery.module_id = new mongoose.Types.ObjectId(moduleId);
    }
    if (dietary && dietary !== 'all') {
      if (dietary === 'veg') {
        productQuery.dietary_type = { $in: ['veg', 'vegan'] };
      } else if (dietary === 'vegan') {
        productQuery.dietary_type = 'vegan';
      } else if (dietary === 'non_veg') {
        productQuery.dietary_type = 'non_veg';
      }
    }
    if (hasOffers === 'true') {
      productQuery.special_price = { $gt: 0 };
    }

    const rawProducts = await Product.find(productQuery)
      .populate('vendor_id', 'name vendor_image open_time close_time timezone status location packaging_charge delivery_charge')
      .populate('module_id', 'name')
      .lean();

    // Map and calculate product metadata & vendor distance
    let products = rawProducts
      .filter(p => p.vendor_id && p.vendor_id.status === 1)
      .map(p => {
        let distanceKm = null;
        if (p.vendor_id?.location?.coordinates && p.vendor_id.location.coordinates.length === 2) {
          const vLng = p.vendor_id.location.coordinates[0];
          const vLat = p.vendor_id.location.coordinates[1];
          const R = 6371;
          const dLat = (vLat - lat) * Math.PI / 180;
          const dLng = (vLng - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceKm = Math.round(R * c * 10) / 10;
        }

        const effectivePrice = (p.special_price != null && p.special_price > 0 && p.special_price < p.main_price) 
          ? p.special_price 
          : p.main_price;

        const discountPercent = (p.special_price != null && p.special_price > 0 && p.special_price < p.main_price)
          ? Math.round(((p.main_price - p.special_price) / p.main_price) * 100)
          : 0;

        const isOpen = isVendorOpen(p.vendor_id.open_time, p.vendor_id.close_time, p.vendor_id.timezone);
        const estimatedTime = (p.preparation_time_minute || 15) + Math.round((distanceKm || 2) * 3);

        return {
          _id: p._id,
          name: p.name,
          image: p.image,
          main_price: p.main_price,
          special_price: p.special_price,
          effective_price: effectivePrice,
          discount_percent: discountPercent,
          dietary_type: p.dietary_type || 'none',
          description: p.description || '',
          category_name: p.category_name || (p.module_id ? p.module_id.name : ''),
          preparation_time_minute: p.preparation_time_minute || 15,
          estimated_delivery_time: estimatedTime,
          vendor: {
            _id: p.vendor_id._id,
            name: p.vendor_id.name,
            vendor_image: p.vendor_id.vendor_image,
            isOpen,
            distance_km: distanceKm,
            packaging_charge: p.vendor_id.packaging_charge || 0,
            delivery_charge: p.vendor_id.delivery_charge || 0
          }
        };
      });

    // Filter products if openNow or maxDeliveryTime is requested
    if (openNow === 'true') {
      products = products.filter(p => p.vendor.isOpen);
    }
    if (maxDeliveryTime && !isNaN(Number(maxDeliveryTime))) {
      products = products.filter(p => p.estimated_delivery_time <= Number(maxDeliveryTime));
    }

    // Apply sorting
    if (sortBy === 'distance') {
      vendors.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
      products.sort((a, b) => (a.vendor.distance_km || 999) - (b.vendor.distance_km || 999));
    } else if (sortBy === 'price_low') {
      products.sort((a, b) => a.effective_price - b.effective_price);
    } else if (sortBy === 'price_high') {
      products.sort((a, b) => b.effective_price - a.effective_price);
    } else if (sortBy === 'time') {
      vendors.sort((a, b) => a.estimated_delivery_time - b.estimated_delivery_time);
      products.sort((a, b) => a.estimated_delivery_time - b.estimated_delivery_time);
    }

    return res.status(200).json({
      success: true,
      data: {
        query: trimmedQuery,
        vendors,
        products,
        totalVendors: vendors.length,
        totalProducts: products.length
      }
    });
  } catch (err) {
    console.error('Error in getSearchResults:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute search',
      error: err.message
    });
  }
};

/**
 * GET /api/app/search/trending
 * Top trending searches & popular quick search keywords
 */
exports.getTrendingSearches = async (req, res) => {
  try {
    const { moduleId } = req.query;

    const trendingKeywords = [
      { label: '🍕 Pizza', query: 'Pizza' },
      { label: '🍔 Burger', query: 'Burger' },
      { label: '🍛 Biryani', query: 'Biryani' },
      { label: '🥪 Sandwich', query: 'Sandwich' },
      { label: '🧋 Cold Coffee & Shakes', query: 'Coffee' },
      { label: '🥗 Fresh Salad', query: 'Salad' },
      { label: '🍰 Desserts & Cakes', query: 'Cake' },
      { label: '🥟 Dim Sums & Momos', query: 'Momos' }
    ];

    // Also fetch top modules as discovery categories
    const modules = await Module.find({ status: 1 }).select('name icon_image').limit(8).lean();

    return res.status(200).json({
      success: true,
      data: {
        trending: trendingKeywords,
        categories: modules
      }
    });
  } catch (err) {
    console.error('Error in getTrendingSearches:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trending searches',
      error: err.message
    });
  }
};
