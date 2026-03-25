import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource, DeepPartial } from 'typeorm';
import { AppModule } from '../app.module';
import { Domain } from '../matching/entities/domain.entity';
import { ProfessionalRole } from '../matching/entities/professional-role.entity';
import { RoleAlias } from '../matching/entities/role-alias.entity';

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function bootstrap() {
  console.log('Starting bootstrap...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('App context created.');

  const logger = new Logger('SeedRolesAndDomains');

  try {
    const dataSource = app.get(DataSource);

    const domainRepo = dataSource.getRepository(Domain);
    const roleRepo = dataSource.getRepository(ProfessionalRole);
    const roleAliasRepo = dataSource.getRepository(RoleAlias);

    const domains: { name: string }[] = [
      { name: 'FinTech' },
      { name: 'HealthTech' },
      { name: 'EdTech' },
      { name: 'E-commerce' },
      { name: 'SaaS' },
      { name: 'Cybersecurity' },
      { name: 'Blockchain & Web3' },
      { name: 'Artificial Intelligence' },
      { name: 'Internet of Things (IoT)' },
      { name: 'Robotics' },
      { name: 'Biotech' },
      { name: 'CleanTech' },
      { name: 'AgriTech' },
      { name: 'AdTech' },
      { name: 'Gaming' },
      { name: 'Media & Entertainment' },
      { name: 'Real Estate' },
      { name: 'Logistics & Supply Chain' },
      { name: 'Automotive' },
      { name: 'Aerospace' },
      { name: 'Energy' },
      { name: 'Oil & Gas' },
      { name: 'Telecommunications' },
      { name: 'Travel & Hospitality' },
      { name: 'LegalTech' },
      { name: 'InsurTech' },
      { name: 'PropTech' },
      { name: 'GovTech' },
      { name: 'Non-profit' },
      { name: 'Consulting' },
      { name: 'Web Development' },
      { name: 'Mobile App Development' },
      { name: 'Data Analysis' },
      { name: 'Cloud Computing' },
      { name: 'Digital Marketing' },
      { name: 'Design' },
      { name: 'Product Management' },
      { name: 'Business' },
      { name: 'Finance' },
      { name: 'Operations' },
      { name: 'Human Resources' },
      { name: 'Legal' },
      { name: 'Embedded Systems' },
    ];

    const roles: {
      name: string;
      primaryDomainName: string;
      aliases?: string[];
    }[] = [
      { name: 'Frontend Developer', primaryDomainName: 'Web Development', aliases: ['Frontend Engineer', 'UI Developer', 'React Developer'] },
      { name: 'Backend Developer', primaryDomainName: 'Web Development', aliases: ['Backend Engineer', 'API Developer', 'Server-side Developer'] },
      { name: 'Full Stack Developer', primaryDomainName: 'Web Development', aliases: ['Fullstack Developer', 'Full Stack Engineer'] },
      { name: 'DevOps Engineer', primaryDomainName: 'Cloud Computing', aliases: ['Platform Engineer', 'Infrastructure Engineer'] },
      { name: 'Mobile Developer', primaryDomainName: 'Mobile App Development', aliases: ['Android Developer', 'iOS Developer', 'React Native Developer', 'Flutter Developer'] },
      { name: 'Data Scientist', primaryDomainName: 'Data Analysis', aliases: ['ML Scientist'] },
      { name: 'Machine Learning Engineer', primaryDomainName: 'Artificial Intelligence', aliases: ['ML Engineer', 'AI Engineer'] },
      { name: 'Software Architect', primaryDomainName: 'Web Development', aliases: ['Solutions Architect'] },
      { name: 'QA Engineer', primaryDomainName: 'Web Development', aliases: ['Test Engineer', 'Quality Assurance Engineer', 'Automation Tester'] },
      { name: 'Security Engineer', primaryDomainName: 'Cybersecurity', aliases: ['Cybersecurity Engineer', 'Information Security Engineer'] },
      { name: 'Blockchain Developer', primaryDomainName: 'Blockchain & Web3', aliases: ['Web3 Developer'] },
      { name: 'Game Developer', primaryDomainName: 'Gaming', aliases: ['Game Engineer'] },
      { name: 'Embedded Systems Engineer', primaryDomainName: 'Embedded Systems', aliases: ['Embedded Engineer'] },
      { name: 'Site Reliability Engineer', primaryDomainName: 'Cloud Computing', aliases: ['SRE'] },

      { name: 'UI/UX Designer', primaryDomainName: 'Design', aliases: ['UX Designer', 'UI Designer', 'Product Designer'] },
      { name: 'Product Designer', primaryDomainName: 'Design', aliases: [] },
      { name: 'Graphic Designer', primaryDomainName: 'Design', aliases: ['Visual Designer'] },
      { name: 'Visual Designer', primaryDomainName: 'Design', aliases: [] },
      { name: 'Interaction Designer', primaryDomainName: 'Design', aliases: ['IxD Designer'] },

      { name: 'Product Manager', primaryDomainName: 'Product Management', aliases: ['PM'] },
      { name: 'Project Manager', primaryDomainName: 'Product Management', aliases: [] },
      { name: 'Scrum Master', primaryDomainName: 'Product Management', aliases: [] },
      { name: 'Product Owner', primaryDomainName: 'Product Management', aliases: [] },

      { name: 'Digital Marketer', primaryDomainName: 'Digital Marketing', aliases: ['Digital Marketing Specialist', 'Performance Marketer'] },
      { name: 'Content Strategist', primaryDomainName: 'Digital Marketing', aliases: ['Content Marketer'] },
      { name: 'SEO Specialist', primaryDomainName: 'Digital Marketing', aliases: ['SEO Analyst'] },
      { name: 'Social Media Manager', primaryDomainName: 'Digital Marketing', aliases: ['Social Media Specialist'] },
      { name: 'Growth Hacker', primaryDomainName: 'Digital Marketing', aliases: ['Growth Marketer'] },

      { name: 'Sales Representative', primaryDomainName: 'Business', aliases: ['Sales Executive'] },
      { name: 'Account Executive', primaryDomainName: 'Business', aliases: [] },
      { name: 'Sales Manager', primaryDomainName: 'Business', aliases: [] },
      { name: 'Business Development Manager', primaryDomainName: 'Business', aliases: ['BDM', 'Business Development Executive'] },

      { name: 'Financial Analyst', primaryDomainName: 'Finance', aliases: [] },
      { name: 'Accountant', primaryDomainName: 'Finance', aliases: [] },
      { name: 'Investment Banker', primaryDomainName: 'Finance', aliases: [] },
      { name: 'Chief Financial Officer', primaryDomainName: 'Finance', aliases: ['CFO'] },

      { name: 'Operations Manager', primaryDomainName: 'Operations', aliases: [] },
      { name: 'Supply Chain Manager', primaryDomainName: 'Operations', aliases: [] },
      { name: 'Logistics Coordinator', primaryDomainName: 'Operations', aliases: [] },

      { name: 'HR Manager', primaryDomainName: 'Human Resources', aliases: ['Human Resources Manager'] },
      { name: 'Recruiter', primaryDomainName: 'Human Resources', aliases: ['Talent Recruiter'] },
      { name: 'Talent Acquisition Specialist', primaryDomainName: 'Human Resources', aliases: ['TA Specialist'] },

      { name: 'Legal Counsel', primaryDomainName: 'Legal', aliases: [] },
      { name: 'Corporate Lawyer', primaryDomainName: 'Legal', aliases: [] },

      { name: 'Chief Executive Officer', primaryDomainName: 'Business', aliases: ['CEO'] },
      { name: 'Chief Technology Officer', primaryDomainName: 'Cloud Computing', aliases: ['CTO'] },
      { name: 'Chief Operating Officer', primaryDomainName: 'Operations', aliases: ['COO'] },
      { name: 'Founder', primaryDomainName: 'Business', aliases: ['Co-Founder', 'Startup Founder'] },
    ];

    logger.log(`Seeding ${domains.length} domains...`);

    const domainMap = new Map<string, Domain>();

    for (const domainData of domains) {
      const normalizedName = normalize(domainData.name);

      let domain = await domainRepo.findOne({
        where: { normalizedName },
      });

      if (!domain) {
        const domainPayload: DeepPartial<Domain> = {
          name: domainData.name,
          normalizedName,
          usageCount: 0,
          isVerified: true,
        };

        domain = domainRepo.create(domainPayload);
        domain = await domainRepo.save(domain);
      } else {
        domain.name = domainData.name;
        domain.isVerified = true;
        domain = await domainRepo.save(domain);
      }

      domainMap.set(normalizedName, domain);
      logger.log(`Domain ready: ${domain.name}`);
    }

    logger.log(`Seeding ${roles.length} roles...`);

    const roleMap = new Map<string, ProfessionalRole>();

    for (const roleData of roles) {
      const normalizedRoleName = normalize(roleData.name);
      const domain = domainMap.get(normalize(roleData.primaryDomainName));

      if (!domain) {
        throw new Error(
          `Primary domain not found for role "${roleData.name}": ${roleData.primaryDomainName}`,
        );
      }

      let role = await roleRepo.findOne({
        where: { normalizedName: normalizedRoleName },
      });

      if (!role) {
        const rolePayload: DeepPartial<ProfessionalRole> = {
          name: roleData.name,
          normalizedName: normalizedRoleName,
          primaryDomainId: domain.id,
          usageCount: 0,
          isVerified: true,
        };

        role = roleRepo.create(rolePayload);
      } else {
        role.name = roleData.name;
        role.primaryDomainId = domain.id;
        role.isVerified = true;
      }

      role = await roleRepo.save(role);
      roleMap.set(normalizedRoleName, role);

      logger.log(`Role ready: ${role.name} -> ${domain.name}`);
    }

    logger.log('Seeding role aliases...');

    for (const roleData of roles) {
      const role = roleMap.get(normalize(roleData.name));
      if (!role) continue;

      for (const alias of roleData.aliases ?? []) {
        const normalizedAlias = normalize(alias);

        let roleAlias = await roleAliasRepo.findOne({
          where: { normalizedAlias },
        });

        if (!roleAlias) {
          const aliasPayload: DeepPartial<RoleAlias> = {
            professionalRoleId: role.id,
            alias,
            normalizedAlias,
          };

          roleAlias = roleAliasRepo.create(aliasPayload);
        } else {
          roleAlias.professionalRoleId = role.id;
          roleAlias.alias = alias;
        }

        await roleAliasRepo.save(roleAlias);
        logger.log(`Alias ready: ${alias} -> ${role.name}`);
      }
    }

    logger.log('Seeding completed.');
  } catch (error) {
    logger.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();