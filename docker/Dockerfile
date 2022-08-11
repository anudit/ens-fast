FROM rust:alpine3.16 AS builder
RUN apk add --update --no-cache git musl-dev protoc
RUN git clone https://github.com/anudit/ens-fast.git /app
WORKDIR /app
ENV PROFILE release
RUN cargo build --release

FROM alpine
WORKDIR /
RUN mkdir -p ./data
COPY --from=builder /app/data ./data
COPY --from=builder /app/target/release/ens-fast .

ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_ENV=production
ENV PROFILE=release
ENV PORT 8000
EXPOSE 8000

CMD ROCKET_PORT=$PORT ./ens-fast
