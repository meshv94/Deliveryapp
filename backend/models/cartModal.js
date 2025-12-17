
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
	product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
	name: { type: String },
	quantity: { type: Number, required: true, min: 1, default: 1 },
	main_price: { type: Number, required: true, min: 0 },
	special_price: { type: Number, default: null, min: 0 },
	item_total: { type: Number, required: true, min: 0 } // quantity * effective price
}, { _id: false });

const cartSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
	address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
	delivery_date: { type: Date },
	delivery_time: { type: String },

	items: { type: [cartItemSchema], default: [] },

	// price breakdown
	subtotal: { type: Number, required: true, min: 0, default: 0 },
	discount: { type: Number, default: 0, min: 0 },
	packaging_charge: { type: Number, default: 0, min: 0 },
	delivery_charge: { type: Number, default: 0, min: 0 },
	convenience_charge: { type: Number, default: 0, min: 0 },

	// totals
	total_quantity: { type: Number, default: 0, min: 0 },
	total_payable_amount: { type: Number, required: true, min: 0, default: 0 },

	status: { type: String, enum: ['New','Placed','Cancelled', 'Delivered', 'Refunded'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);

