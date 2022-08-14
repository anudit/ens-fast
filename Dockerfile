FROM rustlang/rust:nightly as builder

ENV ROCKET_ENV=production
ENV PROFILE=release

WORKDIR /app
COPY . .

RUN cargo build --release

FROM alpine

RUN mkdir /data
WORKDIR /
COPY --from=builder /app/target/release/ens-fast /
COPY --from=builder /app/data /data
RUN ls /

ARG PORT

ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_ENV=production
ENV PROFILE=release

CMD ROCKET_PORT=$PORT ./ens-fast
