CREATE DATABASE inventario_itu;
GO

USE inventario_itu;
GO

CREATE TABLE machines (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    hostname         VARCHAR(100) NOT NULL,
    lab              VARCHAR(50)  NOT NULL,
    bench_number     INT          NOT NULL,
    maintenance_date DATE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'maintenance', 'retired')),
    assignee         VARCHAR(100),
    assignee_type    VARCHAR(20)
                     CHECK (assignee_type IN ('student', 'teacher', 'technician'))
);
GO

-- Datos de prueba (tomados del mock del backend)
INSERT INTO machines (hostname, lab, bench_number, maintenance_date, status, assignee, assignee_type) VALUES
('lab101-pc01', 'Lab 101', 1, '2026-03-15', 'active',      'Juan Pérez',     'student'),
('lab101-pc02', 'Lab 101', 2, '2026-01-20', 'active',      'Prof. García',   'teacher'),
('lab101-pc03', 'Lab 101', 3, '2025-11-08', 'maintenance', 'Carlos Técnico', 'technician'),
('lab101-pc04', 'Lab 101', 4, '2026-02-10', 'active',       NULL,             NULL),
('lab101-pc05', 'Lab 101', 5, '2024-09-01', 'retired',      NULL,             NULL),
('lab102-pc01', 'Lab 102', 1, '2026-04-02', 'active',      'María López',    'student'),
('lab102-pc02', 'Lab 102', 2, '2026-03-28', 'active',      'Prof. Ruiz',     'teacher'),
('lab102-pc03', 'Lab 102', 3, '2026-01-05', 'maintenance',  NULL,             NULL),
('lab102-pc04', 'Lab 102', 4, '2025-12-18', 'active',      'Ana Operadora',  'technician'),
('lab201-pc01', 'Lab 201', 1, '2026-05-01', 'active',      'Pedro Gómez',    'student'),
('lab201-pc02', 'Lab 201', 2, '2026-02-22', 'active',       NULL,             NULL),
('lab201-pc03', 'Lab 201', 3, '2025-08-14', 'retired',     'Lab cerrado',    'technician');
GO
