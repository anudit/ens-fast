FROM rustlang/rust:nightly as builder

ENV ROCKET_ENV=production
ENV PROFILE=release

WORKDIR /app
COPY . .

RUN cargo build --release

FROM alpine

RUN mkdir /app
RUN mkdir /app/data
WORKDIR /app
COPY --from=builder /app/target/release/ens-fast /app
COPY --from=builder /app/data /app/data

ARG PORT

ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_ENV=production
ENV PROFILE=release

CMD ROCKET_PORT=$PORT /app/ens-fast
