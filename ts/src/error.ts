import { z } from "zod";
import { err, ok, Result, ResultAsync } from "neverthrow";

export const StatusCode = {
	Continue: 100, // RFC 9110, 15.2.1
	SwitchingProtocols: 101, // RFC 9110, 15.2.2
	Processing: 102, // RFC 2518, 10.1
	EarlyHints: 103, // RFC 8297

	Ok: 200, // RFC 9110, 15.3.1
	Created: 201, // RFC 9110, 15.3.2
	Accepted: 202, // RFC 9110, 15.3.3
	NonAuthoritativeInfo: 203, // RFC 9110, 15.3.4
	NoContent: 204, // RFC 9110, 15.3.5
	ResetContent: 205, // RFC 9110, 15.3.6
	PartialContent: 206, // RFC 9110, 15.3.7
	MultiStatus: 207, // RFC 4918, 11.1
	AlreadyReported: 208, // RFC 5842, 7.1
	ImUsed: 226, // RFC 3229, 10.4.1

	MultipleChoices: 300, // RFC 9110, 15.4.1
	MovedPermanently: 301, // RFC 9110, 15.4.2
	Found: 302, // RFC 9110, 15.4.3
	SeeOther: 303, // RFC 9110, 15.4.4
	NotModified: 304, // RFC 9110, 15.4.5
	UseProxy: 305, // RFC 9110, 15.4.6
	_: 306, // RFC 9110, 15.4.7 (Unused)
	TemporaryRedirect: 307, // RFC 9110, 15.4.8
	PermanentRedirect: 308, // RFC 9110, 15.4.9

	BadRequest: 400, // RFC 9110, 15.5.1
	Unauthorized: 401, // RFC 9110, 15.5.2
	PaymentRequired: 402, // RFC 9110, 15.5.3
	Forbidden: 403, // RFC 9110, 15.5.4
	NotFound: 404, // RFC 9110, 15.5.5
	MethodNotAllowed: 405, // RFC 9110, 15.5.6
	NotAcceptable: 406, // RFC 9110, 15.5.7
	ProxyAuthRequired: 407, // RFC 9110, 15.5.8
	RequestTimeout: 408, // RFC 9110, 15.5.9
	Conflict: 409, // RFC 9110, 15.5.10
	Gone: 410, // RFC 9110, 15.5.11
	LengthRequired: 411, // RFC 9110, 15.5.12
	PreconditionFailed: 412, // RFC 9110, 15.5.13
	RequestEntityTooLarge: 413, // RFC 9110, 15.5.14
	RequestUriTooLong: 414, // RFC 9110, 15.5.15
	UnsupportedMediaType: 415, // RFC 9110, 15.5.16
	RequestedRangeNotSatisfiable: 416, // RFC 9110, 15.5.17
	ExpectationFailed: 417, // RFC 9110, 15.5.18
	Teapot: 418, // RFC 9110, 15.5.19 (Unused)
	MisdirectedRequest: 421, // RFC 9110, 15.5.20
	UnprocessableEntity: 422, // RFC 9110, 15.5.21
	Locked: 423, // RFC 4918, 11.3
	FailedDependency: 424, // RFC 4918, 11.4
	TooEarly: 425, // RFC 8470, 5.2.
	UpgradeRequired: 426, // RFC 9110, 15.5.22
	PreconditionRequired: 428, // RFC 6585, 3
	TooManyRequests: 429, // RFC 6585, 4
	RequestHeaderFieldsTooLarge: 431, // RFC 6585, 5
	UnavailableForLegalReasons: 451, // RFC 7725, 3

	InternalServerError: 500, // RFC 9110, 15.6.1
	NotImplemented: 501, // RFC 9110, 15.6.2
	BadGateway: 502, // RFC 9110, 15.6.3
	ServiceUnavailable: 503, // RFC 9110, 15.6.4
	GatewayTimeout: 504, // RFC 9110, 15.6.5
	HttpVersionNotSupported: 505, // RFC 9110, 15.6.6
	VariantAlsoNegotiates: 506, // RFC 2295, 8.1
	InsufficientStorage: 507, // RFC 4918, 11.5
	LoopDetected: 508, // RFC 5842, 7.2
	NotExtended: 510, // RFC 2774, 7
	NetworkAuthenticationRequired: 511, // RFC 6585, 6
} as const;


type ValueOf<T> = T[keyof T];

export const FieldViolation = z.object({
	field: z.string(),
	description: z.string(),
});
export type FieldViolation = z.infer<typeof FieldViolation>;

export const ErrorInfo = z.object({
	"@type": z.literal("ERROR_INFO"),
	reason: z.string(),
	metadata: z.record(z.string(), z.string()),
});
export type ErrorInfo = z.infer<typeof ErrorInfo>;

export function NewErrorInfo(reason: string, metadata: Record<string, string>) {
	return {
		"@type": "ERROR_INFO",
		reason,
		metadata,
	} satisfies ErrorInfo;
}

export const BadRequest = z.object({
	"@type": z.literal("BAD_REQUEST"),
	fieldViolations: z.array(FieldViolation),
});
export type BadRequest = z.infer<typeof BadRequest>;

export function NewBadRequest(violations: Array<FieldViolation>): BadRequest {
	return {
		"@type": "BAD_REQUEST",
		fieldViolations: violations,
	};
}

export const LocalizedMessage = z.object({
	"@type": z.literal("LOCALIZED_MESSAGE"),
	locale: z.string(),
	message: z.string(),
});
export type LocalizedMessage = z.infer<typeof LocalizedMessage>;

export const ErrorDetails = z.discriminatedUnion("@type", [
	ErrorInfo,
	BadRequest,
	LocalizedMessage,
]);
export type ErrorDetails = z.infer<typeof ErrorDetails>;


export const ErrorCode = {
	// The client specified an invalid argument regardless of the state of the system.
	InvalidArgument: "INVALID_ARGUMENT",
	// The operation was rejected because the system is not in a state required for the operation's execution.
	// For example, the directory to be deleted is non-empty, an rmdir operation is applied to a non-directory, etc.
	FailedPrecondition: "FAILED_PRECONDITION",
	// The requested entity was not found.
	NotFound: "NOT_FOUND",
	// The entity that a client tried to create already exists.
	AlreadyExists: "ALREADY_EXISTS",
	// The caller does not have valid authentication credentials for the operation.
	Unauthenticated: "UNAUTHENTICATED",
	// The caller does not have permission to execute the specified operation.
	PermissionDenied: "PERMISSION_DENIED",
	// The caller has exhausted their rate limit or quota
	TooManyRequests: "TOO_MANY_REQUESTS",
	// The part of the underlying system is broken
	Internal: "INTERNAL",
	// When the application doesn't know how to handle the caught error
	Unknown: "UNKNOWN",
	// The service is currently unavailable. Can be retried with a backoff.
	Unavailable: "UNAVAILABLE",
} as const;

const HttpStatusMap: Record<ValueOf<typeof ErrorCode>, number> = {
	INVALID_ARGUMENT: StatusCode.BadRequest,
	FAILED_PRECONDITION: StatusCode.BadRequest,
	NOT_FOUND: StatusCode.NotFound,
	ALREADY_EXISTS: StatusCode.Conflict,
	UNAUTHENTICATED: StatusCode.Unauthorized,
	PERMISSION_DENIED: StatusCode.Forbidden,
	TOO_MANY_REQUESTS: StatusCode.TooManyRequests,
	INTERNAL: StatusCode.InternalServerError,
	UNKNOWN: StatusCode.InternalServerError,
	UNAVAILABLE: StatusCode.ServiceUnavailable,
};

export class ApiError extends Error {
	public code: ValueOf<typeof ErrorCode>;
	public message: string;
	public details: Array<ErrorDetails>;

	public static schema = z.object({
		code: z.enum([
			"INVALID_ARGUMENT",
			"FAILED_PRECONDITION",
			"NOT_FOUND",
			"ALREADY_EXISTS",
			"UNAUTHENTICATED",
			"PERMISSION_DENIED",
			"TOO_MANY_REQUESTS",
			"INTERNAL",
			"UNKNOWN",
			"UNAVAILABLE",
		]),
		message: z.string(),
		details: z.array(ErrorDetails),
	});
	public static $type: z.infer<typeof ApiError.schema>;

	constructor(code: ValueOf<typeof ErrorCode>, message: string, details?: Array<ErrorDetails>) {
		super(message);
		this.code = code;
		this.message = message;
		this.details = details || [];
		this.name = "ApiError";

		if (typeof Error.captureStackTrace === "function" && Error.stackTraceLimit !== 0) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	toString() {
		return `${this.name}[${this.code}]: ${this.message}`;
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
		};
	}

	toResponse(init?: ResponseInit): Response {
		let err = this;
		let headers = new Headers(init?.headers);
		headers.set("Content-Type", "application/json; charset=utf-8");
		return new Response(JSON.stringify(err.toJSON()), {
			headers,
			status: HttpStatusMap[err.code],
		});
	}

	static from_response(resp: Response): ResultAsync<ApiError, Error> {
		return ResultAsync.fromPromise(
			resp.json(),
			(e) => new ErrResponseParse("JSON Error", { cause: e })
		).andThen((json) => {
			const parseResult = ApiError.schema.safeParse(json);

			if (!parseResult.success) {
				return err(new ErrResponseParse("ValidationError", { cause: parseResult.error }));
			}

			return ok(new ApiError(
				parseResult.data.code,
				parseResult.data.message,
				parseResult.data.details
			));
		});
	}
}

export class ErrResponseParse extends Error {}
ErrResponseParse.prototype.name = "ErrResponseParse";
