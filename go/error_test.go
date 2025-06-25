package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestError_Specification(t *testing.T) {
	t.Run("Internal Error", func(t *testing.T) {
		internalError := NewApiError(ErrorInternal, "internal error", nil)
		rcrd := httptest.NewRecorder()
		err := internalError.WriteHTTPResponse(rcrd)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		resp := rcrd.Result()
		if resp.StatusCode != http.StatusInternalServerError {
			t.Errorf("expected status code %d, got %d", http.StatusInternalServerError, resp.StatusCode)
		}
		if !strings.Contains(resp.Header.Get("Content-Type"), "application/json") {
			t.Errorf("expected Content-Type 'application/json', got '%s'", resp.Header.Get("Content-Type"))
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("failed to read response body: %v", err)
		}
		resp.Body.Close()
		snapshot := `{"code":"INTERNAL","message":"internal error","details":[]}`
		bodyTxt := strings.TrimSpace(string(body))
		if bodyTxt != snapshot {
			t.Errorf("expected body %s, got %s", snapshot, bodyTxt)
		}
	})

	t.Run("Error Info", func(t *testing.T) {
		metadata := make(map[string]any)
		metadata["resource"] = "projects/123"
		errorInfo := NewErrorInfo("API_DISABLED", metadata)
		internalError := NewApiError(ErrorFailedPrecondition, "the projects's api is disabled", []ErrorDetail{errorInfo})
		rcrd := httptest.NewRecorder()
		err := internalError.WriteHTTPResponse(rcrd)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		resp := rcrd.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
		}
		if !strings.Contains(resp.Header.Get("Content-Type"), "application/json") {
			t.Errorf("expected Content-Type 'application/json', got '%s'", resp.Header.Get("Content-Type"))
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("failed to read response body: %v", err)
		}
		resp.Body.Close()
		snapshot := `{"code":"FAILED_PRECONDITION","message":"the projects's api is disabled","details":[{"@type":"ERROR_INFO","reason":"API_DISABLED","metadata":{"resource":"projects/123"}}]}`
		bodyTxt := strings.TrimSpace(string(body))
		if bodyTxt != snapshot {
			t.Errorf("expected body %s, got %s", snapshot, bodyTxt)
		}
	})

	t.Run("Bad Request", func(t *testing.T) {
		fieldViolations := []FieldViolation{
			{
				Field:       "email",
				Description: "must be a valid email address",
			},
			{
				Field:       "password",
				Description: "must be at least 8 characters long",
			},
		}
		badRequest := NewBadRequest(fieldViolations)
		apiError := NewApiError(ErrorInvalidArgument, "invalid input parameters", []ErrorDetail{badRequest})
		rcrd := httptest.NewRecorder()
		err := apiError.WriteHTTPResponse(rcrd)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		resp := rcrd.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
		}
		if !strings.Contains(resp.Header.Get("Content-Type"), "application/json") {
			t.Errorf("expected Content-Type 'application/json', got '%s'", resp.Header.Get("Content-Type"))
		}
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("failed to read response body: %v", err)
		}
		resp.Body.Close()
		snapshot := `{"code":"INVALID_ARGUMENT","message":"invalid input parameters","details":[{"@type":"BAD_REQUEST","fieldViolations":[{"field":"email","description":"must be a valid email address"},{"field":"password","description":"must be at least 8 characters long"}]}]}`
		bodyTxt := strings.TrimSpace(string(body))
		if bodyTxt != snapshot {
			t.Errorf("expected body %s, got %s", snapshot, bodyTxt)
		}
	})
}
