CREATE TABLE classroom_layouts (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL UNIQUE REFERENCES modules(id),
    total_rows INT NOT NULL DEFAULT 13,
    columns_per_row INT NOT NULL DEFAULT 4,
    column_groups INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seat_assignments (
    id BIGSERIAL PRIMARY KEY,
    layout_id BIGINT NOT NULL REFERENCES classroom_layouts(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    row_number INT NOT NULL,
    column_number INT NOT NULL,
    assigned_by BIGINT REFERENCES students(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(layout_id, row_number, column_number),
    UNIQUE(layout_id, student_id)
);
