CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    module_id BIGINT NOT NULL REFERENCES modules(id),
    claim_type VARCHAR(20) NOT NULL,
    target_id BIGINT,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolution_note TEXT,
    resolved_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_claims_module_status ON claims(module_id, status);
