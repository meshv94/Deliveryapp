const Cart = require('../../models/cartModal');
const Product = require('../../models/productModal');
const Vendor = require('../../models/vendorModal');
const Address = require('../../models/addressModal');
const { calculateDistance, calculateDeliveryCharge } = require('../../utils/distanceCalculator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Checkout: save cart(s) per vendor for the authenticated user
exports.checkout = async (req, res) => {
	try {
		const userId = req.user && (req.user._id || req.user.id || req.user);
		if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

		const { cart, selectedAddressId } = req.body;
		if (!Array.isArray(cart) || cart.length === 0) {
			return res.status(400).json({ success: false, message: 'Cart must be a non-empty array' });
		}

		// Fetch customer address if selectedAddressId is provided
		let customerAddress = null;
		if (selectedAddressId) {
			customerAddress = await Address.findById(selectedAddressId);
			if (!customerAddress) {
				return res.status(404).json({ success: false, message: 'Address not found' });
			}

			if (!customerAddress.latitude || !customerAddress.longitude) {
				return res.status(400).json({
					success: false,
					message: 'Address coordinates are missing. Please update the address with valid coordinates.'
				});
			}
		}

        // here we check cart exist then delete old cart
        await Cart.deleteMany({ user: userId, status: 'New' });

		const createdCarts = [];
		let hasAddressId = !!selectedAddressId; // Check if address was provided
		let isDistanceTooFar = false; // Check if any vendor is more than 10 km away

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
			const convenience_charge = Number(vendor.convenience_charge || 0);

			// Calculate delivery charge if address is selected
			let delivery_distance = 0;
			let delivery_charge = 0;

			if (customerAddress) {
				// Calculate distance between customer address and vendor address
				delivery_distance = calculateDistance(
					Number(customerAddress.latitude),
					Number(customerAddress.longitude),
					Number(vendor.latitude),
					Number(vendor.longitude)
				);

				// Calculate delivery charge based on distance
				delivery_distance = parseInt(delivery_distance)

				// Check if distance is more than 10 km
				if (delivery_distance > 10) {
					isDistanceTooFar = true;
				}

				delivery_charge = calculateDeliveryCharge(delivery_distance);
			}

			const total_payable_amount = subtotal - discount + packaging_charge + delivery_charge + convenience_charge;

			const cartDoc = new Cart({
				user: userId,
				vendor: vendor._id,
				address: selectedAddressId || null,
				items,
				subtotal,
				discount,
				packaging_charge,
				delivery_distance,
				delivery_charge,
				convenience_charge,
				total_quantity: totalQuantity,
				total_payable_amount
			});

			const saved = await cartDoc.save();
			createdCarts.push(saved);
		}

		// Determine if pay button should be disabled and the reason
		let disablePayButton = false;
		let disableMessage = '';

		if (!hasAddressId) {
			disablePayButton = true;
			disableMessage = 'Please select a delivery address to proceed with payment.';
		} else if (isDistanceTooFar) {
			disablePayButton = true;
			disableMessage = 'Our delivery service is currently not available in your area. We are working on expanding our service.';
		}

		return res.status(201).json({
			success: true,
			message: 'Cart(s) saved',
			data: createdCarts,
			is_disable_pay_button: disablePayButton,
			disable_message: disableMessage
		});
	} catch (err) {
		console.error('Checkout error:', err);
		return res.status(500).json({ success: false, message: 'Checkout failed', error: err.message });
	}
};

// Place Order: Update cart(s) with address and delivery details, set status to Placed
exports.placeOrder = async (req, res) => {
	try {
		const userId = req.user && (req.user._id || req.user.id || req.user);
		if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

		const { selectedAddressId, cartIds, deliveryDate, deliveryType } = req.body;

		// Validation
		if (!selectedAddressId) {
			return res.status(400).json({ success: false, message: 'Address is required' });
		}

		if (!Array.isArray(cartIds) || cartIds.length === 0) {
			return res.status(400).json({ success: false, message: 'Cart IDs must be a non-empty array' });
		}

		if (!deliveryDate) {
			return res.status(400).json({ success: false, message: 'Delivery date is required' });
		}

		// Fetch customer address to get coordinates
		const customerAddress = await Address.findById(selectedAddressId);
		if (!customerAddress) {
			return res.status(404).json({ success: false, message: 'Address not found' });
		}

		if (!customerAddress.latitude || !customerAddress.longitude) {
			return res.status(400).json({
				success: false,
				message: 'Address coordinates are missing. Please update the address with valid coordinates.'
			});
		}

		// Update all carts
		const updatedCarts = [];
		for (const cartId of cartIds) {
			const cart = await Cart.findOne({ _id: cartId, user: userId }).populate('vendor');

			if (!cart) {
				return res.status(404).json({
					success: false,
					message: `Cart not found or unauthorized: ${cartId}`
				});
			}

			// Get vendor coordinates
			const vendor = cart.vendor;
			if (!vendor) {
				return res.status(404).json({ success: false, message: 'Vendor not found' });
			}

			// Calculate distance between customer address and vendor address
			const distance = calculateDistance(
				Number(customerAddress.latitude),
				Number(customerAddress.longitude),
				Number(vendor.latitude),
				Number(vendor.longitude)
			);

			// Calculate delivery charge based on distance
			const deliveryCharge = calculateDeliveryCharge(distance);

			// Update cart with delivery details
			cart.address = selectedAddressId;
			cart.delivery_date = new Date(deliveryDate);
			cart.delivery_time = deliveryType || 'today';
			cart.delivery_distance = distance;
			cart.delivery_charge = deliveryCharge;

			// Recalculate total_payable_amount
			cart.total_payable_amount = cart.subtotal - cart.discount +
				cart.packaging_charge + cart.delivery_charge + cart.convenience_charge;

			cart.status = 'Placed';

			const saved = await cart.save();
			updatedCarts.push(saved);
		}

		return res.status(200).json({
			success: true,
			message: 'Order placed successfully',
			data: updatedCarts
		});

	} catch (err) {
		console.error('Place order error:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to place order',
			error: err.message
		});
	}
};

// Create Stripe Checkout Session
exports.createStripeCheckout = async (req, res) => {
	try {
		const userId = req.user && (req.user._id || req.user.id || req.user);
		if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

		const { selectedAddressId, cartIds, deliveryDate, deliveryType } = req.body;

		// Validation
		if (!selectedAddressId) {
			return res.status(400).json({ success: false, message: 'Address is required' });
		}

		if (!Array.isArray(cartIds) || cartIds.length === 0) {
			return res.status(400).json({ success: false, message: 'Cart IDs must be a non-empty array' });
		}

		if (!deliveryDate) {
			return res.status(400).json({ success: false, message: 'Delivery date is required' });
		}

		// Fetch all carts and calculate total
		const carts = await Cart.find({ _id: { $in: cartIds }, user: userId });

		if (carts.length !== cartIds.length) {
			return res.status(404).json({
				success: false,
				message: 'Some carts not found or unauthorized'
			});
		}

		// Create line items for Stripe
		const lineItems = [];
		let totalAmount = 0;

		for (const cart of carts) {
			const vendor = await Vendor.findById(cart.vendor);
			const vendorName = vendor ? vendor.name : 'Unknown Vendor';

			// Add items from this cart
			for (const item of cart.items) {
				lineItems.push({
					price_data: {
						currency: 'inr',
						product_data: {
							name: `${item.name} (${vendorName})`,
							description: `Quantity: ${item.quantity}`,
						},
						unit_amount: Math.round(item.item_total * 100 / item.quantity), // Convert to paise
					},
					quantity: item.quantity,
				});
			}

			// Add charges as separate line items
			if (cart.packaging_charge > 0) {
				lineItems.push({
					price_data: {
						currency: 'inr',
						product_data: {
							name: `Packaging Charges (${vendorName})`,
						},
						unit_amount: Math.round(cart.packaging_charge * 100),
					},
					quantity: 1,
				});
			}

			if (cart.delivery_charge > 0) {
				lineItems.push({
					price_data: {
						currency: 'inr',
						product_data: {
							name: `Delivery Charges (${vendorName})`,
						},
						unit_amount: Math.round(cart.delivery_charge * 100),
					},
					quantity: 1,
				});
			}

			if (cart.convenience_charge > 0) {
				lineItems.push({
					price_data: {
						currency: 'inr',
						product_data: {
							name: `Convenience Charges (${vendorName})`,
						},
						unit_amount: Math.round(cart.convenience_charge * 100),
					},
					quantity: 1,
				});
			}

			totalAmount += cart.total_payable_amount;
		}

		// Create Stripe checkout session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`,
			metadata: {
				userId: userId.toString(),
				cartIds: cartIds.join(','),
				selectedAddressId,
				deliveryDate,
				deliveryType,
			},
		});

		return res.status(200).json({
			success: true,
			sessionId: session.id,
			url: session.url
		});

	} catch (err) {
		console.error('Create Stripe checkout error:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to create checkout session',
			error: err.message
		});
	}
};

// Stripe Webhook Handler
exports.handleStripeWebhook = async (req, res) => {
	const sig = req.headers['stripe-signature'];
	let event;

	console.log("======= GETTING WEBHOOK ===============", req.body)

	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			sig,
			process.env.STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		console.error('Webhook signature verification failed:', err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	// Handle the checkout.session.completed event
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;

		try {
			const { userId, cartIds, selectedAddressId, deliveryDate, deliveryType } = session.metadata;

			// Update all carts to Placed status
			const cartIdArray = cartIds.split(',');
			for (const cartId of cartIdArray) {
				const cart = await Cart.findOne({ _id: cartId, user: userId });

				if (cart) {
					cart.address = selectedAddressId;
					cart.delivery_date = new Date(deliveryDate);
					cart.delivery_time = deliveryType || 'today';
					cart.status = 'Placed';
					cart.payment_status = 'Paid';
					cart.stripe_session_id = session.id;
					cart.stripe_payment_intent = session.payment_intent;

					await cart.save();
				}
			}

			console.log('Order placed successfully via Stripe webhook');
		} catch (err) {
			console.error('Error processing webhook:', err);
			return res.status(500).json({ error: 'Webhook processing failed' });
		}
	}

	res.json({ received: true });
};

// Verify Stripe Payment and Place Order (For local development fallback)
exports.verifyStripePayment = async (req, res) => {
	try {
		const userId = req.user && (req.user._id || req.user.id || req.user);
		if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

		const { sessionId } = req.body;

		if (!sessionId) {
			return res.status(400).json({ success: false, message: 'Session ID is required' });
		}

		// Retrieve the session from Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		console.log("session", session)

		if (!session) {
			return res.status(404).json({ success: false, message: 'Session not found' });
		}

		// Check if payment was successful
		if (session.payment_status !== 'paid') {
			return res.status(400).json({
				success: false,
				message: 'Payment not completed',
				paymentStatus: session.payment_status
			});
		}

		// Get metadata
		const { userId: sessionUserId, cartIds, selectedAddressId, deliveryDate, deliveryType } = session.metadata;

		// Verify user matches
		if (sessionUserId !== userId.toString()) {
			return res.status(403).json({ success: false, message: 'Unauthorized - User mismatch' });
		}

		// Update all carts to Placed status
		const cartIdArray = cartIds.split(',');
		const updatedCarts = [];

		for (const cartId of cartIdArray) {
			const cart = await Cart.findOne({ _id: cartId, user: userId });

			if (cart) {
				// Check if already placed (to prevent duplicate placement)
				if (cart.status === 'Placed' && cart.payment_status === 'Paid') {
					console.log(`Cart ${cartId} already placed, skipping...`);
					updatedCarts.push(cart);
					continue;
				}

				cart.address = selectedAddressId;
				cart.delivery_date = new Date(deliveryDate);
				cart.delivery_time = deliveryType || 'today';
				cart.status = 'Placed';
				cart.payment_status = 'Paid';
				cart.stripe_session_id = session.id;
				cart.stripe_payment_intent = session.payment_intent;

				await cart.save();
				updatedCarts.push(cart);
			}
		}

		return res.status(200).json({
			success: true,
			message: 'Order placed successfully',
			data: updatedCarts
		});

	} catch (err) {
		console.error('Verify Stripe payment error:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to verify payment',
			error: err.message
		});
	}
};

