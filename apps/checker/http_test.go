package checker_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/openstatushq/openstatus/apps/checker"
	"github.com/openstatushq/openstatus/apps/checker/request"
)

func Test_ping(t *testing.T) {
	type args struct {
		client    *http.Client
		inputData request.HttpCheckerRequest
	}
	tests := []struct {
		name    string
		args    args
		want    checker.PingData
		wantErr bool
	}{
		{name: "200", args: args{client: &http.Client{}, inputData: request.HttpCheckerRequest{URL: "https://openstat.us", CronTimestamp: 1, Headers: []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		}{{Key: "", Value: ""}}}}, want: checker.PingData{URL: "https://openstat.us", StatusCode: 200}, wantErr: false},
		{name: "200", args: args{client: &http.Client{}, inputData: request.HttpCheckerRequest{URL: "https://openstat.us", CronTimestamp: 1, Headers: []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		}{{Key: "Test", Value: ""}}}}, want: checker.PingData{URL: "https://openstat.us", StatusCode: 200}, wantErr: false},
		{name: "500", args: args{client: &http.Client{}, inputData: request.HttpCheckerRequest{URL: "https://openstat.us/500", CronTimestamp: 1}}, want: checker.PingData{URL: "https://openstat.us/500", StatusCode: 500}, wantErr: false},
		{name: "500", args: args{client: &http.Client{}, inputData: request.HttpCheckerRequest{URL: "https://somethingthatwillfail.ed", CronTimestamp: 1}}, want: checker.PingData{URL: "https://openstat.us/500", StatusCode: 0}, wantErr: true},

		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := checker.Http(context.Background(), tt.args.client, tt.args.inputData)

			if (err != nil) != tt.wantErr {
				t.Errorf("Ping() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got.StatusCode != tt.want.StatusCode {
				t.Errorf("Ping() = %v, want %v", got, tt.want)
			}
		})
	}
}
