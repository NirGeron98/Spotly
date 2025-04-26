exports.createBuildingParkingSpot = catchAsync(async (req, res, next) => {
  if (req.user.role !== "building_resident" || !req.user.resident_building) {
    return next(
      new AppError("Only building residents can create building spots", 403)
    );
  }

  const parkingSpotData = {
    owner: req.user._id,
    spot_type: "building",
    building: req.user.resident_building,
    floor: req.body.floor || "1",
    spot_number: req.body.spot_number || `${req.user._id}-spot`,
    is_available: true,
  };

  try {
    const parkingSpot = await buildingSpotService.createSpot(parkingSpotData);

    // Update user with reference to their spot
    req.user.parking_spot = parkingSpot._id;
    await req.user.save({ validateBeforeSave: false });

    res.status(201).json({
      status: "success",
      data: {
        parkingSpot,
      },
    });
  } catch (error) {
    return next(
      new AppError(`Error creating building spot: ${error.message}`, 400)
    );
  }
});

exports.getParkingSpotsByBuilding = catchAsync(async (req, res, next) => {
  const parkingSpots = await buildingSpotService.getSpotsByBuilding(
    req.params.buildingId
  );

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: {
      parkingSpots,
    },
  });
});

exports.findBuildingSpots = catchAsync(async (req, res, next) => {
  const { buildingId, date, startTime, endTime } = req.body;

  if (!buildingId || !date || !startTime || !endTime) {
    return next(new AppError("Missing required parameters", 400));
  }

  const startTimeISO = `${date}T${startTime}:00`;
  const endTimeISO = `${date}T${endTime}:00`;

  // Use building spot service to find optimal spots
  const result = await buildingSpotService.findOptimalSpot({
    userId: req.user.id,
    buildingId,
    startTime: startTimeISO,
    endTime: endTimeISO,
  });

  if (!result.success) {
    return next(new AppError(result.message || "Failed to find spot", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      reservation: {
        id: result.reservationId,
        spotId: result.spotId,
        startTime: result.startTime,
        endTime: result.endTime,
      },
    },
  });
});

