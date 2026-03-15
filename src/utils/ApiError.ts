export default class ApiError extends Error {
  readonly success = false;
  readonly data = null;
  readonly statusCode: number;
  readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
