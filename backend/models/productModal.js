
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
	module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
	name: { type: String, required: true, trim: true },
	main_price: { type: Number, required: true, min: 0 },
	special_price: { type: Number, default: null, min: 0 },
	preparation_time_minute: { type: Number, default: 0, min: 0 },
	packaging_charge: { type: Number, default: 0, min: 0 },
	image: { type: String, default: '' },
	dietary_type: { 
		type: String, 
		enum: ['veg', 'non_veg', 'vegan', 'egg', 'none'], 
		default: 'none' 
	},
	description: { type: String, trim: true, default: '' },
	category_name: { type: String, trim: true, default: '' },
	tags: [{ type: String, trim: true }],
	isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text', category_name: 'text' });
productSchema.index({ vendor_id: 1, isActive: 1 });
productSchema.index({ module_id: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

