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
ENV PROFILE release
ENV PORT 3000
EXPOSE 3000
CMD ["./ens-fast"]
