import React from "react";
import TimeLabels from "./TimeLabels";

const WeeklyParkingGrid = ({
  children,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  isDragging,
  selectedDay,
  dragStart,
  dragEnd,
  isDayInPast,
  getTimePosition,
  getTimeSlotHeight,
  weekViewSchedules,
  expandedSchedule,
  setExpandedSchedule,
  handleDeleteClick,
  handleBookingDetailsClick,
  ScheduleCard,
}) => {
  return (
    <div className="flex-grow overflow-auto relative">
      {children}

      <TimeLabels />

      <div className="mr-16 flex">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
          const isPast = isDayInPast(dayIndex);
          return (
            <div
              key={dayIndex}
              className={`flex-1 relative border-l border-gray-200 min-h-[1080px] ${
                isPast ? "bg-gray-100 cursor-not-allowed" : "bg-white"
              }`}
              onMouseDown={(e) => !isPast && onMouseDown(e, dayIndex)}
              onMouseMove={!isPast ? onMouseMove : undefined}
              onMouseUp={!isPast ? onMouseUp : undefined}
              onMouseLeave={!isPast ? onMouseLeave : undefined}
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-full h-[1px] ${
                    isPast ? "bg-gray-200" : "bg-gray-100"
                  }`}
                  style={{ top: i * 60 }}
                ></div>
              ))}
              {isDragging && selectedDay === dayIndex && (
                <div
                  className="absolute right-0 w-[calc(100%-8px)] mx-1 rounded-md bg-blue-200 border border-blue-400 opacity-70 z-10"
                  style={{
                    top: `${Math.min(dragStart, dragEnd)}px`,
                    height: `${Math.abs(dragEnd - dragStart)}px`,
                    minHeight: "15px",
                  }}
                ></div>
              )}
              {weekViewSchedules
                .filter((schedule) => schedule.dayOfWeek === dayIndex)
                .map((schedule, idx) => (
                  <ScheduleCard
                    key={idx}
                    schedule={schedule}
                    isExpanded={
                      expandedSchedule &&
                      expandedSchedule._id === schedule._id
                    }
                    onExpand={() =>
                      setExpandedSchedule(
                        expandedSchedule?._id === schedule._id
                          ? null
                          : schedule
                      )
                    }
                    getTimePosition={getTimePosition}
                    getTimeSlotHeight={getTimeSlotHeight}
                    onDeleteClick={handleDeleteClick}
                    onBookingDetailsClick={handleBookingDetailsClick}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyParkingGrid;
