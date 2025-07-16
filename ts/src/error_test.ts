import { test } from "node:test";
import * as assert from "node:assert";
import {
	ApiError,
	type BadRequest,
	ErrorCode,
	type FieldViolation,
	NewBadRequest,
	NewErrorInfo,
	StatusCode
} from "./error.js";
import { z } from "zod";
import { apiErrorFromZodError } from "./transformers.js";

test("Internal Error", async function internalErrorTest() {
	let err = new ApiError(ErrorCode.Internal, "internal error");
	let resp = err.toResponse();

	assert.equal(resp.status, StatusCode.InternalServerError, `internal_error_test.status_code_mismatch`);
	assert.ok(resp.headers.has("Content-Type"), `internal_error_test.content_type_header_missing`);
	assert.ok(resp.headers.get("Content-Type")!.includes("application/json"), `internal_error_test.content_type_header_invalid got=${resp.headers.get("Content-Type")}`);

	let body = await resp.text().then(s => s.trim());
	let snapshot = `{"code":"INTERNAL","message":"internal error","details":[]}`;
	assert.equal(body, snapshot, `internal_error_test.body_mismatch expected=${snapshot} got=${body}`);
});

test("Error Info", async function errorInfoTest() {
	let metadata: Record<string, string> = {
		"resource": "projects/123",
	};
	let errorInfo = NewErrorInfo("API_DISABLED", metadata);
	let internalError = new ApiError(ErrorCode.FailedPrecondition, "the project's api is disabled", [errorInfo]);
	let resp = internalError.toResponse();

	assert.equal(resp.status, StatusCode.BadRequest, `error_info_test.status_code_mismatch`);
	assert.ok(resp.headers.has("Content-Type"), `error_info_test.content_type_header_missing`);
	assert.ok(resp.headers.get("Content-Type")!.includes("application/json"), `error_info_test.content_type_header_invalid got=${resp.headers.get("Content-Type")}`);

	let body = await resp.text().then(s => s.trim());
	let snapshot = `{"code":"FAILED_PRECONDITION","message":"the project's api is disabled","details":[{"@type":"ERROR_INFO","reason":"API_DISABLED","metadata":{"resource":"projects/123"}}]}`;
	assert.equal(body, snapshot, `error_info_test.body_mismatch expected=${snapshot} got=${body}`);
});

test("Bad Request", async function badRequestTest() {
	let fieldViolations: Array<FieldViolation> = [
		{
			field: "email",
			description: "must be a valid email address"
		},
		{
			field: "password",
			description: "must be at least 8 characters long"
		}
	];
	let badRequest = NewBadRequest(fieldViolations);
	let apiError = new ApiError(ErrorCode.InvalidArgument, "invalid input parameters", [badRequest]);
	let resp = apiError.toResponse();

	assert.equal(resp.status, StatusCode.BadRequest, `bad_request_test.status_code_mismatch`);
	assert.ok(resp.headers.has("Content-Type"), `bad_request_test.content_type_header_missing`);
	assert.ok(resp.headers.get("Content-Type")!.includes("application/json"), `bad_request_test.content_type_header_invalid got=${resp.headers.get("Content-Type")}`);

	let body = await resp.text().then(s => s.trim());
	let snapshot = `{"code":"INVALID_ARGUMENT","message":"invalid input parameters","details":[{"@type":"BAD_REQUEST","fieldViolations":[{"field":"email","description":"must be a valid email address"},{"field":"password","description":"must be at least 8 characters long"}]}]}`;
	assert.equal(body, snapshot, `bad_request_test.body_mismatch expected=${snapshot} got=${body}`);
});

test("Error from response", async function errorFromResponseTest() {
	let snapshot = `{"code":"INVALID_ARGUMENT","message":"invalid input parameters","details":[{"@type":"BAD_REQUEST","fieldViolations":[{"field":"email","description":"must be a valid email address"},{"field":"password","description":"must be at least 8 characters long"}]}]}`;
	let response = new Response(snapshot, {
		status: StatusCode.BadRequest,
		headers: {
			"Content-Type": "application/json; charset=utf-8"
		}
	});

	let parseRes = await ApiError.from_response(response);
	if (parseRes.isErr()) {
		assert.fail(`error_from_response_test.parse_failed: ${parseRes.error.message}`);
	}

	const apiErr = parseRes.value;
	assert.equal(apiErr.code, ErrorCode.InvalidArgument, `error_from_response_test.code_mismatch expected=INVALID_ARGUMENT got=${apiErr.code}`);
	assert.equal(apiErr.message, "invalid input parameters", `error_from_response_test.message_mismatch expected="invalid input parameters" got="${apiErr.message}"`);
	assert.equal(apiErr.details.length, 1, `error_from_response_test.details_length_mismatch expected=1 got=${apiErr.details.length}`);
	let badRequest = apiErr.details[0];
	assert.equal(badRequest["@type"], "BAD_REQUEST", `error_from_response_test.bad_request_type_mismatch expected=BAD_REQUEST got=${badRequest["@type"]}`);
	badRequest = badRequest as BadRequest;

	assert.equal(badRequest.fieldViolations.length, 2, `error_from_response_test.field_violations_length_mismatch expected=2 got=${badRequest.fieldViolations.length}`);
	assert.equal(badRequest.fieldViolations[0].field, "email", `error_from_response_test.field_violations[0].field_mismatch expected=email got=${badRequest.fieldViolations[0].field}`);
	assert.equal(badRequest.fieldViolations[0].description, "must be a valid email address", `error_from_response_test.field_violations[0].description_mismatch expected="must be a valid email address" got="${badRequest.fieldViolations[0].description}"`);
});

test("Error from zod error", async function errorFromZodErrorTest() {
	let schema = z.object({
		email: z.string(),
		password: z.string().min(8)
	});
	let parseResult = schema.safeParse({
		password: "1",
	});
	assert.ok(!parseResult.success, `error_from_zod_error_test.parse_success expected=false`);

	let apiErr = apiErrorFromZodError(parseResult.error);
	assert.equal(apiErr.code, ErrorCode.InvalidArgument, `error_from_zod_error_test.code_mismatch expected=INVALID_ARGUMENT got=${apiErr.code}`);
	let details = apiErr.details[0];
	assert.equal(details["@type"], "BAD_REQUEST", `error_from_zod_error_test.details_type_mismatch expected=BAD_REQUEST got=${details["@type"]}`);
	let badRequest = details as BadRequest;
	assert.equal(badRequest.fieldViolations.length, 2, `error_from_zod_error_test.field_violations_length_mismatch expected=2 got=${badRequest.fieldViolations.length}`);
	assert.equal(badRequest.fieldViolations[0].field, "email", `error_from_zod_error_test.field_violations[0].field_mismatch expected=email got=${badRequest.fieldViolations[0].field}`);
	assert.equal(badRequest.fieldViolations[1].field, "password", `error_from_zod_error_test.field_violations[1].field_mismatch expected=password got=${badRequest.fieldViolations[1].field}`);
})
