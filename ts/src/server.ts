import Fastify from "fastify";
import { pino } from "pino";
import { randomUUID } from "node:crypto";
import { ErrorCode, HTTP_STATUS_CODE } from "./errors/code.js";
import { ApiError, type BadRequest, type FieldViolation } from "./errors/error.js";
import type { FastifySchemaValidationError } from "fastify/types/schema.js";

function errSerializer(error: Error) {
	if (ApiError.is(error)) {
		return ApiError.serialize(error, "log")
	} else {
		return pino.stdSerializers.err(error);
	}
}

const logger = pino({
	level: "info",
	serializers: {
		err: errSerializer
	}
});

const app = Fastify({
	logger,
	genReqId(): string {
		return randomUUID();
	},
	ajv: {
		customOptions: {
			removeAdditional: "all",
			allErrors: true,
			coerceTypes: false
		},

	}
});

const petSchema = {
	$id: "users:pet",
	type: "object",
	properties: {
		name: {type: "string"},
		type: {type: "string"},
	},
	required: ["name", "type"],
};

app.addSchema(petSchema)

const userSchema = {
	type: "object",
	properties: {
		firstName: {type: "string"},
		lastName: {type: "string"},
		pets: {
			type: "array",
			items: { $ref: "users:pet#" },
			minItems: 1,
		}
	},
	required: ["firstName", "lastName", "pets"],
};

app.register(async function userRoute(fastify) {
	fastify.route({
		method: "GET",
		url: "/users/:id",
		handler: async function retrieveUser(request, reply) {
			const { id } = request.params as any;

			throw new ApiError(ErrorCode.NOT_FOUND, "The user not found")
		}
	});

	fastify.route({
		method: "POST",
		url: "/users",
		schema: {
			body: userSchema,
		},
		handler: async function createUser(request, response) {
			request.log.info(request.body, "creating user %s", (request.body as any).firstName)
		}
	});
});

app.register(async function rootRoute(fastify) {
	fastify.route({
		method: "GET",
		url: "/ping",
		handler: async function ping() {
			return "pong";
		}
	});

	fastify.route({
		method: "POST",
		url: "/throw",
		handler: async function throwHandler(request) {
			const { code = ErrorCode.UNKNOWN, msg = "Unknown error" } = request.query as any;

			throw new ApiError(code, msg);
		}
	})
});

app.setErrorHandler(async function (error, request, reply) {
	if (ApiError.is(error)) {
		const statusCode = HTTP_STATUS_CODE[error.code];
		console.log({ statusCode });
		const json = ApiError.serialize(error, "json");
		reply.log.error(
			{ req: request, res: reply, err: json },
			error && error.message
		)
		reply
			.code(statusCode)
			.header("Content-Type", "application/json")

		return json;
	} else {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else if (typeof error === "string") {
			message = error;
		} else {
			message = "Unknown"
		}

		reply.log.error(
			{ req: request, res: reply, err: error},
			message,
		)

		const err = new ApiError(ErrorCode.UNKNOWN, "Unknown");

		reply
			.code(HTTP_STATUS_CODE[err.code])
			.header("Content-Type", "application/json");

		return ApiError.serialize(err, "json");
	}
});

/**
 *
 * export interface FastifySchemaValidationError {
 *   keyword: string;
 *   instancePath: string;
 *   schemaPath: string;
 *   params: Record<string, unknown>;
 *   message?: string;
 * }
 */

function transformAjvErrors(errors: FastifySchemaValidationError[]): BadRequest {
	const fieldViolations: FieldViolation[] = errors.map(error => {
		return {
			field: error.instancePath.substring(1).replace(/\/(\d+)\//g, '[$1].'), // remove the leading slash
			description: error.message || '',
		};
	});

	return {
		__type: "BadRequest",
		fieldViolations,
	};
}

app.setSchemaErrorFormatter(function fmt(errors, data) {
	console.dir({ errors }, { depth: null });
	return new ApiError(ErrorCode.INVALID_ARGUMENT, "Validation failed", [
		transformAjvErrors(errors),
	]);
})

const port = 3000;
const host = "::1";

app.listen({
	port,
	host,
}, (err ) => {
	if (err) {
		logger.error(err);
		process.exit(1);
	}
});
