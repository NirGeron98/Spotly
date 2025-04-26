//=============================================================================
// PRIVATE PARKING SPOT OPERATIONS
//=============================================================================

exports.createPrivateParkingSpot = catchAsync(async (req, res, next) => {
  if (req.user.role !== "private_prop_owner" && req.user.role !== "admin") {
    // Check if the user is a private property owner or an admin
    return next(
      new AppError("Only property owners can create private spots", 403)
    );
  }

  const parkingSpotData = {
    owner: req.user._id,
    spot_type: "private",
    address: req.user.address,
    is_available: true,
  };

  try {
    const parkingSpot = await privateSpotService.createSpot(parkingSpotData);

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
      new AppError(`Error creating private spot: ${error.message}`, 400)
    );
  }
});

exports.offerPrivateSpotForRental = catchAsync(async (req, res, next) => {
  const parkingSpot = await privateSpotService.offerSpotForRental({
    ...req.body,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: { parkingSpot },
  });
});

exports.getAvailablePrivateSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await privateSpotService.getAvailableSpots();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.getChargingStations = catchAsync(async (req, res, next) => {
  const parkingSpots = await privateSpotService.getChargingStations();

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});

exports.findPrivateSpots = catchAsync(async (req, res, next) => {
  const {
    latitude,
    longitude,
    date,
    startTime,
    endTime,
    maxPrice = 1000,
    is_charging_station,
    charger_type,
  } = req.body;

  // Validate required parameters
  if (!latitude || !longitude || !date || !startTime || !endTime) {
    return next(
      new AppError("Missing required parameters for finding parking spots", 400)
    );
  }

  // Validate date and time formats
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!dateTimeRegex.test(date)) {
    return next(new AppError("Invalid date format. Use YYYY-MM-DD", 400));
  }

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return next(
      new AppError("Invalid time format. Use HH:MM in 24-hour format", 400)
    );
  }

  // Create formatted datetime strings
  const startDateTime = `${date}T${startTime}:00`;
  const endDateTime = `${date}T${endTime}:00`;

  // Additional filters
  const filters = {};
  if (is_charging_station) filters.is_charging_station = true;
  if (charger_type) filters.charger_type = charger_type;

  try {
    const excludeOwnerId = req.user?.id;
    const { formattedResults, rankedSpots } =
      await privateSpotService.findOptimalBuildingSpots(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(maxPrice),
        startDateTime,
        endDateTime,
        filters,
        excludeOwnerId
      );

    if (rankedSpots.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: {
          parkingSpots: [],
        },
        message: "No available parking spots found matching your criteria",
      });
    }

    // Return results
    res.status(200).json({
      status: "success",
      results: formattedResults.length,
      data: {
        parkingSpots: formattedResults,
      },
    });
  } catch (error) {
    return next(
      new AppError(`Error finding optimal parking spots: ${error.message}`, 500)
    );
  }
});

exports.getMyReleasedPrivateSpots = catchAsync(async (req, res, next) => {
  const parkingSpots = await privateSpotService.getOwnerReleasedSpots(
    req.user.id
  );

  res.status(200).json({
    status: "success",
    results: parkingSpots.length,
    data: { parkingSpots },
  });
});
