
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
	delivery_distance: { type: Number, default: 0, min: 0 }, // distance in kilometers
	delivery_charge: { type: Number, default: 0, min: 0 },
	convenience_charge: { type: Number, default: 0, min: 0 },

	// totals
	total_quantity: { type: Number, default: 0, min: 0 },
	total_payable_amount: { type: Number, required: true, min: 0, default: 0 },

	// payment info
	payment_status: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
	payment_method: { type: String, enum: ['cod', 'stripe', 'wallet', 'hybrid'], default: 'cod' },
	wallet_amount_used: { type: Number, default: 0, min: 0 },
	stripe_session_id: { type: String },
	stripe_payment_intent: { type: String },

	// refund info
	refunded_amount: { type: Number, default: 0 },
	refunded_to: { type: String, enum: ['wallet', 'source', 'none'], default: 'none' },
	refunded_at: { type: Date },

	status: {
		type: String,
		enum: [
			'New',
			'Placed',
			'Confirmed',
			'Preparing',
			'Processing',
			'Ready',
			'Out for Delivery',
			'Delivered',
			'Cancelled',
			'Refunded'
		],
		default: 'New'
	},
	cancel_reason: { type: String },
	cancelled_by: { type: String, enum: ['admin', 'user', 'system'] },
	cancelled_at: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);

