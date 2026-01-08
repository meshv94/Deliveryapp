const Joi = require('joi');
const Address = require('../../models/addressModal');

// Validation schemas
const createAddressSchema = Joi.object({
  name: Joi.string().trim().required().max(100),
  mobile_number: Joi.string().trim().required().pattern(/^[6-9]\d{9}$/),
  pincode: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  city: Joi.string().trim().optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  type: Joi.string().valid('home','work','other').optional(),
  isDefault: Joi.boolean().optional()
});

const updateAddressSchema = Joi.object({
  name: Joi.string().trim().optional().max(100),
  mobile_number: Joi.string().trim().optional().pattern(/^[6-9]\d{9}$/),
  pincode: Joi.string().trim().optional(),
  address: Joi.string().trim().optional(),
  city: Joi.string().trim().optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  type: Joi.string().valid('home','work','other').optional(),
  isDefault: Joi.boolean().optional()
}).min(1);

// Get all addresses for authenticated user
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success:false, message: 'Unauthorized' });

    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    return res.status(200).json({ success: true, data: addresses, count: addresses.length });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return res.status(500).json({ success:false, message: 'Error fetching addresses', error: err.message });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success:false, message: 'Unauthorized' });

    const { error, value } = createAddressSchema.validate(req.body);
    if (error) return res.status(400).json({ success:false, message: error.details[0].message });

    const address = new Address({ ...value, user: userId });
    const saved = await address.save();

    return res.status(201).json({ success: true, message: 'Address added', data: saved });
  } catch (err) {
    console.error('Error adding address:', err);
    return res.status(500).json({ success:false, message: 'Error adding address', error: err.message });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success:false, message: 'Unauthorized' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ success:false, message: 'Address id is required' });

    const { error, value } = updateAddressSchema.validate(req.body);
    if (error) return res.status(400).json({ success:false, message: error.details[0].message });

    const address = await Address.findById(id);
    if (!address) return res.status(404).json({ success:false, message: 'Address not found' });
    if (address.user.toString() !== userId) return res.status(403).json({ success:false, message: 'Forbidden' });

    // If isDefault is being set, unset others first (use updateMany)
    if (value.isDefault) {
      await Address.updateMany({ user: userId, _id: { $ne: address._id }, isDefault: true }, { $set: { isDefault: false } });
    }

    Object.assign(address, value);
    const saved = await address.save();

    return res.status(200).json({ success:true, message: 'Address updated', data: saved });
  } catch (err) {
    console.error('Error updating address:', err);
    return res.status(500).json({ success:false, message: 'Error updating address', error: err.message });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success:false, message: 'Unauthorized' });

    const { id } = req.params;
    if (!id) return res.status(400).json({ success:false, message: 'Address id is required' });

    const address = await Address.findById(id);
    if (!address) return res.status(404).json({ success:false, message: 'Address not found' });
    if (address.user.toString() !== userId.toString()) return res.status(403).json({ success:false, message: 'Forbidden' });

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If deleted address was default, set another address as default (if any)
    if (wasDefault) {
      const another = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    return res.status(200).json({ success:true, message: 'Address deleted', data: null });
  } catch (err) {
    console.error('Error deleting address:', err);
    return res.status(500).json({ success:false, message: 'Error deleting address', error: err.message });
  }
};
