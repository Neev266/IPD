export const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const errorResponse = (res, errorMessage, details = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details,
  });
};
