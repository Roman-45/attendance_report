CREATE TABLE user_preferences (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    notify_attendance BOOLEAN NOT NULL DEFAULT TRUE,
    notify_marks    BOOLEAN NOT NULL DEFAULT TRUE,
    notify_dns      BOOLEAN NOT NULL DEFAULT TRUE,
    notify_claims   BOOLEAN NOT NULL DEFAULT TRUE,
    notify_system   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
