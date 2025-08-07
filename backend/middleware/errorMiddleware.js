const errorHandler = (err, req, res, next) => {
    // Determine the status code: if it's a 200 (success) but an error occurred,
    // default to 500 (Internal Server Error), otherwise use the status code already set.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Set the response status code
    res.status(statusCode);

    // Send a JSON response with the error message and stack trace (in development)
    res.json({
        message: err.message, // The error message
        // Include stack trace only if in development mode for debugging
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
