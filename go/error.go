package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// Inspired by https://google.aip.dev/193

type ErrorCode string

const (
	// ErrorInvalidArgument - The client specified an invalid argument regardless of the state of the system.
	ErrorInvalidArgument ErrorCode = "INVALID_ARGUMENT"
	// ErrorFailedPrecondition - The operation was rejected because the system is not in a state required for the operation's execution.
	// For example, the directory to be deleted is non-empty, an rmdir operation is applied to a non-directory, etc.
	ErrorFailedPrecondition ErrorCode = "FAILED_PRECONDITION"
	// ErrorNotFound - The requested entity was not found.
	ErrorNotFound ErrorCode = "NOT_FOUND"
	// ErrorAlreadyExists - The entity that a client tried to create already exists.
	ErrorAlreadyExists ErrorCode = "ALREADY_EXISTS"
	// ErrorUnauthenticated - The caller does not have valid authentication credentials for the operation.
	ErrorUnauthenticated ErrorCode = "UNAUTHENTICATED"
	// ErrorPermissionDenied - The caller does not have permission to execute the specified operation.
	ErrorPermissionDenied ErrorCode = "PERMISSION_DENIED"
	// ErrorTooManyRequests - The caller has exhausted their rate limit or quota
	ErrorTooManyRequests ErrorCode = "TOO_MANY_REQUESTS"
	// ErrorInternal - The part of the underlying system is broken
	ErrorInternal ErrorCode = "INTERNAL"
	// ErrorUnknown - When the application doesn't know how to handle the caught error
	ErrorUnknown ErrorCode = "UNKNOWN"
	// ErrorUnavailable - The service is currently unavailable. Can be retried with a backoff.
	ErrorUnavailable ErrorCode = "UNAVAILABLE"
)

var StatusCodeMap = map[ErrorCode]int{
	ErrorInvalidArgument:    http.StatusBadRequest,
	ErrorFailedPrecondition: http.StatusBadRequest,
	ErrorNotFound:           http.StatusNotFound,
	ErrorAlreadyExists:      http.StatusConflict,
	ErrorUnauthenticated:    http.StatusUnauthorized,
	ErrorPermissionDenied:   http.StatusForbidden,
	ErrorTooManyRequests:    http.StatusTooManyRequests,
	ErrorInternal:           http.StatusInternalServerError,
	ErrorUnknown:            http.StatusInternalServerError,
	ErrorUnavailable:        http.StatusServiceUnavailable,
}

func (e ErrorCode) String() string {
	return string(e)
}

type ErrorDetail any

// ApiError represents the main API error structure
type ApiError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	// Details provide more context to an error. The predefined structs are ErrorInfo | BadRequest | LocalizedMessage
	Details []ErrorDetail `json:"details"`
}

// NewApiError constructs the Error with details being ErrorInfo | BadRequest | LocalizedMessage
func NewApiError(status ErrorCode, err string, details []ErrorDetail) ApiError {
	if details == nil {
		details = make([]ErrorDetail, 0)
	}
	return ApiError{
		status,
		err,
		details,
	}
}

func (e ApiError) Error() string {
	return fmt.Sprintf("ApiError { code: %s, message: %s, details: %+v }", e.Code, e.Message, e.Details)
}

// The ErrorInfo message is the primary way to send a __machine-readable__ identifier. Contextual information should be included in metadata in ErrorInfo and must be included if it appears within an error message.
type ErrorInfo struct {
	Type string `json:"@type"`
	// The Reason field is a short snake_case description of the cause of the error. Error reasons are unique within a particular domain of errors. The reason must match a regular expression of [A-Z][A-Z0-9_]+[A-Z0-9]. (This is UPPER_SNAKE_CASE, without leading or trailing underscores, and without leading digits.)
	// The reason should be terse, but meaningful enough for a human reader to understand what the reason refers to.
	//
	//Good examples:
	//
	//    CPU_AVAILABILITY
	//    NO_STOCK
	//    CHECKED_OUT
	//    AVAILABILITY_ERROR
	//
	//Bad examples:
	//
	//    THE_BOOK_YOU_WANT_IS_NOT_AVAILABLE (overly verbose)
	//    ERROR (too general)
	Reason string `json:"reason"`
	// The Metadata field is a map of key/value pairs providing additional dynamic information as context.
	// Each __key__ within metadata must conform to the regular expression [a-z][a-zA-Z0-9-_]+.
	// The ErrorInfo.metadata map for the same error could be:
	//
	//    "zone": "us-east1-a"
	//    "vmType": "e2-medium"
	//    "attachment": "local-ssd=3,nvidia-t4=2"
	//    "zonesWithCapacity": "us-central1-f,us-central1-c"
	Metadata map[string]interface{} `json:"metadata"`
}

func NewErrorInfo(reason string, metadata map[string]any) ErrorInfo {
	return ErrorInfo{
		Type:     "ERROR_INFO",
		Reason:   reason,
		Metadata: metadata,
	}
}

type FieldViolation struct {
	// A path that leads to a field in the request body. The value will be a
	// sequence of dot-separated identifiers that identify a field.
	//
	// Consider the following:
	//
	//     message CreateContactRequest {
	//       message EmailAddress {
	//         enum Type {
	//           TYPE_UNSPECIFIED = 0;
	//           HOME = 1;
	//           WORK = 2;
	//         }
	//
	//         optional string email = 1;
	//         repeated EmailType type = 2;
	//       }
	//
	//       string full_name = 1;
	//       repeated EmailAddress email_addresses = 2;
	//     }
	//
	// In this example, in proto `field` could take one of the following values:
	//
	// * `full_name` for a violation in the `full_name` value
	// * `email_addresses[1].email` for a violation in the `email` field of the
	//   first `email_addresses` message
	// * `email_addresses[3].type[2]` for a violation in the second `type`
	//   value in the third `email_addresses` message.
	//
	// In JSON, the same values are represented as:
	//
	// * `fullName` for a violation in the `fullName` value
	// * `emailAddresses[1].email` for a violation in the `email` field of the
	//   first `emailAddresses` message
	// * `emailAddresses[3].type[2]` for a violation in the second `type`
	//   value in the third `emailAddresses` message.
	Field string `json:"field"`
	// A description of why the request element is bad.
	Description string `json:"description"`
}

// BadRequest describes violations in a client request. This error type focuses on the
// syntactic aspects of the request.
type BadRequest struct {
	Type            string           `json:"@type"`
	FieldViolations []FieldViolation `json:"fieldViolations"`
}

func NewBadRequest(violations []FieldViolation) BadRequest {
	return BadRequest{
		Type:            "BAD_REQUEST",
		FieldViolations: violations,
	}
}

// LocalizedMessage used to provide an error message which should be localized to a user-specified locale where possible.
type LocalizedMessage struct {
	Type string `json:"@type"`
	// The Locale field specifies the locale of the message, following [IETF bcp47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt) (Tags for Identifying Languages). Example values: "en-US", "fr-CH", "es-MX".
	Locale string `json:"locale"`
	// The Message field contains the localized text itself. This should include a brief description of the error and a call to action to resolve the error. The message should include contextual information to make the message as specific as possible. Any contextual information in the message must be included in ErrorInfo metadata.
	Message string `json:"message"`
}

func NewLocalizedMessage(locale, message string) LocalizedMessage {
	return LocalizedMessage{
		Type:    "LOCALIZED_MESSAGE",
		Locale:  locale,
		Message: message,
	}
}

// WriteHTTPResponse writes the ApiError as an HTTP response
func (e ApiError) WriteHTTPResponse(w http.ResponseWriter) error {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(StatusCodeMap[e.Code])
	return json.NewEncoder(w).Encode(e)
}
