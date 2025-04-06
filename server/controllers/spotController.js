const spotService = require("../services/spotService");
const catchAsync = require("./../utils/catchAsync");

exports.getAllSpots = catchAsync(async (req, res, next) => {
  const spots = await spotService.getAllSpots();
  res.status(200).json({
    status: "success",
    results: spots.length,
    data: {
      spots,
    },
  });
});

exports.createSpot = catchAsync(async (req, res, next) => {
  const newSpot = await spotService.createSpot(req.body);
  res.status(201).json({
    status: "success",
    data: {
      spot: newSpot,
    },
  });
});

exports.getSpot = catchAsync(async (req, res, next) => {
  const spot = await spotService.getSpot(req.params.id);
  res.status(200).json({
    status: "success",
    data: {
      spot,
    },
  });
});

exports.updateSpot = catchAsync(async (req, res, next) => {
  const spot = await spotService.updateSpot(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: {
      spot,
    },
  });
});

exports.deleteSpot = catchAsync(async (req, res, next) => {
  await spotService.deleteSpot(req.params.id);
  res.status(204).json({
    status: "success",
    data: null,
  });
});
