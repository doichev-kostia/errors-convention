export class FormValidationError extends Error {
	public formErrors: string[];
	public fieldErrors: Record<string, string[]>;

	constructor(formErrors: string[], fieldErrors: Record<string, string[]>) {
		super("FormValidationError");
		this.name = "FormValidationError";

		this.formErrors = formErrors;
		this.fieldErrors = fieldErrors;
	}

	toString() {
		let fields = Object.entries(this.fieldErrors).map(([field, errors]) => `${field}: ${errors.join(", ")}`).join("; ");
		return `FormValidationError: ${this.formErrors.join(", ")}; Fields: ${fields}`;
	}
}

