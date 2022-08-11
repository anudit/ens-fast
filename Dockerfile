FROM rust:alpine3.16 AS builder
RUN apk add --update --no-cache git musl-dev protoc
RUN mkdir -p /app
COPY /ens-fast /app
RUN ls /app
WORKDIR /app
ENV PROFILE release
CMD ["cargo", "build", "--release"]

FROM alpine
WORKDIR /
COPY --from=builder /usr/src/app/target/release/ens-fast .
ENV PROFILE release
ENV PORT 3000
EXPOSE 3000
CMD ["./ens-fast"]
