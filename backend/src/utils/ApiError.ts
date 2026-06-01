export default class ApiError extends Error {
  readonly success = false;
  readonly data: unknown;
  readonly statusCode: number;
  readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = [],
    data: unknown = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
  }
}
