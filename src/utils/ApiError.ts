export default class ApiError extends Error {
  readonly success = false;
  readonly data = null;

  constructor(
    readonly statusCode: number,
    override message = "Something went wrong",
    readonly errors: unknown[] = []
  ) {
    super(message);
  }
}
