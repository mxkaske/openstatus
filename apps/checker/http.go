package checker

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptrace"
	"net/url"
	"time"

	"github.com/openstatushq/openstatus/apps/checker/request"
	"github.com/rs/zerolog/log"
)

type Timing struct {
	DnsStart          int64 `json:"dnsStart"`
	DnsDone           int64 `json:"dnsDone"`
	ConnectStart      int64 `json:"connectStart"`
	ConnectDone       int64 `json:"connectDone"`
	TlsHandshakeStart int64 `json:"tlsHandshakeStart"`
	TlsHandshakeDone  int64 `json:"tlsHandshakeDone"`
	FirstByteStart    int64 `json:"firstByteStart"`
	FirstByteDone     int64 `json:"firstByteDone"`
	TransferStart     int64 `json:"transferStart"`
	TransferDone      int64 `json:"transferDone"`
}

type Response struct {
	Headers   map[string]string `json:"headers,omitempty"`
	Body      string            `json:"body,omitempty"`
	Error     string            `json:"error,omitempty"`
	Latency   int64             `json:"latency"`
	Timestamp int64             `json:"timestamp"`
	Status    int               `json:"status,omitempty"`
	Timing    Timing            `json:"timing"`
}

// FIXME: This should only return the TCP Timing Data;
func Http(ctx context.Context, client *http.Client, inputData request.HttpCheckerRequest) (Response, error) {
	logger := log.Ctx(ctx).With().Str("monitor", inputData.URL).Logger()
	req, err := http.NewRequestWithContext(ctx, inputData.Method, inputData.URL, bytes.NewReader([]byte(inputData.Body)))
	if err != nil {
		logger.Error().Err(err).Msg("error while creating req")
		return Response{}, fmt.Errorf("unable to create req: %w", err)
	}
	req.Header.Set("User-Agent", "OpenStatus/1.0")
	for _, header := range inputData.Headers {
		if header.Key != "" {
			req.Header.Set(header.Key, header.Value)
		}
	}
	if inputData.Method != http.MethodGet {
		req.Header.Set("Content-Type", "application/json")
	}

	timing := Timing{}

	trace := &httptrace.ClientTrace{
		DNSStart:          func(_ httptrace.DNSStartInfo) { timing.DnsStart = time.Now().UTC().UnixMilli() },
		DNSDone:           func(_ httptrace.DNSDoneInfo) { timing.DnsDone = time.Now().UTC().UnixMilli() },
		ConnectStart:      func(_, _ string) { timing.ConnectStart = time.Now().UTC().UnixMilli() },
		ConnectDone:       func(_, _ string, _ error) { timing.ConnectDone = time.Now().UTC().UnixMilli() },
		TLSHandshakeStart: func() { timing.TlsHandshakeStart = time.Now().UTC().UnixMilli() },
		TLSHandshakeDone:  func(_ tls.ConnectionState, _ error) { timing.TlsHandshakeDone = time.Now().UTC().UnixMilli() },
		GotConn: func(_ httptrace.GotConnInfo) {
			timing.FirstByteStart = time.Now().UTC().UnixMilli()
		},
		GotFirstResponseByte: func() {
			timing.FirstByteDone = time.Now().UTC().UnixMilli()
			timing.TransferStart = time.Now().UTC().UnixMilli()
		},
	}

	req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))

	start := time.Now()

	response, err := client.Do(req)
	timing.TransferDone = time.Now().UTC().UnixMilli()
	latency := time.Since(start).Milliseconds()
	if err != nil {

		var urlErr *url.Error
		if errors.As(err, &urlErr) && urlErr.Timeout() {
			return Response{
				Latency:   latency,
				Timing:    timing,
				Timestamp: start.UTC().UnixMilli(),
				Error:     fmt.Sprintf("Timeout after %d ms", latency),
			}, nil
		}

		logger.Error().Err(err).Msg("error while pinging")

		return Response{}, fmt.Errorf("error with monitorURL %s: %w", inputData.URL, err)
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return Response{
			Latency:   latency,
			Timing:    timing,
			Timestamp: start.UTC().UnixMilli(),
			Error:     fmt.Sprintf("Cannot read response body: %s", err.Error()),
		}, fmt.Errorf("error with monitorURL %s: %w", inputData.URL, err)
	}

	headers := make(map[string]string)
	for key := range response.Header {
		headers[key] = response.Header.Get(key)
	}

	return Response{
		Timestamp: start.UTC().UnixMilli(),
		Status:    response.StatusCode,
		Headers:   headers,
		Timing:    timing,
		Latency:   latency,
		Body:      string(body),
	}, nil

}
