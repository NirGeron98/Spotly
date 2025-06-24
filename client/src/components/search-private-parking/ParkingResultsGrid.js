import React from "react";
import ParkingSpotCard from "./ParkingSpotCard";

const ParkingResultsGrid = ({
  parkingSpots,
  searchParams,
  calculateHours,
  handleBookParking,
  formatAddress,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {parkingSpots.map((spot) => (
        <ParkingSpotCard
          key={spot._id}
          spot={spot}
          searchParams={searchParams}
          calculateHours={calculateHours}
          handleBookParking={handleBookParking}
          formatAddress={formatAddress}
        />
      ))}
    </div>
  );
};

export default ParkingResultsGrid;