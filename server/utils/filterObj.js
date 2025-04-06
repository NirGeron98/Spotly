/**
 * Filter object by allowed fields
 * @param {Object} obj - Object to filter
 * @param {...string} allowedFields - Fields to keep
 * @returns {Object} - Filtered object
 */
exports.filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
