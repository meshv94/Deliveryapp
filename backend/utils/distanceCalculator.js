/**
 * Calculate distance between two geographical points using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // Radius of Earth in kilometers
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;

	return parseFloat(distance.toFixed(2)); // Return distance rounded to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} Radians
 */
const toRadians = (degrees) => {
	return degrees * (Math.PI / 180);
};

/**
 * Calculate delivery charge based on distance
 * @param {Number} distance - Distance in kilometers
 * @param {Number} ratePerKm - Rate per kilometer (default: 10 INR)
 * @param {Number} baseCharge - Base charge for delivery (default: 20 INR)
 * @returns {Number} Delivery charge
 */
const calculateDeliveryCharge = (distance, ratePerKm = 2, baseCharge = 20) => {
	const charge = baseCharge + (distance * ratePerKm);
	return parseFloat(charge.toFixed(2));
};

module.exports = {
	calculateDistance,
	calculateDeliveryCharge
};
