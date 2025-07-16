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
	let flat = flattenError(err)
	let msg = "Validation Error";
	if (flat.formErrors.length > 0) {
		msg += ": " + flat.formErrors.join("; ")
	}
	let fieldViolations: FieldViolation[] = [];

	for (const [k, v] of Object.entries(flat.fieldErrors)) {
		let description = ((v || []) as Array<string>).join("; ");
		fieldViolations.push({
			field: k,
			description,
		} satisfies FieldViolation);
	}

	return new ApiError(ErrorCode.InvalidArgument, msg, [NewBadRequest(fieldViolations)])
}
