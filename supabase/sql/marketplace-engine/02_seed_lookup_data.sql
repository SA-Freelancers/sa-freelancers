-- ============================================================
-- FREELANCE HUB SA
-- DEMO MARKETPLACE ENGINE
-- FILE: 02_seed_lookup_data.sql
--
-- Run this after:
--   01_lookup_tables.sql
--   demo_first_names / demo_last_names migration
-- ============================================================


-- ============================================================
-- 1. MARKETPLACE LOCATIONS
-- ============================================================

insert into public.demo_marketplace_locations (
  city,
  province,
  country,
  work_type
)
values
  ('Johannesburg', 'Gauteng', 'South Africa', 'Remote'),
  ('Johannesburg', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Johannesburg', 'Gauteng', 'South Africa', 'On-site'),

  ('Pretoria', 'Gauteng', 'South Africa', 'Remote'),
  ('Pretoria', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Pretoria', 'Gauteng', 'South Africa', 'On-site'),

  ('Centurion', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Midrand', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Sandton', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Randburg', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Roodepoort', 'Gauteng', 'South Africa', 'Hybrid'),
  ('Vanderbijlpark', 'Gauteng', 'South Africa', 'On-site'),
  ('Germiston', 'Gauteng', 'South Africa', 'On-site'),
  ('Boksburg', 'Gauteng', 'South Africa', 'On-site'),

  ('Cape Town', 'Western Cape', 'South Africa', 'Remote'),
  ('Cape Town', 'Western Cape', 'South Africa', 'Hybrid'),
  ('Cape Town', 'Western Cape', 'South Africa', 'On-site'),
  ('Bellville', 'Western Cape', 'South Africa', 'Hybrid'),
  ('Stellenbosch', 'Western Cape', 'South Africa', 'Hybrid'),
  ('George', 'Western Cape', 'South Africa', 'Hybrid'),

  ('Durban', 'KwaZulu-Natal', 'South Africa', 'Remote'),
  ('Durban', 'KwaZulu-Natal', 'South Africa', 'Hybrid'),
  ('Durban', 'KwaZulu-Natal', 'South Africa', 'On-site'),
  ('Pinetown', 'KwaZulu-Natal', 'South Africa', 'On-site'),
  ('Richards Bay', 'KwaZulu-Natal', 'South Africa', 'On-site'),
  ('Pietermaritzburg', 'KwaZulu-Natal', 'South Africa', 'Hybrid'),

  ('Bloemfontein', 'Free State', 'South Africa', 'Hybrid'),
  ('Welkom', 'Free State', 'South Africa', 'On-site'),
  ('Sasolburg', 'Free State', 'South Africa', 'On-site'),

  ('Polokwane', 'Limpopo', 'South Africa', 'Hybrid'),
  ('Mokopane', 'Limpopo', 'South Africa', 'On-site'),

  ('Mbombela', 'Mpumalanga', 'South Africa', 'Hybrid'),
  ('Secunda', 'Mpumalanga', 'South Africa', 'On-site'),
  ('Emalahleni', 'Mpumalanga', 'South Africa', 'On-site'),

  ('Rustenburg', 'North West', 'South Africa', 'On-site'),
  ('Mahikeng', 'North West', 'South Africa', 'Hybrid'),

  ('Kimberley', 'Northern Cape', 'South Africa', 'Hybrid'),
  ('Kathu', 'Northern Cape', 'South Africa', 'On-site'),

  ('Gqeberha', 'Eastern Cape', 'South Africa', 'Hybrid'),
  ('East London', 'Eastern Cape', 'South Africa', 'Hybrid'),
  ('Mthatha', 'Eastern Cape', 'South Africa', 'Hybrid'),

  ('Remote', null, 'South Africa', 'Remote')
on conflict do nothing;


-- ============================================================
-- 2. COMPANY TEMPLATE LIBRARY
-- ============================================================

insert into public.demo_company_templates (
  display_name,
  industry,
  city,
  province,
  country,
  company_description,
  verified
)
values
  (
    'Ubuntu Engineering Solutions',
    'Engineering',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Mechanical engineering, manufacturing support and technical design services.',
    true
  ),
  (
    'Khumo Mining Services',
    'Mining',
    'Rustenburg',
    'North West',
    'South Africa',
    'Mining maintenance, equipment support and plant improvement services.',
    true
  ),
  (
    'Platinum Mechanical Projects',
    'Engineering',
    'Rustenburg',
    'North West',
    'South Africa',
    'Mechanical design, fabrication and mining equipment support.',
    true
  ),
  (
    'Metsi Industrial Engineering',
    'Engineering',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Industrial engineering and plant improvement services.',
    true
  ),
  (
    'Precision CAD Africa',
    'CAD Drafting',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Mechanical, structural and fabrication drawing services.',
    true
  ),
  (
    'Gauteng Steel Works',
    'Manufacturing',
    'Germiston',
    'Gauteng',
    'South Africa',
    'Steel fabrication, machining and industrial manufacturing.',
    true
  ),
  (
    'Sisonke Manufacturing',
    'Manufacturing',
    'Boksburg',
    'Gauteng',
    'South Africa',
    'Custom manufacturing and production support services.',
    true
  ),
  (
    'Apex Conveyor Systems',
    'Mining',
    'Emalahleni',
    'Mpumalanga',
    'South Africa',
    'Conveyor systems and bulk material handling solutions.',
    true
  ),
  (
    'Makhulu Mining Supplies',
    'Mining',
    'Kathu',
    'Northern Cape',
    'South Africa',
    'Mining equipment, consumables and engineering support.',
    true
  ),
  (
    'Metro Civil Projects',
    'Civil Engineering',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Civil infrastructure, municipal and commercial construction projects.',
    true
  ),
  (
    'Northern Civils',
    'Civil Engineering',
    'Polokwane',
    'Limpopo',
    'South Africa',
    'Roadworks, drainage and civil infrastructure services.',
    true
  ),
  (
    'EcoBuild Projects',
    'Construction',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Sustainable residential and commercial construction services.',
    true
  ),
  (
    'BuildTech Africa',
    'Construction',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Construction management, quantity surveying and project support.',
    true
  ),
  (
    'Vision Architecture Studio',
    'Architecture',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Architectural design, visualisation and planning services.',
    true
  ),
  (
    'Coastal Design Works',
    'Architecture',
    'Gqeberha',
    'Eastern Cape',
    'South Africa',
    'Building plans, interior layouts and 3D visualisation.',
    true
  ),
  (
    'FutureGrid Electrical',
    'Electrical',
    'Midrand',
    'Gauteng',
    'South Africa',
    'Industrial electrical design, panel building and automation.',
    true
  ),
  (
    'Metro Electrical Projects',
    'Electrical',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Electrical installations and industrial electrical engineering.',
    true
  ),
  (
    'Apex Solar Systems',
    'Renewable Energy',
    'Centurion',
    'Gauteng',
    'South Africa',
    'Commercial and residential solar energy solutions.',
    true
  ),
  (
    'SA Solar Installations',
    'Renewable Energy',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Solar PV design, installation and energy consulting.',
    true
  ),
  (
    'Digital Horizon Technologies',
    'Information Technology',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Web applications, software systems and digital platforms.',
    true
  ),
  (
    'Ubuntu Digital Solutions',
    'Information Technology',
    'Durban',
    'KwaZulu-Natal',
    'South Africa',
    'Web development, digital transformation and IT consulting.',
    true
  ),
  (
    'Cape Web Studio',
    'Information Technology',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Business websites, e-commerce and digital support.',
    true
  ),
  (
    'Mzanzi App Developers',
    'Information Technology',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Mobile and web application development.',
    true
  ),
  (
    'Summit Data Analytics',
    'Data Management',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Business intelligence, reporting and data analytics.',
    true
  ),
  (
    'Mzanzi Data Solutions',
    'Data Management',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Data capture, reporting automation and database services.',
    true
  ),
  (
    'Joburg Creative Studio',
    'Graphic Design',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Branding, graphic design and digital content creation.',
    true
  ),
  (
    'Rise Media House',
    'Marketing',
    'Durban',
    'KwaZulu-Natal',
    'South Africa',
    'Social media, advertising and content marketing.',
    true
  ),
  (
    'Thrive Marketing Group',
    'Marketing',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Digital marketing and business growth services.',
    true
  ),
  (
    'Blue Crane Consulting',
    'Consulting',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Business strategy, operations and professional consulting.',
    true
  ),
  (
    'Kopano Business Advisory',
    'Consulting',
    'Bloemfontein',
    'Free State',
    'South Africa',
    'Small-business consulting and compliance support.',
    true
  ),
  (
    'Nala Office Solutions',
    'Administration',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Remote administration, document management and office support.',
    true
  ),
  (
    'Ubuntu Tender Services',
    'Administration',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Tender preparation, document formatting and compliance support.',
    true
  ),
  (
    'Vuka Logistics',
    'Logistics',
    'Durban',
    'KwaZulu-Natal',
    'South Africa',
    'Transport, warehousing and logistics management.',
    true
  ),
  (
    'Greenline Property Services',
    'Property',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Property maintenance, inspections and facilities support.',
    true
  ),
  (
    'Thrive Retail Group',
    'Retail',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Retail operations, e-commerce and customer service.',
    true
  ),
  (
    'Ubuntu Automotive Services',
    'Automotive',
    'Pretoria',
    'Gauteng',
    'South Africa',
    'Automotive repairs, parts and fleet support.',
    true
  ),
  (
    'BrightPath Training',
    'Education',
    'Bloemfontein',
    'Free State',
    'South Africa',
    'Professional training, learning materials and skills development.',
    true
  ),
  (
    'Township Business Hub',
    'Small Business',
    'Soweto',
    'Gauteng',
    'South Africa',
    'Support services for local entrepreneurs and growing businesses.',
    true
  ),
  (
    'Cape Financial Services',
    'Finance',
    'Cape Town',
    'Western Cape',
    'South Africa',
    'Bookkeeping, reporting and financial administration.',
    true
  ),
  (
    'Mzansi Legal Support',
    'Legal Services',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    'Legal administration, document preparation and research support.',
    true
  )
on conflict do nothing;


-- ============================================================
-- 3. JOB TEMPLATE LIBRARY
-- ============================================================

insert into public.demo_job_templates (
  category,
  title,
  description_template,
  min_budget,
  max_budget,
  min_duration_days,
  max_duration_days,
  experience_level,
  skills
)
values

-- Engineering and CAD

  (
    'Engineering',
    'Mechanical Draughtsman for Manufacturing Drawings',
    'We require a mechanical draughtsman to produce detailed manufacturing drawings from supplied sketches and measurements.',
    5000,
    18000,
    5,
    20,
    'Intermediate',
    array['SolidWorks', 'Inventor', 'AutoCAD', 'GD&T']
  ),
  (
    'Engineering',
    'Mechanical Draughtsman for Conveyor Upgrade',
    'Prepare revised fabrication and assembly drawings for an industrial conveyor upgrade.',
    7000,
    22000,
    7,
    25,
    'Intermediate',
    array['SolidWorks', 'Conveyor Design', 'Fabrication Drawings']
  ),
  (
    'Engineering',
    'Reverse Engineer Existing Machine Component',
    'Reverse engineer an existing mechanical component and provide a complete 3D model and workshop drawing.',
    6000,
    25000,
    5,
    20,
    'Expert',
    array['Reverse Engineering', 'SolidWorks', 'Metrology']
  ),
  (
    'Engineering',
    'Create Gearbox Housing Manufacturing Drawings',
    'Create detailed manufacturing drawings for a gearbox housing using the supplied model and inspection measurements.',
    6000,
    18000,
    5,
    18,
    'Expert',
    array['Mechanical Design', 'GD&T', 'Machining Drawings']
  ),
  (
    'Engineering',
    'Design Steel Support Structure',
    'Design a welded steel support structure and provide fabrication drawings and a bill of materials.',
    8000,
    30000,
    7,
    25,
    'Expert',
    array['Structural Steel', 'AutoCAD', 'Fabrication']
  ),
  (
    'Engineering',
    'Inventor Assembly Modelling',
    'Create a complete Autodesk Inventor assembly from supplied part drawings and photographs.',
    4000,
    16000,
    4,
    15,
    'Intermediate',
    array['Autodesk Inventor', '3D Modelling', 'Assembly Design']
  ),
  (
    'Engineering',
    'SolidWorks Machine Design',
    'Develop a production-ready machine design including parts, assembly drawings and a bill of materials.',
    12000,
    45000,
    10,
    35,
    'Expert',
    array['SolidWorks', 'Machine Design', 'BOM']
  ),
  (
    'Engineering',
    'Pressure Vessel Fabrication Drawings',
    'Prepare pressure vessel fabrication drawings from supplied engineering calculations and specifications.',
    12000,
    40000,
    10,
    30,
    'Expert',
    array['Pressure Vessels', 'AutoCAD', 'Fabrication Drawings']
  ),
  (
    'CAD Drafting',
    'Convert Hand Sketches to AutoCAD Drawings',
    'Convert clear hand sketches and dimensions into professional AutoCAD drawings.',
    1500,
    6500,
    2,
    10,
    'Entry Level',
    array['AutoCAD', '2D Drafting', 'Technical Drawing']
  ),
  (
    'CAD Drafting',
    'Convert PDF Drawings to Editable CAD',
    'Redraw supplied PDF drawings into clean and fully editable CAD files.',
    1200,
    7000,
    2,
    12,
    'Entry Level',
    array['AutoCAD', 'PDF Conversion', 'Drafting']
  ),
  (
    'CAD Drafting',
    'Create Fabrication Drawing Pack',
    'Prepare a complete fabrication drawing pack including dimensions, weld symbols and a bill of materials.',
    5000,
    22000,
    5,
    20,
    'Intermediate',
    array['Fabrication Drawings', 'Weld Symbols', 'BOM']
  ),
  (
    'CAD Drafting',
    'Steel Detailing for Workshop Production',
    'Produce accurate steel detailing drawings for workshop cutting, drilling and welding.',
    6000,
    26000,
    6,
    25,
    'Intermediate',
    array['Steel Detailing', 'AutoCAD', 'Fabrication']
  ),
  (
    'Manufacturing',
    'Prepare CNC Machining Drawings',
    'Create machining drawings with tolerances, surface finishes and manufacturing notes.',
    3500,
    14000,
    4,
    15,
    'Intermediate',
    array['CNC', 'GD&T', 'Machining']
  ),
  (
    'Manufacturing',
    'Create Sheet Metal Development Drawings',
    'Prepare sheet metal development drawings for laser cutting and bending.',
    3500,
    16000,
    4,
    15,
    'Intermediate',
    array['Sheet Metal', 'DXF', 'SolidWorks']
  ),
  (
    'Mining',
    'Mining Equipment Modification Drawings',
    'Prepare modification drawings for existing underground mining equipment.',
    10000,
    35000,
    8,
    30,
    'Expert',
    array['Mining Equipment', 'Mechanical Design', 'Fabrication']
  ),
  (
    'Mining',
    'Conveyor Chute Design and Drawings',
    'Design a transfer chute and produce manufacturing and installation drawings.',
    12000,
    45000,
    10,
    35,
    'Expert',
    array['Chute Design', 'Conveyor Systems', 'SolidWorks']
  ),
  (
    'Mining',
    'Plant Layout Drawing Update',
    'Update an existing mining plant layout using supplied redline drawings and site measurements.',
    5000,
    18000,
    5,
    20,
    'Intermediate',
    array['Plant Layout', 'AutoCAD', 'Mining']
  ),

-- Electrical and solar

  (
    'Electrical',
    'Create Electrical Single-Line Diagram',
    'Prepare a professional electrical single-line diagram from the supplied equipment list and design notes.',
    3000,
    14000,
    4,
    15,
    'Intermediate',
    array['Single-Line Diagram', 'AutoCAD Electrical', 'Electrical Design']
  ),
  (
    'Electrical',
    'MCC Panel Drawing Package',
    'Create MCC panel layouts, wiring diagrams and equipment schedules.',
    8000,
    30000,
    7,
    25,
    'Expert',
    array['MCC', 'Panel Design', 'AutoCAD Electrical']
  ),
  (
    'Electrical',
    'Electrical Control Panel Drawings',
    'Produce control panel general arrangement and wiring drawings.',
    5000,
    22000,
    6,
    20,
    'Intermediate',
    array['Control Panels', 'Wiring Diagrams', 'AutoCAD']
  ),
  (
    'Electrical',
    'PLC Documentation and I/O Schedule',
    'Prepare PLC documentation, an I/O schedule and system architecture diagrams.',
    5000,
    20000,
    5,
    20,
    'Intermediate',
    array['PLC', 'I/O Schedule', 'Automation']
  ),
  (
    'Renewable Energy',
    'Solar PV Layout and Bill of Materials',
    'Prepare a solar PV panel layout, cable routing plan and bill of materials.',
    3500,
    15000,
    4,
    15,
    'Intermediate',
    array['Solar PV', 'AutoCAD', 'Bill of Materials']
  ),
  (
    'Renewable Energy',
    'Commercial Solar System Design',
    'Design a commercial solar system based on the supplied electricity usage and roof information.',
    8000,
    30000,
    7,
    25,
    'Expert',
    array['Solar Design', 'PV Sizing', 'Electrical Design']
  ),

-- Construction and architecture

  (
    'Civil Engineering',
    'Prepare Civil Site Layout',
    'Create a civil site layout showing roads, drainage and service routes.',
    6000,
    25000,
    7,
    25,
    'Intermediate',
    array['Civil 3D', 'AutoCAD', 'Site Layout']
  ),
  (
    'Civil Engineering',
    'Stormwater Drainage Drawing',
    'Prepare a stormwater drainage layout and construction details.',
    5000,
    20000,
    5,
    20,
    'Intermediate',
    array['Drainage Design', 'Civil 3D', 'AutoCAD']
  ),
  (
    'Construction',
    'Quantity Take-Off and Cost Estimate',
    'Prepare a quantity take-off and preliminary cost estimate from supplied construction drawings.',
    3500,
    16000,
    4,
    15,
    'Intermediate',
    array['Quantity Surveying', 'Cost Estimation', 'Excel']
  ),
  (
    'Architecture',
    'Residential House Plan',
    'Prepare a residential house plan from the supplied brief, measurements and reference images.',
    5000,
    22000,
    7,
    25,
    'Intermediate',
    array['AutoCAD', 'Revit', 'House Plans']
  ),
  (
    'Architecture',
    'Commercial Building 3D Visualisation',
    'Create realistic exterior renders for a proposed commercial building.',
    5000,
    25000,
    6,
    20,
    'Intermediate',
    array['3D Rendering', 'SketchUp', 'Lumion']
  ),
  (
    'Architecture',
    'Warehouse Layout Drawing',
    'Develop a practical warehouse layout including storage, access and workflow zones.',
    4000,
    18000,
    5,
    18,
    'Intermediate',
    array['AutoCAD', 'Space Planning', 'Warehouse Layout']
  ),

-- Web and software

  (
    'Web Development',
    'Build a Professional Company Website',
    'Design and develop a responsive company website with service pages, contact forms and basic SEO.',
    6000,
    25000,
    7,
    30,
    'Intermediate',
    array['Web Development', 'Responsive Design', 'SEO']
  ),
  (
    'Web Development',
    'React Front-End Developer',
    'Develop responsive React components from supplied designs and API documentation.',
    8000,
    35000,
    7,
    30,
    'Intermediate',
    array['React', 'TypeScript', 'REST API']
  ),
  (
    'Web Development',
    'Next.js Dashboard Development',
    'Build a responsive Next.js dashboard with authentication and database integration.',
    12000,
    50000,
    10,
    40,
    'Expert',
    array['Next.js', 'React', 'TypeScript', 'Supabase']
  ),
  (
    'Web Development',
    'WordPress Business Website',
    'Create a modern WordPress website that can be maintained by the client.',
    4000,
    18000,
    5,
    25,
    'Intermediate',
    array['WordPress', 'Elementor', 'SEO']
  ),
  (
    'Web Development',
    'Shopify Store Setup',
    'Configure and customise a Shopify store including products, payments and shipping.',
    6000,
    25000,
    7,
    30,
    'Intermediate',
    array['Shopify', 'E-commerce', 'Liquid']
  ),
  (
    'Software Development',
    'Flutter Mobile Application',
    'Develop a cross-platform mobile application from supplied wireframes and requirements.',
    20000,
    80000,
    20,
    60,
    'Expert',
    array['Flutter', 'Dart', 'Mobile Development']
  ),
  (
    'Software Development',
    'Python Automation Script',
    'Develop a Python script to automate a repetitive reporting or data-processing task.',
    3500,
    18000,
    4,
    18,
    'Intermediate',
    array['Python', 'Automation', 'Data Processing']
  ),
  (
    'Software Development',
    'Supabase Database Integration',
    'Integrate an existing web application with Supabase authentication, database and storage.',
    7000,
    30000,
    7,
    25,
    'Expert',
    array['Supabase', 'PostgreSQL', 'Authentication']
  ),
  (
    'IT Support',
    'Remote IT Support Technician',
    'Provide remote troubleshooting and user support for Windows computers and business software.',
    1500,
    8000,
    2,
    14,
    'Entry Level',
    array['Windows Support', 'Remote Support', 'Networking']
  ),

-- Data and business systems

  (
    'Data Management',
    'Excel Dashboard and Reporting Tool',
    'Build an interactive Excel dashboard using supplied operational data.',
    2500,
    12000,
    4,
    15,
    'Intermediate',
    array['Excel', 'Dashboards', 'Reporting']
  ),
  (
    'Data Management',
    'Power BI Business Dashboard',
    'Create a Power BI dashboard with clear KPIs, filters and visual reports.',
    5000,
    22000,
    6,
    20,
    'Intermediate',
    array['Power BI', 'Data Modelling', 'DAX']
  ),
  (
    'Data Management',
    'Clean and Organise Business Data',
    'Clean, standardise and organise an existing spreadsheet or database export.',
    1500,
    7500,
    2,
    12,
    'Entry Level',
    array['Data Cleaning', 'Excel', 'Data Entry']
  ),
  (
    'Data Management',
    'SQL Reporting Query Development',
    'Develop efficient SQL queries for operational and management reports.',
    4000,
    18000,
    4,
    18,
    'Intermediate',
    array['SQL', 'PostgreSQL', 'Reporting']
  ),

-- Design and media

  (
    'Graphic Design',
    'Professional Logo Design',
    'Create a modern logo and basic brand identity for a South African business.',
    800,
    4500,
    3,
    12,
    'Intermediate',
    array['Logo Design', 'Illustrator', 'Branding']
  ),
  (
    'Graphic Design',
    'Company Profile Design',
    'Design a professional company profile using supplied text, images and branding.',
    1500,
    7500,
    4,
    15,
    'Intermediate',
    array['Company Profile', 'Canva', 'Adobe InDesign']
  ),
  (
    'Graphic Design',
    'Social Media Post Designs',
    'Create a set of branded social media graphics for Facebook, Instagram and LinkedIn.',
    1200,
    6000,
    3,
    12,
    'Intermediate',
    array['Canva', 'Social Media Design', 'Branding']
  ),
  (
    'Graphic Design',
    'Product Catalogue Design',
    'Design a clean product catalogue using supplied descriptions, pricing and images.',
    2500,
    12000,
    5,
    20,
    'Intermediate',
    array['Catalogue Design', 'InDesign', 'Layout']
  ),
  (
    'UI/UX Design',
    'Mobile Application UI Design',
    'Create a modern mobile application interface and clickable prototype.',
    5000,
    22000,
    7,
    25,
    'Intermediate',
    array['Figma', 'UI Design', 'Prototyping']
  ),
  (
    'Video Editing',
    'Promotional Business Video',
    'Edit supplied footage into a polished promotional video with text and music.',
    2000,
    10000,
    4,
    15,
    'Intermediate',
    array['Video Editing', 'Premiere Pro', 'Motion Graphics']
  ),

-- Marketing and writing

  (
    'Marketing',
    'Social Media Management',
    'Plan and manage regular social media content for a growing business.',
    3000,
    15000,
    14,
    30,
    'Intermediate',
    array['Social Media', 'Content Planning', 'Analytics']
  ),
  (
    'Marketing',
    'LinkedIn Content Campaign',
    'Develop and schedule professional LinkedIn content for a company page.',
    2000,
    10000,
    7,
    30,
    'Intermediate',
    array['LinkedIn', 'Copywriting', 'Content Strategy']
  ),
  (
    'Marketing',
    'Google and Facebook Advertising Setup',
    'Set up and optimise digital advertising campaigns for a local business.',
    3000,
    15000,
    7,
    30,
    'Expert',
    array['Google Ads', 'Facebook Ads', 'Campaign Management']
  ),
  (
    'Writing',
    'Tender Proposal Writing',
    'Prepare and professionally format a tender proposal from supplied company information.',
    2500,
    12000,
    4,
    15,
    'Intermediate',
    array['Tender Writing', 'Business Writing', 'Document Formatting']
  ),
  (
    'Writing',
    'Website Copywriting',
    'Write clear and professional website content for a South African business.',
    1800,
    9000,
    4,
    15,
    'Intermediate',
    array['Copywriting', 'Website Content', 'SEO']
  ),
  (
    'Writing',
    'Technical Manual Preparation',
    'Prepare a clear technical manual from supplied engineering notes, drawings and photographs.',
    5000,
    20000,
    7,
    25,
    'Expert',
    array['Technical Writing', 'Documentation', 'Engineering']
  ),
  (
    'Writing',
    'SEO Blog Article Writing',
    'Write a set of search-optimised blog articles for a business website.',
    1200,
    7000,
    4,
    15,
    'Intermediate',
    array['SEO Writing', 'Blogging', 'Research']
  ),

-- Administration, finance and education

  (
    'Administration',
    'Virtual Assistant for Small Business',
    'Provide email, diary, document and general administrative support.',
    2000,
    9000,
    7,
    30,
    'Entry Level',
    array['Virtual Assistance', 'Email Management', 'Administration']
  ),
  (
    'Administration',
    'Tender Administration Support',
    'Assist with tender document preparation, compliance checks and submission organisation.',
    2500,
    10000,
    4,
    20,
    'Intermediate',
    array['Tender Administration', 'Document Control', 'Compliance']
  ),
  (
    'Administration',
    'Data Capture and Document Organisation',
    'Capture supplied information accurately and organise the supporting files.',
    1000,
    6000,
    2,
    14,
    'Entry Level',
    array['Data Entry', 'Document Management', 'Excel']
  ),
  (
    'Finance',
    'Monthly Bookkeeping Support',
    'Capture transactions, reconcile accounts and prepare monthly bookkeeping reports.',
    2500,
    12000,
    14,
    30,
    'Intermediate',
    array['Bookkeeping', 'Excel', 'Reconciliation']
  ),
  (
    'Finance',
    'Financial Reporting Spreadsheet',
    'Create a structured spreadsheet for income, expenses and monthly reporting.',
    1800,
    8500,
    4,
    15,
    'Intermediate',
    array['Excel', 'Financial Reporting', 'Data Analysis']
  ),
  (
    'Education',
    'Create Online Training Materials',
    'Develop structured training slides, worksheets and assessment activities.',
    2500,
    12000,
    5,
    20,
    'Intermediate',
    array['Training Content', 'PowerPoint', 'Instructional Design']
  ),
  (
    'Legal Services',
    'Legal Document Formatting and Administration',
    'Format and organise supplied legal documents for professional presentation and record keeping.',
    1800,
    8000,
    3,
    12,
    'Intermediate',
    array['Legal Administration', 'Document Formatting', 'Research']
  )
on conflict do nothing;


-- ============================================================
-- 4. FREELANCER TEMPLATE LIBRARY
-- ============================================================

insert into public.demo_freelancer_templates (
  category,
  headline,
  bio_template,
  skills,
  minimum_hourly_rate,
  maximum_hourly_rate,
  minimum_experience_years,
  maximum_experience_years
)
values
  (
    'Engineering',
    'Mechanical Engineering Draughtsman',
    'Mechanical draughtsman specialising in detailed manufacturing, assembly and fabrication drawings.',
    array['SolidWorks', 'Inventor', 'AutoCAD', 'GD&T'],
    250,
    480,
    2,
    12
  ),
  (
    'Engineering',
    'Mechanical Design Technician',
    'Mechanical design technician experienced in machine components, assemblies and production drawings.',
    array['Mechanical Design', 'SolidWorks', 'Inventor'],
    280,
    520,
    3,
    12
  ),
  (
    'Engineering',
    'Reverse Engineering Specialist',
    'Specialist in measuring, modelling and documenting existing mechanical components.',
    array['Reverse Engineering', 'SolidWorks', 'Metrology'],
    320,
    650,
    4,
    15
  ),
  (
    'Engineering',
    'Machine Design Specialist',
    'Experienced in concept development, machine design and manufacturing documentation.',
    array['Machine Design', 'SolidWorks', 'BOM'],
    350,
    700,
    4,
    15
  ),
  (
    'CAD Drafting',
    'AutoCAD Draughtsman',
    'Reliable AutoCAD draughtsman producing accurate technical and fabrication drawings.',
    array['AutoCAD', 'Technical Drawing', 'PDF Conversion'],
    180,
    400,
    1,
    10
  ),
  (
    'CAD Drafting',
    'Steel Detailing Technician',
    'Steel detailing technician producing workshop drawings, cutting lists and fabrication details.',
    array['Steel Detailing', 'AutoCAD', 'Fabrication'],
    230,
    480,
    2,
    12
  ),
  (
    'Manufacturing',
    'CNC and Machining Drawing Specialist',
    'Produces machining drawings with accurate dimensions, tolerances and surface finish requirements.',
    array['CNC', 'Machining Drawings', 'GD&T'],
    280,
    550,
    3,
    14
  ),
  (
    'Mining',
    'Mining Equipment Draughtsman',
    'Mechanical draughtsman experienced in mining equipment, conveyors and plant modifications.',
    array['Mining Equipment', 'Conveyors', 'SolidWorks'],
    300,
    620,
    3,
    15
  ),
  (
    'Electrical',
    'Electrical CAD Technician',
    'Electrical drafting specialist producing single-line diagrams, panel layouts and wiring drawings.',
    array['AutoCAD Electrical', 'SLD', 'Panel Layouts'],
    240,
    500,
    2,
    12
  ),
  (
    'Electrical',
    'PLC and Automation Technician',
    'Automation technician supporting PLC documentation, I/O schedules and control systems.',
    array['PLC', 'Automation', 'I/O Schedules'],
    300,
    620,
    3,
    14
  ),
  (
    'Renewable Energy',
    'Solar Design Assistant',
    'Solar design professional preparing layouts, system schedules and bills of materials.',
    array['Solar PV', 'AutoCAD', 'Electrical BOQ'],
    240,
    500,
    2,
    10
  ),
  (
    'Civil Engineering',
    'Civil CAD Technician',
    'Civil CAD technician experienced in site layouts, drainage and infrastructure drawings.',
    array['Civil 3D', 'AutoCAD', 'Site Layouts'],
    260,
    540,
    2,
    12
  ),
  (
    'Architecture',
    'Architectural Draughtsman',
    'Architectural draughtsman producing residential and commercial building plans.',
    array['AutoCAD', 'Revit', 'Building Plans'],
    240,
    520,
    2,
    12
  ),
  (
    'Architecture',
    '3D Architectural Visualiser',
    'Creates realistic architectural renders and presentation visuals.',
    array['SketchUp', 'Lumion', '3D Rendering'],
    250,
    600,
    2,
    12
  ),
  (
    'Web Development',
    'React Developer',
    'Front-end developer creating responsive applications using React and TypeScript.',
    array['React', 'TypeScript', 'REST API'],
    320,
    700,
    2,
    12
  ),
  (
    'Web Development',
    'Next.js Developer',
    'Next.js developer specialising in modern full-stack web applications.',
    array['Next.js', 'React', 'TypeScript', 'Supabase'],
    380,
    800,
    3,
    14
  ),
  (
    'Web Development',
    'WordPress Developer',
    'Builds responsive and easy-to-manage WordPress business websites.',
    array['WordPress', 'Elementor', 'SEO'],
    220,
    520,
    2,
    12
  ),
  (
    'Web Development',
    'Shopify Developer',
    'Shopify specialist supporting store setup, theme customisation and integrations.',
    array['Shopify', 'Liquid', 'E-commerce'],
    280,
    650,
    2,
    12
  ),
  (
    'Software Development',
    'Flutter Mobile Developer',
    'Cross-platform mobile developer creating Android and iOS applications.',
    array['Flutter', 'Dart', 'Firebase'],
    380,
    850,
    3,
    14
  ),
  (
    'Software Development',
    'Python Automation Developer',
    'Python developer specialising in workflow automation and data processing.',
    array['Python', 'Automation', 'APIs'],
    300,
    700,
    2,
    12
  ),
  (
    'Software Development',
    'Supabase and PostgreSQL Developer',
    'Backend developer specialising in Supabase, PostgreSQL and secure application data systems.',
    array['Supabase', 'PostgreSQL', 'SQL', 'RLS'],
    380,
    850,
    3,
    14
  ),
  (
    'IT Support',
    'Remote IT Support Technician',
    'Provides remote computer support, software troubleshooting and basic network assistance.',
    array['Windows Support', 'Networking', 'Remote Support'],
    180,
    420,
    1,
    10
  ),
  (
    'Data Management',
    'Excel Reporting Specialist',
    'Creates structured spreadsheets, reports and business dashboards.',
    array['Excel', 'Dashboards', 'Reporting'],
    220,
    500,
    2,
    12
  ),
  (
    'Data Management',
    'Power BI Consultant',
    'Business intelligence specialist creating dashboards, KPIs and management reports.',
    array['Power BI', 'DAX', 'Data Modelling'],
    320,
    700,
    3,
    14
  ),
  (
    'Data Management',
    'SQL Data Analyst',
    'Data professional specialising in SQL reporting, data cleaning and analysis.',
    array['SQL', 'PostgreSQL', 'Data Analysis'],
    300,
    680,
    2,
    12
  ),
  (
    'Graphic Design',
    'Graphic and Brand Designer',
    'Creates professional logos, brand identities and marketing materials.',
    array['Illustrator', 'Photoshop', 'Branding'],
    220,
    550,
    2,
    12
  ),
  (
    'Graphic Design',
    'Canva Content Designer',
    'Creates polished social media, presentation and business graphics.',
    array['Canva', 'Social Media Design', 'Presentations'],
    160,
    380,
    1,
    9
  ),
  (
    'UI/UX Design',
    'UI and UX Designer',
    'Designs modern, practical web and mobile user interfaces.',
    array['Figma', 'Wireframes', 'Prototyping'],
    300,
    680,
    2,
    12
  ),
  (
    'Video Editing',
    'Video Editor and Motion Designer',
    'Edits promotional videos, social content and business presentations.',
    array['Premiere Pro', 'After Effects', 'CapCut'],
    220,
    580,
    2,
    12
  ),
  (
    'Marketing',
    'Social Media Specialist',
    'Supports content planning, posting, engagement and campaign reporting.',
    array['Facebook', 'Instagram', 'LinkedIn'],
    200,
    500,
    2,
    12
  ),
  (
    'Marketing',
    'Digital Advertising Specialist',
    'Plans and manages paid campaigns across Google and social platforms.',
    array['Google Ads', 'Facebook Ads', 'Analytics'],
    300,
    700,
    3,
    14
  ),
  (
    'Writing',
    'Business and Tender Writer',
    'Writes professional proposals, tenders, company profiles and business documents.',
    array['Tender Writing', 'Business Writing', 'Research'],
    220,
    520,
    2,
    12
  ),
  (
    'Writing',
    'SEO Content Writer',
    'Writes clear website and blog content designed for readers and search engines.',
    array['SEO Writing', 'Blogging', 'Copywriting'],
    180,
    450,
    1,
    10
  ),
  (
    'Administration',
    'Virtual Assistant',
    'Provides reliable remote support with email, documents, scheduling and data entry.',
    array['Administration', 'Email Support', 'Data Entry'],
    140,
    320,
    1,
    10
  ),
  (
    'Administration',
    'Tender Administration Assistant',
    'Supports tender preparation, compliance checks and document control.',
    array['Tender Admin', 'Document Control', 'Formatting'],
    160,
    380,
    1,
    10
  ),
  (
    'Administration',
    'Data Capturer',
    'Accurate data-capture professional experienced with spreadsheets and online systems.',
    array['Data Entry', 'Excel', 'Document Management'],
    120,
    280,
    1,
    8
  ),
  (
    'Finance',
    'Freelance Bookkeeper',
    'Supports transaction capture, account reconciliation and monthly reporting.',
    array['Bookkeeping', 'Reconciliation', 'Excel'],
    220,
    500,
    2,
    12
  ),
  (
    'Finance',
    'Financial Reporting Assistant',
    'Creates financial spreadsheets, summaries and management reports.',
    array['Excel', 'Financial Reporting', 'Data Analysis'],
    200,
    480,
    2,
    10
  ),
  (
    'Education',
    'Training Content Developer',
    'Develops training slides, worksheets, guides and online learning content.',
    array['Training Content', 'PowerPoint', 'Instructional Design'],
    220,
    500,
    2,
    12
  )
on conflict do nothing;


-- ============================================================
-- 5. PROPOSAL TEMPLATE LIBRARY
-- ============================================================

insert into public.demo_proposal_templates (
  category,
  proposal_template,
  minimum_completion_days,
  maximum_completion_days,
  bid_percentage_min,
  bid_percentage_max
)
values
  (
    'Engineering',
    'Good day. I have practical experience producing accurate mechanical models and manufacturing drawings. I can review your requirements carefully and deliver a professional drawing package within the agreed timeline.',
    4,
    18,
    78,
    105
  ),
  (
    'Engineering',
    'Hello. I have completed similar mechanical design and drafting projects using SolidWorks, Inventor and AutoCAD. I can assist with the modelling, drawing preparation and final revisions.',
    5,
    20,
    80,
    110
  ),
  (
    'CAD Drafting',
    'Good day. I can convert your supplied information into clean and accurate CAD drawings. All drawings will be checked for dimensions, consistency and professional presentation.',
    2,
    12,
    75,
    100
  ),
  (
    'Mining',
    'Hello. I have experience supporting mining and bulk-material-handling projects. I can prepare practical drawings that consider fabrication, installation and maintenance requirements.',
    6,
    25,
    82,
    110
  ),
  (
    'Electrical',
    'Good day. I can prepare the required electrical drawings and documentation using the supplied equipment and design information. I will ensure the drawing set is clear and properly organised.',
    4,
    18,
    80,
    108
  ),
  (
    'Renewable Energy',
    'Hello. I can assist with the solar layout, equipment schedule and supporting design documentation. I will work from your site information and electricity requirements.',
    4,
    18,
    78,
    105
  ),
  (
    'Civil Engineering',
    'Good day. I have experience preparing civil layouts and construction drawings. I can develop the required information accurately and incorporate your review comments.',
    5,
    22,
    80,
    108
  ),
  (
    'Architecture',
    'Hello. I can develop the requested plans and presentation drawings from your brief and reference information. The final work will be clear, professional and ready for review.',
    5,
    22,
    78,
    108
  ),
  (
    'Web Development',
    'Good day. I specialise in responsive web development and can build the requested solution using modern, maintainable technologies. I will provide regular progress updates and test the final result thoroughly.',
    7,
    30,
    80,
    110
  ),
  (
    'Software Development',
    'Hello. I can develop the required functionality using a structured and secure approach. I will confirm the key requirements first, then provide tested and documented work.',
    7,
    35,
    82,
    112
  ),
  (
    'IT Support',
    'Good day. I can assist with remote troubleshooting and user support. I will communicate clearly, document the issue and work toward a practical resolution.',
    1,
    7,
    75,
    100
  ),
  (
    'Data Management',
    'Hello. I can clean, organise and analyse your data and provide a practical reporting solution. I will check the source information carefully before building the final report.',
    3,
    15,
    75,
    105
  ),
  (
    'Graphic Design',
    'Good day. I can create a professional design that reflects your brand and target market. I will provide clear concepts and revise the selected direction based on your feedback.',
    3,
    14,
    75,
    105
  ),
  (
    'UI/UX Design',
    'Hello. I can create a modern and user-friendly interface based on your requirements. The design will focus on clarity, consistency and a smooth user experience.',
    5,
    20,
    80,
    108
  ),
  (
    'Video Editing',
    'Good day. I can edit your supplied footage into a polished and engaging final video. I will include clean transitions, suitable text and professional pacing.',
    3,
    14,
    75,
    105
  ),
  (
    'Marketing',
    'Hello. I can help plan and execute a professional marketing campaign suited to your audience and business goals. I will also provide clear reporting on the work completed.',
    7,
    30,
    80,
    110
  ),
  (
    'Writing',
    'Good day. I can prepare clear, professional and well-structured content for your project. I will research the topic, follow your preferred tone and include revisions.',
    3,
    15,
    75,
    105
  ),
  (
    'Administration',
    'Hello. I am organised, reliable and comfortable working with documents, email and spreadsheets. I can complete the required administrative work accurately and on time.',
    2,
    14,
    72,
    100
  ),
  (
    'Finance',
    'Good day. I can organise the supplied financial information and prepare accurate bookkeeping or reporting records. All information will be handled carefully and confidentially.',
    4,
    18,
    78,
    105
  ),
  (
    'Education',
    'Hello. I can develop clear and structured learning material suitable for the intended audience. The final content will be professionally formatted and easy to follow.',
    4,
    18,
    75,
    105
  ),
  (
    'General',
    'Good day. I have reviewed the project requirements and would be pleased to assist. I am committed to clear communication, reliable delivery and professional-quality work.',
    3,
    18,
    75,
    105
  )
on conflict do nothing;


-- ============================================================
-- 6. ENGINE SETTINGS
-- ============================================================

insert into public.demo_marketplace_settings (
  setting_key,
  setting_value,
  description
)
values
  (
    'target_demo_clients',
    '48'::jsonb,
    'Preferred number of demo clients maintained by the marketplace engine.'
  ),
  (
    'target_demo_freelancers',
    '100'::jsonb,
    'Preferred number of demo freelancer profiles maintained by the marketplace engine.'
  ),
  (
    'target_demo_jobs',
    '108'::jsonb,
    'Preferred demo job count. Combined with existing real jobs, this should produce approximately 140 total jobs.'
  ),
  (
    'target_demo_applications',
    '200'::jsonb,
    'Preferred number of demo applications maintained by the marketplace engine.'
  ),
  (
    'job_expiry_days',
    '14'::jsonb,
    'Default number of days before a generated demo job expires.'
  ),
  (
    'featured_job_percentage',
    '15'::jsonb,
    'Approximate percentage of generated demo jobs marked as featured.'
  ),
  (
    'verified_freelancer_percentage',
    '85'::jsonb,
    'Approximate percentage of generated demo freelancers marked as verified.'
  ),
  (
    'top_rated_freelancer_percentage',
    '20'::jsonb,
    'Approximate percentage of generated demo freelancers marked as top rated.'
  ),
  (
    'minimum_applications_per_job',
    '1'::jsonb,
    'Minimum preferred number of generated applications per demo job.'
  ),
  (
    'maximum_applications_per_job',
    '8'::jsonb,
    'Maximum number of generated applications per demo job.'
  )
on conflict (setting_key)
do update set
  setting_value = excluded.setting_value,
  description = excluded.description,
  updated_at = now();


-- ============================================================
-- 7. VERIFICATION
-- ============================================================

select
  (select count(*)
   from public.demo_marketplace_locations
   where is_active = true) as active_locations,

  (select count(*)
   from public.demo_company_templates
   where is_active = true) as active_company_templates,

  (select count(*)
   from public.demo_job_templates
   where is_active = true) as active_job_templates,

  (select count(*)
   from public.demo_freelancer_templates
   where is_active = true) as active_freelancer_templates,

  (select count(*)
   from public.demo_proposal_templates
   where is_active = true) as active_proposal_templates,

  (select count(*)
   from public.demo_first_names
   where is_active = true) as active_first_names,

  (select count(*)
   from public.demo_last_names
   where is_active = true) as active_last_names;