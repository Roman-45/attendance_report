CREATE TABLE scheduled_report_config (
    id            BIGSERIAL PRIMARY KEY,
    module_id     BIGINT NOT NULL REFERENCES modules(id),
    report_type   VARCHAR(30) NOT NULL,
    frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('DAILY','WEEKLY','MONTHLY')),
    recipient_email VARCHAR(150) NOT NULL,
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    last_sent_at  TIMESTAMPTZ,
    created_by    BIGINT NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
