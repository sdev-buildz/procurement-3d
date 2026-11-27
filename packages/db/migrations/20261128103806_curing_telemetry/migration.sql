-- CreateTable
CREATE TABLE "karan-cloudworx"."CuringTelemetry" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "cycleTimeMs" INTEGER NOT NULL,
    "cycleTimeVariationPercent" DECIMAL(65,30) NOT NULL,
    "alert" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "oeePercent" DECIMAL(65,30) NOT NULL,
    "machineHealthPercent" DECIMAL(65,30) NOT NULL,
    "temperatureC" DECIMAL(65,30) NOT NULL,
    "pressureBar" DECIMAL(65,30) NOT NULL,
    "packetLossPercent" DECIMAL(65,30) NOT NULL,
    "connectionState" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuringTelemetry_pkey" PRIMARY KEY ("id")
);

 
-- SELECT partman.create_partition(
--     'public.curing_telemetry',
--     'timestamp',
--     '1 day',
--     p_type := 'range'
-- );

CREATE INDEX curing_telemetry_machine_timestamp_idx
    ON "karan-cloudworx"."CuringTelemetry" ("machineId", "timestamp" DESC);

CREATE FUNCTION "karan-cloudworx".notify_curing_telemetry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_notify('curing_telemetry', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$;

CREATE TRIGGER karan_cloudworx_curing_telemetry_notify
AFTER INSERT ON "karan-cloudworx"."CuringTelemetry"
FOR EACH ROW EXECUTE FUNCTION "karan-cloudworx".notify_curing_telemetry();
