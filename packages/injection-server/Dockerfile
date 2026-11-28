FROM golang:1.25-alpine AS build

WORKDIR /src

COPY packages/injection-server/go.mod packages/injection-server/go.sum ./
RUN go mod download

COPY packages/injection-server/cmd/ ./cmd/
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /injection-server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /injection-server /injection-server

ENTRYPOINT ["/injection-server"]
