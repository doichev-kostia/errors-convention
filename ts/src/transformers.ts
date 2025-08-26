import { ApiError, type BadRequest, ErrorCode, type FieldViolation, NewBadRequest } from "./error.js";
import { FormValidationError } from "./form-validation-error.js";
import type { ZodError } from "zod";
import { flattenError } from "zod";

export function formValidationErrorFromApiError(err: ApiError): FormValidationError {
	let fieldErrors: Record<string, string[]> = {};
	let formErrors: string[] = [];

	formErrors.push(`${err.code}: ${err.message}`);

	for (const d of err.details) {
		if (d["@type"] == "BAD_REQUEST") {
			let badRequest = d as BadRequest;
			for (const violation of badRequest.fieldViolations) {
				fieldErrors[violation.field] = [violation.description];
			}
		}
	}

	return new FormValidationError(formErrors, fieldErrors);
}

export function formValidationErrorFromZodError(err: ZodError): FormValidationError {
	let flat = flattenError(err);
	return new FormValidationError(flat.formErrors, flat.fieldErrors);
}

export function apiErrorFromZodError(err: ZodError): ApiError {
	let msg = "Validation Error";
	let violations = new Map<string, string>();
	for (let issue of err.issues) {
		if (issue.path.length > 0) {
			let key = issue.path.join(".");
			console.log({key, description: issue.message });

			let existing = violations.get(key);
			if (existing != null) {
				violations.set(key, existing + "; " + issue.message);
			} else {
				violations.set(key, issue.message);
			}
		} else {
			msg += ": " + issue.message;
		}
	}
	let fieldViolations: FieldViolation[] = [];

	for (const [k, v] of violations.entries()) {
		fieldViolations.push({
			field: k,
			description: v,
		});
	}

	return new ApiError(ErrorCode.InvalidArgument, msg, [NewBadRequest(fieldViolations)])
}
