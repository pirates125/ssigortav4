-- EESigorta Portal Seed Data
-- Demo data for development and testing

-- Insert system roles
INSERT INTO roles (name, description, is_system) VALUES
('admin', 'System Administrator', true),
('branch_manager', 'Branch Manager', true),
('agent', 'Insurance Agent', true),
('viewer', 'Read-only User', true);

-- Insert permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- User permissions
('user:create', 'Create users', 'user', 'create'),
('user:read', 'Read user information', 'user', 'read'),
('user:update', 'Update user information', 'user', 'update'),
('user:delete', 'Delete users', 'user', 'delete'),
('user:list', 'List users', 'user', 'list'),

-- Branch permissions
('branch:create', 'Create branches', 'branch', 'create'),
('branch:read', 'Read branch information', 'branch', 'read'),
('branch:update', 'Update branch information', 'branch', 'update'),
('branch:delete', 'Delete branches', 'branch', 'delete'),
('branch:list', 'List branches', 'branch', 'list'),

-- Agent permissions
('agent:create', 'Create agents', 'agent', 'create'),
('agent:read', 'Read agent information', 'agent', 'read'),
('agent:update', 'Update agent information', 'agent', 'update'),
('agent:delete', 'Delete agents', 'agent', 'delete'),
('agent:list', 'List agents', 'agent', 'list'),

-- Customer permissions
('customer:create', 'Create customers', 'customer', 'create'),
('customer:read', 'Read customer information', 'customer', 'read'),
('customer:update', 'Update customer information', 'customer', 'update'),
('customer:delete', 'Delete customers', 'customer', 'delete'),
('customer:list', 'List customers', 'customer', 'list'),

-- Policy permissions
('policy:create', 'Create policies', 'policy', 'create'),
('policy:read', 'Read policy information', 'policy', 'read'),
('policy:update', 'Update policy information', 'policy', 'update'),
('policy:delete', 'Delete policies', 'policy', 'delete'),
('policy:list', 'List policies', 'policy', 'list'),

-- Quote permissions
('quote:create', 'Create quotes', 'quote', 'create'),
('quote:read', 'Read quote information', 'quote', 'read'),
('quote:update', 'Update quote information', 'quote', 'update'),
('quote:delete', 'Delete quotes', 'quote', 'delete'),
('quote:list', 'List quotes', 'quote', 'list'),

-- Report permissions
('report:read', 'Read reports', 'report', 'read'),
('report:export', 'Export reports', 'report', 'export'),

-- Scraper permissions
('scraper:run', 'Run scraper', 'scraper', 'run'),
('scraper:manage', 'Manage scraper', 'scraper', 'manage');

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

-- Branch manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'branch_manager'
AND p.name IN (
    'agent:create', 'agent:read', 'agent:update', 'agent:delete', 'agent:list',
    'customer:create', 'customer:read', 'customer:update', 'customer:delete', 'customer:list',
    'policy:create', 'policy:read', 'policy:update', 'policy:delete', 'policy:list',
    'quote:create', 'quote:read', 'quote:update', 'quote:delete', 'quote:list',
    'report:read', 'report:export'
);

-- Agent permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'agent'
AND p.name IN (
    'customer:create', 'customer:read', 'customer:update', 'customer:list',
    'policy:create', 'policy:read', 'policy:update', 'policy:list',
    'quote:create', 'quote:read', 'quote:update', 'quote:list',
    'report:read'
);

-- Viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
AND p.name IN (
    'customer:read', 'customer:list',
    'policy:read', 'policy:list',
    'quote:read', 'quote:list',
    'report:read'
);

-- Insert demo users
INSERT INTO users (email, password_hash, role, twofa_enabled, is_active) VALUES
('admin@eesigorta.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', false, true),
('manager@eesigorta.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'branch_manager', false, true),
('agent@eesigorta.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', false, true),
('viewer@eesigorta.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer', false, true);

-- Insert demo branches
INSERT INTO branches (name, city, address, phone, email, manager_id) VALUES
('Merkez Şube', 'İstanbul', 'Kadıköy, İstanbul', '0216 555 0101', 'merkez@eesigorta.com', 2),
('Ankara Şubesi', 'Ankara', 'Çankaya, Ankara', '0312 555 0102', 'ankara@eesigorta.com', 2),
('İzmir Şubesi', 'İzmir', 'Konak, İzmir', '0232 555 0103', 'izmir@eesigorta.com', 2);

-- Insert demo agents
INSERT INTO agents (branch_id, name, phone, email, license_no) VALUES
(1, 'Ahmet Yılmaz', '0555 123 45 67', 'ahmet.yilmaz@eesigorta.com', 'AGT001'),
(1, 'Fatma Demir', '0555 234 56 78', 'fatma.demir@eesigorta.com', 'AGT002'),
(2, 'Mehmet Kaya', '0555 345 67 89', 'mehmet.kaya@eesigorta.com', 'AGT003'),
(3, 'Ayşe Özkan', '0555 456 78 90', 'ayse.ozkan@eesigorta.com', 'AGT004');

-- Insert demo customers
INSERT INTO customers (tc_vkn, name, email, phone, address, city, district, postal_code, gender) VALUES
('12345678901', 'Ali Veli', 'ali.veli@email.com', '0555 111 22 33', 'Kadıköy Mah. No:1', 'İstanbul', 'Kadıköy', '34710', 'male'),
('12345678902', 'Ayşe Yılmaz', 'ayse.yilmaz@email.com', '0555 222 33 44', 'Çankaya Mah. No:2', 'Ankara', 'Çankaya', '06420', 'female'),
('12345678903', 'Mehmet Demir', 'mehmet.demir@email.com', '0555 333 44 55', 'Konak Mah. No:3', 'İzmir', 'Konak', '35250', 'male'),
('12345678904', 'Fatma Kaya', 'fatma.kaya@email.com', '0555 444 55 66', 'Bornova Mah. No:4', 'İzmir', 'Bornova', '35050', 'female'),
('12345678905', 'Mustafa Özkan', 'mustafa.ozkan@email.com', '0555 555 66 77', 'Beşiktaş Mah. No:5', 'İstanbul', 'Beşiktaş', '34353', 'male');

-- Insert demo products
INSERT INTO products (type, name, description, params_json) VALUES
('motor', 'Kasko Sigortası', 'Motorlu taşıt kasko sigortası', '{"coverage": "comprehensive", "deductible": 1000}'),
('motor', 'Trafik Sigortası', 'Motorlu taşıt trafik sigortası', '{"coverage": "mandatory", "deductible": 0}'),
('konut', 'Konut Sigortası', 'Ev ve eşya sigortası', '{"coverage": "fire_theft", "deductible": 500}'),
('sağlık', 'Sağlık Sigortası', 'Özel sağlık sigortası', '{"coverage": "comprehensive", "deductible": 200}'),
('hayat', 'Hayat Sigortası', 'Hayat sigortası', '{"coverage": "life", "deductible": 0}');

-- Insert demo quotes
INSERT INTO quotes (customer_id, product_id, agent_id, premium, status, valid_until) VALUES
(1, 1, 1, 2500.00, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days'),
(2, 2, 2, 800.00, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days'),
(3, 3, 3, 1200.00, 'draft', CURRENT_TIMESTAMP + INTERVAL '15 days'),
(4, 4, 4, 1800.00, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days'),
(5, 5, 1, 5000.00, 'expired', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Insert demo policies
INSERT INTO policies (customer_id, product_id, agent_id, premium, status, start_date, end_date, policy_no) VALUES
(1, 1, 1, 2500.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'POL001'),
(2, 2, 2, 800.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'POL002'),
(3, 3, 3, 1200.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'POL003'),
(4, 4, 4, 1800.00, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'POL004'),
(5, 5, 1, 5000.00, 'expired', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE, 'POL005');

-- Insert demo accounts
INSERT INTO accounts (branch_id, balance) VALUES
(1, 150000.00),
(2, 120000.00),
(3, 95000.00);

-- Insert demo payments
INSERT INTO payments (account_id, policy_id, amount, method, paid_at) VALUES
(1, 1, 2500.00, 'credit_card', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 2, 800.00, 'bank_transfer', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, 1200.00, 'cash', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 4, 1800.00, 'credit_card', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(1, 5, 5000.00, 'bank_transfer', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Insert demo scraper targets
INSERT INTO scraper_targets (name, base_url, enabled, use_headless, rate_limit, headers_json, selector_json) VALUES
('Sigorta Şirketi A', 'https://example-sigorta-a.com', true, false, 1000, '{"User-Agent": "Mozilla/5.0"}', '{"title": "h1", "price": ".price"}'),
('Sigorta Şirketi B', 'https://example-sigorta-b.com', true, true, 2000, '{"User-Agent": "Mozilla/5.0"}', '{"title": "h2", "price": ".premium"}'),
('Test Target', 'https://httpbin.org/html', true, false, 500, '{"User-Agent": "EESigorta-Bot/1.0"}', '{"title": "h1", "content": "p"}');

-- Insert demo scraper runs
INSERT INTO scraper_runs (target_id, status, started_at, finished_at, stats_json) VALUES
(1, 'completed', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '55 minutes', '{"total_pages": 10, "success_pages": 8, "error_pages": 2, "data_extracted": 15}'),
(2, 'running', CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL, NULL),
(3, 'failed', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes', '{"total_pages": 0, "success_pages": 0, "error_pages": 1, "data_extracted": 0}');

-- Insert demo scraped data
INSERT INTO scraped_rows (target_id, hash_key, url, type, raw_json, normalized_json) VALUES
(1, 'abc123def456', 'https://example-sigorta-a.com/products', 'product', '{"title": "Kasko Sigortası", "price": "2500 TL"}', '{"title": "Kasko Sigortası", "price": "2500", "currency": "TRY"}'),
(1, 'def456ghi789', 'https://example-sigorta-a.com/products/2', 'product', '{"title": "Trafik Sigortası", "price": "800 TL"}', '{"title": "Trafik Sigortası", "price": "800", "currency": "TRY"}'),
(2, 'ghi789jkl012', 'https://example-sigorta-b.com/offers', 'product', '{"title": "Konut Sigortası", "price": "1200 TL"}', '{"title": "Konut Sigortası", "price": "1200", "currency": "TRY"}');

-- Insert demo audit logs
INSERT INTO audit_logs (user_id, action, entity, entity_id, ip, user_agent, meta_json) VALUES
(1, 'login', 'user', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"email": "admin@eesigorta.com"}'),
(2, 'customer_created', 'customer', 1, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"tc_vkn": "12345678901", "name": "Ali Veli"}'),
(3, 'policy_created', 'policy', 1, '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '{"policy_no": "POL001", "premium": 2500.00}'),
(1, 'scraper_run', 'scraper_run', 1, '192.168.1.100', 'EESigorta-Scraper/1.0', '{"target": "Sigorta Şirketi A", "status": "completed"}');

-- Create some useful views for reporting
CREATE VIEW vw_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as total_customers,
    (SELECT COUNT(*) FROM policies WHERE status = 'active' AND deleted_at IS NULL) as active_policies,
    (SELECT SUM(premium) FROM policies WHERE status = 'active' AND deleted_at IS NULL) as total_premium,
    (SELECT COUNT(*) FROM payments WHERE paid_at >= CURRENT_DATE - INTERVAL '7 days') as payments_last_7_days,
    (SELECT SUM(amount) FROM payments WHERE paid_at >= CURRENT_DATE - INTERVAL '7 days') as total_payments_last_7_days;

CREATE VIEW vw_policy_performance AS
SELECT 
    p.id,
    p.policy_no,
    c.name as customer_name,
    pr.name as product_name,
    a.name as agent_name,
    b.name as branch_name,
    p.premium,
    p.status,
    p.start_date,
    p.end_date,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'expired'
        WHEN p.end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END as renewal_status
FROM policies p
JOIN customers c ON p.customer_id = c.id
JOIN products pr ON p.product_id = pr.id
JOIN agents a ON p.agent_id = a.id
JOIN branches b ON a.branch_id = b.id
WHERE p.deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE users IS 'System users with authentication and authorization';
COMMENT ON TABLE branches IS 'Branch offices and their information';
COMMENT ON TABLE agents IS 'Insurance agents working at branches';
COMMENT ON TABLE customers IS 'Customer information and contact details';
COMMENT ON TABLE products IS 'Insurance products and their configurations';
COMMENT ON TABLE quotes IS 'Insurance quotes before policy creation';
COMMENT ON TABLE policies IS 'Active insurance policies';
COMMENT ON TABLE accounts IS 'Branch financial accounts';
COMMENT ON TABLE payments IS 'Payment records for policies';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';
COMMENT ON TABLE scraper_targets IS 'Web scraping target configurations';
COMMENT ON TABLE scraper_runs IS 'Scraping job execution history';
COMMENT ON TABLE scraped_rows IS 'Scraped data from target websites';
COMMENT ON TABLE permissions IS 'System permissions for RBAC';
COMMENT ON TABLE roles IS 'User roles for RBAC';
COMMENT ON TABLE role_permissions IS 'Role-permission mappings for RBAC';
