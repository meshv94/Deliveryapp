const Vendor = require('../../models/vendorModal');
const Address = require('../../models/addressModal');
const Product = require('../../models/productModal');

// Get all active vendors (status = 1) sorted by proximity to user's default address
exports.getActiveVendors = async (req, res) => {
  try {
    // Require authenticated user with address
    const userId = req.user?._id;

    // Find user's default address (fallback to any address)
    let userAddress = await Address.findOne({ user: userId, isDefault: true });
    if (!userAddress) {
      userAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    }

    if (!userAddress || userAddress.latitude == null || userAddress.longitude == null) {
      return res.status(400).json({ success: false, message: 'Default address with latitude/longitude required' });
    }

    const lat = parseFloat(userAddress.latitude);
    const lng = parseFloat(userAddress.longitude);

    // Use aggregation with $geoNear to sort by distance (requires 2dsphere index on vendor.location)
    const vendors = await Vendor.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: { status: 1 }
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
      { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          email: 1,
          mobile_number: 1,
          address: 1,
          vendor_image: 1,
          preparation_time_minute: 1,
          open_time: 1,
          close_time: 1,
          timezone: 1,
          packaging_charge: 1,
          convenience_charge: 1,
          delivery_charge: 1,
          location: 1,
          module: { _id: 1, name: 1 },
          distance: 1,
          createdAt: 1
        }
      }
    ]);

    // What's new: vendors registered within last 7 days (also include distance)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newVendors = await Vendor.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          spherical: true,
          query: { status: 1, createdAt: { $gte: weekAgo } }
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
      { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          email: 1,
          mobile_number: 1,
          address: 1,
          vendor_image: 1,
          preparation_time_minute: 1,
          open_time: 1,
          close_time: 1,
          timezone: 1,
          packaging_charge: 1,
          convenience_charge: 1,
          delivery_charge: 1,
          location: 1,
          module: { _id: 1, name: 1 },
          distance: 1,
          createdAt: 1
        }
      }
    ]);

    const mapped = vendors.map(v => ({
      ...v,
      distance_meters: v.distance,
      distance_km: v.distance != null ? Math.round((v.distance / 1000) * 100) / 100 : null,
      isNew: v.createdAt && new Date(v.createdAt) >= weekAgo
    }));

    const mappedNew = newVendors.map(v => ({
      ...v,
      distance_meters: v.distance,
      distance_km: v.distance != null ? Math.round((v.distance / 1000) * 100) / 100 : null
    }));

    return res.status(200).json({ success: true, data: mapped, count: mapped.length, whatsNew: mappedNew, newCount: mappedNew.length });
  } catch (err) {
    console.error('Error fetching active vendors by proximity:', err);
    return res.status(500).json({ success: false, message: 'Error fetching active vendors', error: err.message });
  }
};

// Get vendor details and its active products (isActive = true)
exports.getVendorWithProducts = async (req, res) => {
  try {
    const vendorId = req.params.vendor_id || req.query.vendor_id || req.body.vendor_id;
    if (!vendorId) return res.status(400).json({ success: false, message: 'vendor_id is required' });

    const vendor = await Vendor.findById(vendorId).select('-__v');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const products = await Product.find({ vendor_id: vendorId, isActive: true }).select('-__v');

    return res.status(200).json({ success: true, data: { vendor, products, count: products.length } });
  } catch (err) {
    console.error('Error fetching vendor with products:', err);
    return res.status(500).json({ success: false, message: 'Error fetching vendor products', error: err.message });
  }
};
