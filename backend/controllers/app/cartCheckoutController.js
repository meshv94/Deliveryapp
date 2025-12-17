const Cart = require('../../models/cartModal');
const Product = require('../../models/productModal');
const Vendor = require('../../models/vendorModal');

// Checkout: save cart(s) per vendor for the authenticated user
exports.checkout = async (req, res) => {
	try {
		const userId = req.user && (req.user._id || req.user.id || req.user);
		if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

		const { cart } = req.body;
		if (!Array.isArray(cart) || cart.length === 0) {
			return res.status(400).json({ success: false, message: 'Cart must be a non-empty array' });
		}

        // here we check cart exist then delete old cart
        await Cart.deleteMany({ user: userId, status: 'New' });

		const createdCarts = [];

		// Process each vendor block sequentially to keep calculations clear
		for (const vendorBlock of cart) {
			const { vendor: vendorId, products } = vendorBlock;
			if (!vendorId || !Array.isArray(products) || products.length === 0) {
				return res.status(400).json({ success: false, message: 'Each cart entry must include vendor and products' });
			}

			const vendor = await Vendor.findById(vendorId);
			if (!vendor) return res.status(404).json({ success: false, message: `Vendor not found: ${vendorId}` });

			let subtotal = 0;
			let discount = 0;
			let packagingSum = 0; // from products
			let totalQuantity = 0;
			const items = [];

			for (const p of products) {
				const productId = p.product_id || p.product;
				const qty = Number(p.quantity) || 0;
				if (!productId || qty <= 0) return res.status(400).json({ success: false, message: 'Invalid product or quantity' });

				const product = await Product.findById(productId);
				if (!product) return res.status(404).json({ success: false, message: `Product not found: ${productId}` });

				const mainPrice = Number(product.main_price || 0);
				const specialPrice = (product.special_price !== null && product.special_price !== undefined && product.special_price > 0)
					? Number(product.special_price)
					: null;

				// Per instructions: subtotal uses main_price
				subtotal += mainPrice * qty;

				// Discount when special price used
				if (specialPrice !== null && specialPrice < mainPrice) {
					discount += (mainPrice - specialPrice) * qty;
				}

				// Packaging: product packaging * qty
				const productPackaging = Number(product.packaging_charge || 0) * qty;
				packagingSum += productPackaging;

				const effectivePrice = (specialPrice !== null && specialPrice > 0) ? specialPrice : mainPrice;
				const itemTotal = effectivePrice * qty;

				totalQuantity += qty;

				items.push({
					product: product._id,
					name: product.name,
					quantity: qty,
					main_price: mainPrice,
					special_price: specialPrice,
					item_total: itemTotal
				});
			}

			// Add vendor-level packaging charge once per cart
			const packaging_charge = packagingSum + Number(vendor.packaging_charge || 0);
			const delivery_charge = Number(vendor.delivery_charge || 0);
			const convenience_charge = Number(vendor.convenience_charge || 0);

			const total_payable_amount = subtotal - discount + packaging_charge + delivery_charge + convenience_charge;

			const cartDoc = new Cart({
				user: userId,
				vendor: vendor._id,
				items,
				subtotal,
				discount,
				packaging_charge,
				delivery_charge,
				convenience_charge,
				total_quantity: totalQuantity,
				total_payable_amount
			});

			const saved = await cartDoc.save();
			createdCarts.push(saved);
		}

		return res.status(201).json({ success: true, message: 'Cart(s) saved', data: createdCarts });
	} catch (err) {
		console.error('Checkout error:', err);
		return res.status(500).json({ success: false, message: 'Checkout failed', error: err.message });
	}
};

