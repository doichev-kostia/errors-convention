import type { ValueOf } from "../types.js";
import type { ErrorCode } from "./code.js";
import { errWithCause } from "pino-std-serializers";

const errorType = Symbol("ApiError");

export type ErrorInfo = {
	__type: "ErrorInfo",
	reason: string;
	metadata: Record<string, any>;
}

export type FieldViolation = {
	field: string;
	description: string;
}

export type BadRequest = {
	__type: "BadRequest";
	fieldViolations: FieldViolation[];
}

export type LocalizedMessage = {
	__type: "LocalizedMessage";
	locale: string;
	message: string;
}

export class ApiError extends Error {
	code: ValueOf<typeof ErrorCode>;
	message: string;
	details?: (ErrorInfo | BadRequest | LocalizedMessage)[]
	cause?: unknown;

	type = errorType

	constructor(code: ValueOf<typeof ErrorCode>, message: string, details?: (ErrorInfo | BadRequest | LocalizedMessage)[], cause?: unknown) {
		super();
		this.name = "ApiError";
		this.message = message;
		this.code = code;
		this.details = details ?? [];
		this.cause = cause;


		if (typeof Error.captureStackTrace === "function" && Error.stackTraceLimit !== 0) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	toString() {
		return `${this.name}[${this.code}]: ${this.message}`;
	}

	static serialize(error: ApiError, to?: 'json' | 'log' ) {
		if (to === 'json') {
			return {
				code: error.code,
				message: error.message,
				details: error.details,
			}
		} else if (to === 'log') {
			return errWithCause(error);
		} else {
			return error.toString()
		}
	}


	static is(error: unknown): error is ApiError {
		if (typeof error !== "object" || error == null) {
			return false;
		}

		return Reflect.get(error, 'type') === errorType;
	}
}
