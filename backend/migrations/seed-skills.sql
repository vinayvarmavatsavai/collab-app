INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
-- ================= PROGRAMMING LANGUAGES =================
('JavaScript','javascript','programming_language',500,'high',true,'seed'),
('TypeScript','typescript','programming_language',450,'high',true,'seed'),
('Python','python','programming_language',600,'high',true,'seed'),
('Java','java','programming_language',550,'high',true,'seed'),
('C','c','programming_language',300,'high',true,'seed'),
('C++','cplusplus','programming_language',320,'high',true,'seed'),
('C#','csharp','programming_language',340,'high',true,'seed'),
('Go','go','programming_language',280,'high',true,'seed'),
('Rust','rust','programming_language',260,'high',true,'seed'),
('Kotlin','kotlin','programming_language',240,'high',true,'seed'),
('Swift','swift','programming_language',230,'high',true,'seed'),
('PHP','php','programming_language',400,'high',true,'seed'),
('Ruby','ruby','programming_language',220,'high',true,'seed'),
('Dart','dart','programming_language',200,'high',true,'seed'),
('Scala','scala','programming_language',180,'high',true,'seed'),
('R','r','programming_language',210,'high',true,'seed'),
('MATLAB','matlab','programming_language',160,'high',true,'seed'),
('Bash','bash','programming_language',300,'high',true,'seed'),
('Shell Scripting','shellscripting','programming_language',280,'high',true,'seed'),
('PowerShell','powershell','programming_language',190,'high',true,'seed'),

-- ================= FRONTEND =================
('React','react','frontend',900,'high',true,'seed'),
('Next.js','nextjs','frontend',850,'high',true,'seed'),
('Vue.js','vuejs','frontend',500,'high',true,'seed'),
('Nuxt.js','nuxtjs','frontend',320,'high',true,'seed'),
('Angular','angular','frontend',450,'high',true,'seed'),
('Svelte','svelte','frontend',300,'high',true,'seed'),
('HTML','html','frontend',700,'high',true,'seed'),
('CSS','css','frontend',700,'high',true,'seed'),
('Tailwind CSS','tailwindcss','frontend',650,'high',true,'seed'),
('Bootstrap','bootstrap','frontend',600,'high',true,'seed'),
('Material UI','materialui','frontend',480,'high',true,'seed'),
('Chakra UI','chakrui','frontend',300,'high',true,'seed'),
('Redux','redux','frontend',620,'high',true,'seed'),
('Zustand','zustand','frontend',220,'high',true,'seed'),
('Framer Motion','framermotion','frontend',240,'high',true,'seed'),
('Webpack','webpack','frontend',500,'high',true,'seed'),
('Vite','vite','frontend',520,'high',true,'seed'),
('Turborepo','turborepo','frontend',200,'high',true,'seed'),

-- ================= BACKEND =================
('Node.js','nodejs','backend',900,'high',true,'seed'),
('Express.js','expressjs','backend',700,'high',true,'seed'),
('NestJS','nestjs','backend',500,'high',true,'seed'),
('FastAPI','fastapi','backend',480,'high',true,'seed'),
('Django','django','backend',650,'high',true,'seed'),
('Flask','flask','backend',620,'high',true,'seed'),
('Spring Boot','springboot','backend',600,'high',true,'seed'),
('ASP.NET','aspnet','backend',500,'high',true,'seed'),
('GraphQL','graphql','backend',650,'high',true,'seed'),
('REST API','restapi','backend',700,'high',true,'seed'),
('tRPC','trpc','backend',260,'high',true,'seed'),
('Prisma','prisma','backend',420,'high',true,'seed'),

-- ================= DATABASE =================
('PostgreSQL','postgresql','database',800,'high',true,'seed'),
('MySQL','mysql','database',750,'high',true,'seed'),
('MongoDB','mongodb','database',720,'high',true,'seed'),
('Redis','redis','database',680,'high',true,'seed'),
('SQLite','sqlite','database',400,'high',true,'seed'),
('MariaDB','mariadb','database',300,'high',true,'seed'),
('Firebase','firebase','database',500,'high',true,'seed'),
('Supabase','supabase','database',420,'high',true,'seed'),
('DynamoDB','dynamodb','database',350,'high',true,'seed'),
('Elasticsearch','elasticsearch','database',450,'high',true,'seed'),

-- ================= DEVOPS =================
('Docker','docker','devops',900,'high',true,'seed'),
('Kubernetes','kubernetes','devops',800,'high',true,'seed'),
('Git','git','devops',950,'high',true,'seed'),
('GitHub Actions','githubactions','devops',600,'high',true,'seed'),
('GitLab CI','gitlabci','devops',450,'high',true,'seed'),
('Linux','linux','devops',850,'high',true,'seed'),
('Nginx','nginx','devops',650,'high',true,'seed'),

-- ================= CLOUD =================
('AWS','aws','cloud',900,'high',true,'seed'),
('Google Cloud','googlecloud','cloud',700,'high',true,'seed'),
('Microsoft Azure','azure','cloud',650,'high',true,'seed'),
('Vercel','vercel','cloud',600,'high',true,'seed'),
('Netlify','netlify','cloud',500,'high',true,'seed'),

-- ================= BLOCKCHAIN =================
('Ethereum','ethereum','blockchain',700,'high',true,'seed'),
('Solidity','solidity','blockchain',750,'high',true,'seed'),
('Smart Contracts','smartcontracts','blockchain',650,'high',true,'seed'),
('Hardhat','hardhat','blockchain',520,'high',true,'seed'),
('Foundry','foundry','blockchain',400,'high',true,'seed'),
('Ethers.js','ethersjs','blockchain',480,'high',true,'seed'),
('Web3.js','web3js','blockchain',460,'high',true,'seed'),
('IPFS','ipfs','blockchain',500,'high',true,'seed'),
('Polygon','polygon','blockchain',420,'high',true,'seed'),
('Solana','solana','blockchain',450,'high',true,'seed'),
('Arweave','arweave','blockchain',260,'high',true,'seed'),
('The Graph','thegraph','blockchain',300,'high',true,'seed'),

-- ================= AI / ML =================
('Machine Learning','machinelearning','ai_ml',800,'high',true,'seed'),
('Deep Learning','deeplearning','ai_ml',700,'high',true,'seed'),
('TensorFlow','tensorflow','ai_ml',650,'high',true,'seed'),
('PyTorch','pytorch','ai_ml',700,'high',true,'seed'),
('Natural Language Processing','naturallanguageprocessing','ai_ml',620,'high',true,'seed'),
('Computer Vision','computervision','ai_ml',600,'high',true,'seed'),
('Data Analysis','dataanalysis','ai_ml',650,'high',true,'seed'),
('Data Science','datascience','ai_ml',720,'high',true,'seed'),
('Hugging Face','huggingface','ai_ml',500,'high',true,'seed'),
('LangChain','langchain','ai_ml',450,'high',true,'seed'),
('Vector Databases','vectordatabases','ai_ml',400,'high',true,'seed'),
('RAG','rag','ai_ml',350,'high',true,'seed'),

-- ================= DESIGN =================
('Figma','figma','design',800,'high',true,'seed'),
('Adobe Photoshop','adobephotoshop','design',700,'high',true,'seed'),
('Adobe Illustrator','adobeillustrator','design',650,'high',true,'seed'),
('UI Design','uidesign','design',720,'high',true,'seed'),
('UX Design','uxdesign','design',720,'high',true,'seed'),
('Product Design','productdesign','design',600,'high',true,'seed'),
('Wireframing','wireframing','design',500,'high',true,'seed'),
('Prototyping','prototyping','design',520,'high',true,'seed'),
('User Research','userresearch','design',480,'high',true,'seed'),
('Interaction Design','interactiondesign','design',450,'high',true,'seed'),

-- ================= MARKETING =================
VALUES
-- ================= MARKETING =================
('Search Engine Optimization','seo','marketing',700,'high',true,'seed'),
('Content Marketing','contentmarketing','marketing',600,'high',true,'seed'),
('Social Media Marketing','socialmediamarketing','marketing',650,'high',true,'seed'),
('Email Marketing','emailmarketing','marketing',550,'high',true,'seed'),
('Performance Marketing','performancemarketing','marketing',520,'high',true,'seed'),
('Growth Hacking','growthhacking','marketing',500,'high',true,'seed'),
('Google Analytics','googleanalytics','marketing',680,'high',true,'seed'),
('Google Ads','googleads','marketing',600,'high',true,'seed'),
('Marketing Strategy','marketingstrategy','marketing',620,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Circuit Design','circuitdesign','engineering',400,'high',true,'seed'),
('Analog Electronics','analogelectronics','engineering',350,'high',true,'seed'),
('Digital Electronics','digitalelectronics','engineering',420,'high',true,'seed'),
('VLSI Design','vlsidesign','engineering',300,'high',true,'seed'),
('Embedded Systems','embeddedsystems','engineering',500,'high',true,'seed'),
('Microcontrollers','microcontrollers','engineering',450,'high',true,'seed'),
('Arduino','arduino','engineering',600,'high',true,'seed'),
('Raspberry Pi','raspberrypi','engineering',520,'high',true,'seed'),
('PCB Design','pcbdesign','engineering',380,'high',true,'seed'),
('Signal Processing','signalprocessing','engineering',360,'high',true,'seed'),
('FPGA','fpga','engineering',300,'high',true,'seed'),
('Verilog','verilog','engineering',280,'high',true,'seed'),
('SystemVerilog','systemverilog','engineering',240,'high',true,'seed'),
('MATLAB Simulink','matlabsimulink','engineering',260,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Power Systems','powersystems','engineering',350,'high',true,'seed'),
('Electrical Machines','electricalmachines','engineering',320,'high',true,'seed'),
('Control Systems','controlsystems','engineering',400,'high',true,'seed'),
('Power Electronics','powerelectronics','engineering',360,'high',true,'seed'),
('High Voltage Engineering','highvoltageengineering','engineering',220,'high',true,'seed'),
('PLC Programming','plcprogramming','engineering',420,'high',true,'seed'),
('SCADA','scada','engineering',380,'high',true,'seed'),
('Industrial Automation','industrialautomation','engineering',450,'high',true,'seed'),
('Motor Control','motorcontrol','engineering',260,'high',true,'seed'),
('Renewable Energy Systems','renewableenergysystems','engineering',300,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('AutoCAD','autocad','engineering',700,'high',true,'seed'),
('SolidWorks','solidworks','engineering',650,'high',true,'seed'),
('CATIA','catia','engineering',520,'high',true,'seed'),
('ANSYS','ansys','engineering',600,'high',true,'seed'),
('Finite Element Analysis','fea','engineering',500,'high',true,'seed'),
('Thermodynamics','thermodynamics','engineering',450,'high',true,'seed'),
('Fluid Mechanics','fluidmechanics','engineering',430,'high',true,'seed'),
('Heat Transfer','heattransfer','engineering',420,'high',true,'seed'),
('HVAC Systems','hvacsystems','engineering',350,'high',true,'seed'),
('Manufacturing Processes','manufacturingprocesses','engineering',400,'high',true,'seed'),
('Mechanical Design','mechanicaldesign','engineering',520,'high',true,'seed'),
('Robotics','robotics','engineering',650,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Structural Analysis','structuralanalysis','engineering',420,'high',true,'seed'),
('STAAD Pro','staadpro','engineering',350,'high',true,'seed'),
('ETABS','etabs','engineering',360,'high',true,'seed'),
('Revit','revit','engineering',500,'high',true,'seed'),
('Construction Management','constructionmanagement','engineering',480,'high',true,'seed'),
('Surveying','surveying','engineering',300,'high',true,'seed'),
('Geotechnical Engineering','geotechnicalengineering','engineering',260,'high',true,'seed'),
('Transportation Engineering','transportationengineering','engineering',240,'high',true,'seed'),
('Quantity Surveying','quantitysurveying','engineering',280,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Petroleum Engineering','petroleumengineering','engineering',260,'high',true,'seed'),
('Reservoir Engineering','reservoirengineering','engineering',240,'high',true,'seed'),
('Drilling Engineering','drillingengineering','engineering',220,'high',true,'seed'),
('Process Engineering','processengineering','engineering',420,'high',true,'seed'),
('Chemical Process Design','chemicalprocessdesign','engineering',300,'high',true,'seed'),
('Aspen HYSYS','aspenhysys','engineering',280,'high',true,'seed'),
('Aspen Plus','aspenplus','engineering',260,'high',true,'seed'),
('Process Simulation','processsimulation','engineering',240,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Financial Accounting','financialaccounting','finance',700,'high',true,'seed'),
('Cost Accounting','costaccounting','finance',500,'high',true,'seed'),
('Taxation','taxation','finance',650,'high',true,'seed'),
('GST','gst','finance',600,'high',true,'seed'),
('Auditing','auditing','finance',620,'high',true,'seed'),
('Financial Modeling','financialmodeling','finance',720,'high',true,'seed'),
('Investment Analysis','investmentanalysis','finance',520,'high',true,'seed'),
('Equity Research','equityresearch','finance',480,'high',true,'seed'),
('Risk Management','riskmanagement','finance',500,'high',true,'seed'),
('Corporate Finance','corporatefinance','finance',540,'high',true,'seed'),
('Bookkeeping','bookkeeping','finance',450,'high',true,'seed'),
('Tally','tally','finance',650,'high',true,'seed'),
('QuickBooks','quickbooks','finance',520,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Business Analysis','businessanalysis','business',720,'high',true,'seed'),
('Project Management','projectmanagement','business',750,'high',true,'seed'),
('Agile Methodologies','agilemethodologies','business',680,'high',true,'seed'),
('Scrum','scrum','business',620,'high',true,'seed'),
('Kanban','kanban','business',580,'high',true,'seed'),
('Requirements Engineering','requirementsengineering','business',550,'high',true,'seed'),
('Stakeholder Management','stakeholdermanagement','business',520,'high',true,'seed'),
('Change Management','changemanagement','business',500,'high',true,'seed'),
('Business Process Management','businessprocessmanagement','business',480,'high',true,'seed'),
('Process Improvement','processimprovement','business',450,'high',true,'seed'),
('Lean Management','leanmanagement','business',420,'high',true,'seed'),
('Six Sigma','sixsigma','business',400,'high',true,'seed'),
('PMP','pmp','business',550,'high',true,'seed'),
('PRINCE2','prince2','business',380,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Supply Chain Management','supplychainmanagement','operations',620,'high',true,'seed'),
('Logistics Management','logisticsmanagement','operations',580,'high',true,'seed'),
('Inventory Management','inventorymanagement','operations',550,'high',true,'seed'),
('Procurement','procurement','operations',520,'high',true,'seed'),
('Sourcing','sourcing','operations',500,'high',true,'seed'),
('Vendor Management','vendormanagement','operations',480,'high',true,'seed'),
('Warehouse Management','warehousemanagement','operations',450,'high',true,'seed'),
('Demand Planning','demandplanning','operations',420,'high',true,'seed'),
('Sales and Operations Planning','salesandoperationsplanning','operations',400,'high',true,'seed'),
('SCM Software','scmsoftware','operations',380,'high',true,'seed'),
('SAP SCM','sapscm','operations',350,'high',true,'seed'),
('Oracle SCM','oraclescm','operations',320,'high',true,'seed'),
('JDA','jda','operations',280,'high',true,'seed'),
('Manhattan Associates','manhattanassociates','operations',260,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Human Resource Management','humanresourcemanagement','hr',700,'high',true,'seed'),
('Recruitment','recruitment','hr',650,'high',true,'seed'),
('Talent Acquisition','talentacquisition','hr',620,'high',true,'seed'),
('Talent Management','talentmanagement','hr',580,'high',true,'seed'),
('Performance Management','performancemanagement','hr',550,'high',true,'seed'),
('Compensation and Benefits','compensationandbenefits','hr',520,'high',true,'seed'),
('Employee Relations','employeerelations','hr',500,'high',true,'seed'),
('HR Analytics','hranalytics','hr',480,'high',true,'seed'),
('HRIS','hris','hr',450,'high',true,'seed'),
('SuccessFactors','successfactors','hr',420,'high',true,'seed'),
('Workday','workday','hr',400,'high',true,'seed'),
('SAP HR','saph r','hr',380,'high',true,'seed'),
('Oracle HCM','oraclehcm','hr',350,'high',true,'seed'),
('Recruiting Software','recruitingsoftware','hr',320,'high',true,'seed'),
('ATS','ats','hr',300,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Legal','legal','legal',600,'high',true,'seed'),
('Contract Drafting','contractdrafting','legal',550,'high',true,'seed'),
('Intellectual Property','intellectualproperty','legal',520,'high',true,'seed'),
('Patents','patents','legal',480,'high',true,'seed'),
('Trademarks','trademarks','legal',450,'high',true,'seed'),
('Copyright','copyright','legal',420,'high',true,'seed'),
('Corporate Law','corporatelaw','legal',500,'high',true,'seed'),
('Mergers and Acquisitions','mergersandacquisitions','legal',480,'high',true,'seed'),
('Venture Capital','venturecapital','legal',550,'high',true,'seed'),
('Private Equity','privateequity','legal',520,'high',true,'seed'),
('Fundraising','fundraising','legal',580,'high',true,'seed'),
('Term Sheets','termssheets','legal',450,'high',true,'seed'),
('Due Diligence','duediligence','legal',480,'high',true,'seed'),
('Compliance','compliance','legal',550,'high',true,'seed'),
('Regulatory Affairs','regulatoryaffairs','legal',520,'high',true,'seed'),
('Legal Tech','legaltech','legal',400,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Sales','sales','sales',750,'high',true,'seed'),
('Business Development','businessdevelopment','sales',720,'high',true,'seed'),
('Lead Generation','leadgeneration','sales',680,'high',true,'seed'),
('Cold Calling','coldcalling','sales',620,'high',true,'seed'),
('Salesforce','salesforce','sales',650,'high',true,'seed'),
('CRM','crm','sales',600,'high',true,'seed'),
('Account Management','accountmanagement','sales',580,'high',true,'seed'),
('Sales Strategy','salesstrategy','sales',550,'high',true,'seed'),
('Sales Training','salestraining','sales',520,'high',true,'seed'),
('Channel Sales','channelsales','sales',480,'high',true,'seed'),
('B2B Sales','b2bsales','sales',550,'high',true,'seed'),
('B2C Sales','b2csales','sales',520,'high',true,'seed'),
('Enterprise Sales','enterprisesales','sales',500,'high',true,'seed'),
('SaaS Sales','saassales','sales',580,'high',true,'seed'),
('Sales Operations','salesoperations','sales',450,'high',true,'seed'),
('Sales Enablement','salesenablement','sales',420,'high',true,'seed'),
('Negotiation','negotiation','sales',600,'high',true,'seed'),
('Closing','closing','sales',550,'high',true,'seed'),
('Upselling','upselling','sales',520,'high',true,'seed'),
('Cross-selling','crossselling','sales',500,'high',true,'seed');

INSERT INTO canonical_skills
(name, normalized_name, category, usage_count, confidence_level, is_verified, source)
VALUES
('Marketing','marketing','marketing',700,'high',true,'seed'),
('Digital Marketing','digitalmarketing','marketing',650,'high',true,'seed'),
('Content Marketing','contentmarketing','marketing',620,'high',true,'seed'),
('SEO','seo','marketing',680,'high',true,'seed'),
('SEM','sem','marketing',620,'high',true,'seed'),
('PPC','ppc','marketing',600,'high',true,'seed'),
('Social Media Marketing','socialmediamarketing','marketing',650,'high',true,'seed'),
('Marketing Strategy','marketingstrategy','marketing',580,'high',true,'seed'),
('Brand Management','brandmanagement','marketing',550,'high',true,'seed'),
('Market Research','marketresearch','marketing',520,'high',true,'seed'),
('Marketing Analytics','marketinganalytics','marketing',500,'high',true,'seed'),
('Marketing Automation','marketingautomation','marketing',480,'high',true,'seed'),
('HubSpot','hubspot','marketing',620,'high',true,'seed'),
('Mailchimp','mailchimp','marketing',580,'high',true,'seed'),
('Google Analytics','googleanalytics','marketing',650,'high',true,'seed'),
('Content Creation','contentcreation','marketing',600,'high',true,'seed'),
('Copywriting','copywriting','marketing',580,'high',true,'seed'),
('Video Marketing','videomarketing','marketing',550,'high',true,'seed'),
('Influencer Marketing','influencermarketing','marketing',520,'high',true,'seed'),
('Affiliate Marketing','affiliatemarketing','marketing',500,'high',true,'seed'),
('Growth Hacking','growthhacking','marketing',580,'high',true,'seed'),
('Performance Marketing','performancemarketing','marketing',550,'high',true,'seed'),
('Product Marketing','productmarketing','marketing',520,'high',true,'seed'),
('Lifecycle Marketing','lifecyclemarketing','marketing',480,'high',true,'seed');

-- Create common aliases
INSERT INTO skill_aliases (canonical_skill_id, alias, normalized_alias)
SELECT id, 'JS', 'js' FROM canonical_skills WHERE normalized_name = 'javascript'
UNION ALL
SELECT id, 'TS', 'ts' FROM canonical_skills WHERE normalized_name = 'typescript'
UNION ALL
SELECT id, 'next', 'next' FROM canonical_skills WHERE normalized_name = 'nextjs'
UNION ALL
SELECT id, 'next.js', 'nextjs' FROM canonical_skills WHERE normalized_name = 'nextjs'
UNION ALL
SELECT id, 'node', 'node' FROM canonical_skills WHERE normalized_name = 'nodejs'
UNION ALL
SELECT id, 'node.js', 'nodejs' FROM canonical_skills WHERE normalized_name = 'nodejs'
UNION ALL
SELECT id, 'express.js', 'expressjs' FROM canonical_skills WHERE normalized_name = 'express'
UNION ALL
SELECT id, 'nest', 'nest' FROM canonical_skills WHERE normalized_name = 'nestjs'
UNION ALL
SELECT id, 'nest.js', 'nestjs' FROM canonical_skills WHERE normalized_name = 'nestjs'
UNION ALL
SELECT id, 'postgres', 'postgres' FROM canonical_skills WHERE normalized_name = 'postgresql'
UNION ALL
SELECT id, 'psql', 'psql' FROM canonical_skills WHERE normalized_name = 'postgresql'
UNION ALL
SELECT id, 'mongo', 'mongo' FROM canonical_skills WHERE normalized_name = 'mongodb'
UNION ALL
SELECT id, 'k8s', 'k8s' FROM canonical_skills WHERE normalized_name = 'kubernetes'
UNION ALL
SELECT id, 'kube', 'kube' FROM canonical_skills WHERE normalized_name = 'kubernetes'
UNION ALL
SELECT id, 'gcp', 'gcp' FROM canonical_skills WHERE normalized_name = 'googlecloud'
UNION ALL
SELECT id, 'rn', 'rn' FROM canonical_skills WHERE normalized_name = 'reactnative'
UNION ALL
SELECT id, 'react-native', 'reactnative' FROM canonical_skills WHERE normalized_name = 'reactnative'
UNION ALL
SELECT id, 'eth', 'eth' FROM canonical_skills WHERE normalized_name = 'ethereum'
UNION ALL
SELECT id, 'ml', 'ml' FROM canonical_skills WHERE normalized_name = 'machinelearning'
UNION ALL
SELECT id, 'dl', 'dl' FROM canonical_skills WHERE normalized_name = 'deeplearning'
UNION ALL
SELECT id, 'tf', 'tf' FROM canonical_skills WHERE normalized_name = 'tensorflow'
UNION ALL
SELECT id, 'nlp', 'nlp' FROM canonical_skills WHERE normalized_name = 'naturallanguageprocessing'
UNION ALL
SELECT id, 'cv', 'cv' FROM canonical_skills WHERE normalized_name = 'computervision'
UNION ALL
SELECT id, 'ui', 'ui' FROM canonical_skills WHERE normalized_name = 'uiuxdesign'
UNION ALL
SELECT id, 'ux', 'ux' FROM canonical_skills WHERE normalized_name = 'uiuxdesign'
UNION ALL
SELECT id, 'rest', 'rest' FROM canonical_skills WHERE normalized_name = 'restapi'
UNION ALL
SELECT id, 'gql', 'gql' FROM canonical_skills WHERE normalized_name = 'graphql'
UNION ALL
SELECT id, 'ws', 'ws' FROM canonical_skills WHERE normalized_name = 'websockets'
ON CONFLICT DO NOTHING;

-- Print summary
SELECT 
    category,
    COUNT(*) as skill_count
FROM canonical_skills
GROUP BY category
ORDER BY skill_count DESC;

SELECT COUNT(*) as total_skills FROM canonical_skills;
SELECT COUNT(*) as total_aliases FROM skill_aliases;
