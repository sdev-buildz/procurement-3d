package main

import "time"

type CuringTelemetry struct {
	MachineID                 string    `json:"machineId"`
	Timestamp                 time.Time `json:"timestamp"`
	CycleTimeMs               int       `json:"cycleTimeMs"`
	CycleTimeVariationPercent float64   `json:"cycleTimeVariationPercent"`
	Alert                     string    `json:"alert"`
	RootCause                 string    `json:"rootCause"`
	OEEPercent                float64   `json:"oeePercent"`
	MachineHealthPercent      float64   `json:"machineHealthPercent"`
	TemperatureC              float64   `json:"temperatureC"`
	PressureBar               float64   `json:"pressureBar"`
	PacketLossPercent         float64   `json:"packetLossPercent"`
	ConnectionState           string    `json:"connectionState"`
}
