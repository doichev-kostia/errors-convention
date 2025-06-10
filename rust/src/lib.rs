use axum::{http, Json};

#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    /// The client specified an invalid argument regardless of the state of the system.
    #[error("INVALID_ARGUMENT")]
    InvalidArgument,
    /// The operation was rejected because the system is not in a state required for the operation's execution.
    /// For example, the directory to be deleted is non-empty, an rmdir operation is applied to a non-directory, etc.
    #[error("FAILED_PRECONDITION")]
    FailedPrecondition,
    /// The requested entity was not found.
    #[error("NOT_FOUND")]
    NotFound,
    /// The entity that a client tried to create already exists.
    #[error("ALREADY_EXISTS")]
    AlreadyExists,
    /// The caller does not have valid authentication credentials for the operation.
    #[error("UNAUTHENTICATED")]
    Unauthenticated,
    /// The caller does not have permission to execute the specified operation.
    #[error("PERMISSION_DENIED")]
    PermissionDenied,
    /// The caller has exhausted their rate limit or quota
    #[error("TOO_MANY_REQUESTS")]
    TooManyRequests,
    /// The part of the underlying system is broken
    #[error("INTERNAL")]
    Internal,
    /// When the application doesn't know how to handle the caught error
    #[error("UNKNOWN")]
    Unknown,
    /// The service is currently unavailable. Can be retried with a backoff.
    #[error("UNAVAILABLE")]
    Unavailable,
}

impl ErrorCode {
    pub fn get_http_code(&self) -> http::StatusCode {
        match self {
            ErrorCode::InvalidArgument => http::StatusCode::BAD_REQUEST,
            ErrorCode::FailedPrecondition => http::StatusCode::BAD_REQUEST,
            ErrorCode::NotFound => http::StatusCode::NOT_FOUND,
            ErrorCode::AlreadyExists => http::StatusCode::CONFLICT,
            ErrorCode::Unauthenticated => http::StatusCode::UNAUTHORIZED,
            ErrorCode::PermissionDenied => http::StatusCode::FORBIDDEN,
            ErrorCode::TooManyRequests => http::StatusCode::TOO_MANY_REQUESTS,
            ErrorCode::Internal => http::StatusCode::INTERNAL_SERVER_ERROR,
            ErrorCode::Unknown => http::StatusCode::INTERNAL_SERVER_ERROR,
            ErrorCode::Unavailable => http::StatusCode::SERVICE_UNAVAILABLE,
        }
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FieldViolation {
    field: String,
    description: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "@type")]
pub enum ErrorDetails {
    ErrorInfo { reason: String, metadata: std::collections::HashMap<String, String>},
    BadRequest { field_violations: Vec<FieldViolation> },
    LocalizedMessage { locale: String, message: String }
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ApiError {
    pub code: ErrorCode,
    /// developer-facing, human-readable "debug message" which should be in English.
    /// localized messages are expressed using a LocalizedMessage within the details field.
    /// any dynamic aspects of the message must be included as metadata within the ErrorInfo that appears in details.
    pub message: String,
    /// the field allows messages with additional error information to be included in the error response
    pub details: Vec<ErrorDetails>,
}

impl ApiError {
    pub fn new<S: Into<String>>(code: ErrorCode, message: S) -> Self {
        Self {
            code,
            message: message.into(),
            details: Vec::new(),
        }
    }

    pub fn with_details<S: Into<String>>(code: ErrorCode, message: S, details: Vec<ErrorDetails>) -> Self {
        Self {
            code,
            message: message.into(),
            details,
        }
    }
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "ApiError {{ code: {:?}, message: {:?}, details: {:?} }}", self.code, self.message, self.details)
    }
}

impl std::error::Error for ApiError {}

impl axum::response::IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let status = self.code.get_http_code();

        (status, Json(self)).into_response()
    }
}
