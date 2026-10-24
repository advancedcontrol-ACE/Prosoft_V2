INSERT INTO public.colleges (college_name, department, contact_person, email, password_hash, max_activations, active_activations, status, notes)
VALUES (
    'Manipal Institute of Technology (MAHE)',
    'Instrumentation & Control Engineering',
    'Dr. Meena Sundar',
    'meena.sundar@manipal.edu',
    'Manipal@2026',
    15,
    0,
    'active',
    'Primary testing and evaluation account'
)
ON CONFLICT (email) DO UPDATE SET 
    college_name = EXCLUDED.college_name,
    password_hash = EXCLUDED.password_hash,
    status = 'active';

DO $$
DECLARE
    manipal_id UUID;
BEGIN
    SELECT id INTO manipal_id FROM public.colleges WHERE email = 'meena.sundar@manipal.edu';
    IF manipal_id IS NOT NULL THEN
        INSERT INTO public.college_licenses (college_id, product_code) VALUES
        (manipal_id, 'ace101'),
        (manipal_id, 'sim-ace401'),
        (manipal_id, 'sim-ace403')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
