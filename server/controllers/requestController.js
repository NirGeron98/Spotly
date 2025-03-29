const Request = require("./../models/userModel");
const factory = require("./handlerFactory");

exports.getAllRequests = factory.getAll(Request);
exports.createRequest = factory.createOne(Request);
exports.getRequest = factory.getOne(Request, {
  path: "assigned_spot building user",
});
exports.updateRequest = factory.updateOne(Request);
exports.deleteRequest = factory.deleteOne(Request);
