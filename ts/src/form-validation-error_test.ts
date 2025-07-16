import { test } from "node:test";
import * as assert from "node:assert";
import { FormValidationError } from "./form-validation-error.js";

test("Form Validation Error Usage", function formValidationErrorUsage() {
	let formValidationError = new FormValidationError(["Invalid Data"], {
		"email": ["required"],
		"password": ["minimum length is 8 characters"]
	})
	let fieldErrors = new Map<string, string>();

	let formError = "";
	if (formValidationError) {
		formError = formValidationError.formErrors.join("; ")

		for (const [k, v] of Object.entries(formValidationError.fieldErrors)) {
			if (v) {
				fieldErrors.set(k, v.join("; "));
			}
		}
	}

	assert.equal(formError, "Invalid Data", "form_error_mismatch");
	assert.equal(fieldErrors.get("email"), "required", "email_field_error_mismatch");
	assert.equal(fieldErrors.get("password"), "minimum length is 8 characters", "password_field_error_mismatch");
});
