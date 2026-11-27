/*
The injection server.

Listens to telemetry data from MQTT broker and stores them in the database.
*/
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/jackc/pgx/v5/pgxpool"
)

const telemetryTopic = "machines/curing/telemetry"

// main starts the telemetry ingestion service: it loads configuration, connects
// to PostgreSQL and MQTT, subscribes to curing telemetry, and shuts down gracefully on termination.
func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	databaseURL := envOrDefault(
		"DATABASE_URL",
		"postgresql://postgres:postgres@localhost:5434/fs-template",
	)
	mqttURL := envOrDefault("MQTT_URL", "tcp://localhost:1883")

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("create PostgreSQL connection pool: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("connect to PostgreSQL: %v", err)
	}

	// Configure the MQTT client to reconnect automatically and identify this server instance.
	options := mqtt.NewClientOptions().
		AddBroker(mqttURL).
		SetClientID("injection-server-" + strconv.Itoa(os.Getpid())).
		SetAutoReconnect(true)
	options.SetOnConnectHandler(func(client mqtt.Client) {
		// Subscribe when connected because the broker connection can be established or restored.
		token := client.Subscribe(telemetryTopic, 1, func(_ mqtt.Client, message mqtt.Message) {
			if err := insertTelemetry(ctx, pool, message.Payload()); err != nil {
				log.Printf("store MQTT telemetry: %v", err)
			}
		})
		if !token.WaitTimeout(10 * time.Second) {
			log.Printf("timed out subscribing to %s", telemetryTopic)
			return
		}
		if err := token.Error(); err != nil {
			log.Printf("subscribe to %s: %v", telemetryTopic, err)
		}
	})

	client := mqtt.NewClient(options)
	connectToken := client.Connect()
	if !connectToken.WaitTimeout(10 * time.Second) {
		log.Fatal("timed out connecting to MQTT broker")
	}
	if err := connectToken.Error(); err != nil {
		log.Fatalf("connect to MQTT broker: %v", err)
	}
	log.Printf("listening for MQTT telemetry on %s", telemetryTopic)

	<-ctx.Done()
	client.Disconnect(250)
}

// envOrDefault returns an environment variable when set, otherwise fallback.
func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

// insertTelemetry decodes an MQTT payload and inserts it into PostgreSQL.
func insertTelemetry(ctx context.Context, pool *pgxpool.Pool, payload []byte) error {
	var telemetry CuringTelemetry
	if err := json.Unmarshal(payload, &telemetry); err != nil {
		return fmt.Errorf("decode telemetry payload: %w", err)
	}
	if telemetry.MachineID == "" || telemetry.Timestamp.IsZero() {
		return fmt.Errorf("telemetry must include machineId and timestamp")
	}

	writeCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	_, err := pool.Exec(writeCtx, `
		INSERT INTO "karan-cloudworx"."CuringTelemetry" (
			"timestamp", "machineId", "cycleTimeMs", "cycleTimeVariationPercent",
			"alert", "rootCause", "oeePercent", "machineHealthPercent", "temperatureC",
			"pressureBar", "packetLossPercent", "connectionState"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`,
		telemetry.Timestamp,
		telemetry.MachineID,
		telemetry.CycleTimeMs,
		telemetry.CycleTimeVariationPercent,
		telemetry.Alert,
		telemetry.RootCause,
		telemetry.OEEPercent,
		telemetry.MachineHealthPercent,
		telemetry.TemperatureC,
		telemetry.PressureBar,
		telemetry.PacketLossPercent,
		telemetry.ConnectionState,
	)
	if err != nil {
		return fmt.Errorf("insert telemetry row: %w", err)
	}
	return nil
}
