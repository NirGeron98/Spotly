const {catchAsync} = require("../../../utils/catchAsync");

describe("catchAsync Utility", () => {
  it("should pass the error to next if the function throws", async () => {
    // Arrange
    const mockNext = jest.fn();
    const mockReq = {};
    const mockRes = {};
    const mockError = new Error("Test error");

    const asyncFn = jest.fn().mockRejectedValue(mockError);
    const wrappedFn = catchAsync(asyncFn);

    // Act
    await wrappedFn(mockReq, mockRes, mockNext);

    // Assert
    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it("should execute the function normally if no error occurs", async () => {
    // Arrange
    const mockNext = jest.fn();
    const mockReq = {};
    const mockRes = {};
    const mockResult = { success: true };

    const asyncFn = jest.fn().mockResolvedValue(mockResult);
    const wrappedFn = catchAsync(asyncFn);

    // Act
    await wrappedFn(mockReq, mockRes, mockNext);

    // Assert
    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
