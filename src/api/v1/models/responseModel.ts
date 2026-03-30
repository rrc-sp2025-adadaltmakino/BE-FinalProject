/**
 * Interface representing a standard API response
 * @template T - The type of the data property
 */
interface ApiResponse<T> {
    status: string;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
}

/**
 * Creates a success response object
 * @param data - The data to include in a response
 * @param message - A message providing additional information about the response
 * @returns
 */
export const successResponse = <T>(
    data: T,
    message?: string
): ApiResponse<T> => ({
    status: "success",
    data,
    message,
});

/**
 * Creates an error resposne object
 * @param message - The error message
 * @param code - Optional error code for debugging
 * @returns
 */
export const errorResponse = (
    message: string,
    code?: string
): ApiResponse<null> => ({
    status: "error",
    error: message,
    code,
});
