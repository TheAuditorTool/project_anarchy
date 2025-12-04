// Package api - Router setup for the notification service
package api

import (
	"github.com/gorilla/mux"
)

// NewRouter creates and configures the HTTP router
func NewRouter(h *Handlers, apiKey string) *mux.Router {
	r := mux.NewRouter()

	// Apply global middleware
	r.Use(LoggingMiddleware)
	r.Use(CORSMiddleware)
	r.Use(RecoveryMiddleware)

	// Public endpoints (no auth required)
	r.HandleFunc("/api/health", h.HealthCheck).Methods("GET")
	r.HandleFunc("/api/debug", h.DebugRequest).Methods("GET", "POST")

	// Callback endpoint (signature verified separately)
	r.HandleFunc("/api/callback/{id}", h.ProcessCallback).Methods("POST")

	// Protected API routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(APIKeyMiddleware(apiKey))

	// Notification endpoints
	api.HandleFunc("/notify", h.SendNotification).Methods("POST")
	api.HandleFunc("/notify/batch", h.SendBatchNotification).Methods("POST")
	api.HandleFunc("/notify/template", h.SendTemplatedNotification).Methods("POST")

	// Query endpoints
	api.HandleFunc("/notifications", h.ListNotifications).Methods("GET")
	api.HandleFunc("/notifications/search", h.SearchNotifications).Methods("GET")
	api.HandleFunc("/notifications/export", h.ExportNotifications).Methods("GET")

	// Webhook testing
	api.HandleFunc("/webhook/test", h.TestWebhook).Methods("POST")

	// Hook execution
	api.HandleFunc("/hooks/execute", h.ExecuteHook).Methods("POST")

	// Log access
	api.HandleFunc("/logs/{filename}", h.ReadLogFile).Methods("GET")

	// Config management
	api.HandleFunc("/config/import", h.ImportConfig).Methods("POST")

	// Proxy endpoint
	api.HandleFunc("/proxy", h.ProxyRequest).Methods("GET", "POST")

	return r
}
