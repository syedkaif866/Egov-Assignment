export const normalizeVehicleNumber = (vehicleNumber) => {
    if (!vehicleNumber || typeof vehicleNumber !== 'string') {
        return '';
    }
    // 1. Convert to uppercase
    // 2. Use a regular expression to replace anything that is NOT a letter (A-Z) or a number (0-9) with an empty string.
    return vehicleNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
};